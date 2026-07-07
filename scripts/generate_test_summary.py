#!/usr/bin/env python3
"""
Generate a beautiful Markdown test summary from Playwright's JSON output,
including embedded screenshots from test-results/screenshots/.

Reads test-output.json, writes summary to GITHUB_STEP_SUMMARY and test_summary.md.
"""

import json
import os
import glob

RESULTS_FILE = 'test-output.json'
OUTPUT_FILE = 'test_summary.md'
SCREENSHOTS_DIR = 'test-results/screenshots'


def find_test_screenshots(test_num_prefix):
    """Find all screenshots for a test by matching filename prefix (e.g., 'test1', 'r1')."""
    screenshots = []
    if not os.path.exists(SCREENSHOTS_DIR):
        return screenshots

    pattern = os.path.join(SCREENSHOTS_DIR, f'{test_num_prefix}*.png')
    files = sorted(glob.glob(pattern))

    for f in files:
        basename = os.path.basename(f)
        rel_path = os.path.relpath(f, '.')
        # Create a user-friendly label from the filename
        # e.g., "test1-start-issuance-form.png" -> "Start: Issuance Form"
        parts = basename.replace('.png', '').split('-')
        # Skip the test prefix (e.g., "test1", "r5")
        label_parts = []
        for p in parts[1:]:
            label_parts.append(p.capitalize())
        label = ' '.join(label_parts)
        screenshots.append({'path': rel_path, 'label': label or basename})

    return screenshots


def load_results(path):
    if not os.path.exists(path):
        print(f"⚠️ {path} not found")
        return None
    with open(path) as f:
        return json.load(f)


def flatten_specs(suite, suite_name=""):
    """Recursively extract all tests from nested Playwright JSON suites."""
    results = []
    name = suite.get('title', '')
    full_name = f"{suite_name} › {name}" if suite_name and name else name or suite_name
    for item in suite.get('suites', []):
        results.extend(flatten_specs(item, full_name))
    for spec in suite.get('specs', []):
        test_name = spec.get('title', 'Unknown')
        # Extract test prefix (e.g., "Test 1" → "test1", "R1" → "r1")
        tid = test_name.split(':')[0].split('-')[0].strip().lower().replace(' ', '')
        if not tid.startswith('r') and 'test' in tid:
            tid = tid.replace(' ', '')
        for test in spec.get('tests', []):
            result = test.get('results', [{}])[0]
            status = result.get('status', 'unknown')
            dur_ns = result.get('duration', 0)
            dur_ms = dur_ns / 1_000_000
            dur_str = f"{dur_ms / 1000:.1f}s" if dur_ms > 1000 else f"{dur_ms:.0f}ms"
            results.append((full_name, test_name, status, dur_str, spec.get('file', ''), tid))
    return results


def status_icon(status):
    return {
        'passed': '✅',
        'failed': '❌',
        'skipped': '⏭️',
        'timedOut': '⌛',
        'interrupted': '🚫',
    }.get(status, '❓')


def generate_summary(data):
    stats = data.get('stats', data)
    total = stats.get('expected', 0) + stats.get('unexpected', 0) + stats.get('skipped', 0)
    expected = stats.get('expected', 0)
    failed = stats.get('unexpected', 0)
    skipped = stats.get('skipped', 0)
    duration_ms = stats.get('duration', data.get('duration', 0))
    duration_s = duration_ms / 1000

    suites = data.get('suites', [])
    all_tests = []
    for suite in suites:
        all_tests.extend(flatten_specs(suite))

    # Group by suite file
    from collections import OrderedDict
    by_suite = OrderedDict()
    for suite_name, test_name, status, dur, sfile, tid in all_tests:
        by_suite.setdefault(suite_name, []).append((test_name, status, dur, sfile, tid))

    lines = []
    lines.append("## 🧪 E2E Test Results\n")

    # Overview
    overall = '✅' if failed == 0 else '❌'
    lines.append(f"{overall} **All Tests Complete**\n")
    lines.append("| Status | Count |")
    lines.append("|--------|-------|")
    lines.append(f"| 🎯 **Total** | **{total}** |")
    lines.append(f"| ✅ **Passed** | **{expected}** |")
    if skipped > 0:
        lines.append(f"| ⏭️ **Skipped** | **{skipped}** |")
    if failed > 0:
        lines.append(f"| ❌ **Failed** | **{failed}** |")
    lines.append(f"| ⏱ **Duration** | **{duration_s:.1f}s** |")
    lines.append("")

    # Per-suite results with screenshots
    for suite_name, tests in by_suite.items():
        suite_ok = all(s == 'passed' for _, s, _, _, _ in tests)
        icon = '✅' if suite_ok else '❌'
        suite_short = suite_name.split(' › ')[-1] if ' › ' in suite_name else suite_name
        lines.append(f"### {icon} `{suite_short}`")
        lines.append("")
        lines.append("| Ergebnis | Test | Dauer | Screenshots |")
        lines.append("|:--------:|------|:-----:|:-----------:|")
        for test_name, status, dur, sfile, tid in tests:
            i = status_icon(status)
            display = test_name[:48] + '..' if len(test_name) > 50 else test_name

            # Find screenshots for this test
            screenshots = find_test_screenshots(tid)

            if screenshots:
                screenshot_links = []
                for ss in screenshots[:6]:  # Max 6 screenshots per test
                    screenshot_links.append(
                        f'<a href="{ss["path"]}">📸 {ss["label"][:30]}</a>'
                    )
                screenshots_cell = '<br>'.join(screenshot_links)
            else:
                screenshots_cell = '—'

            lines.append(f"| {i} | {display:<50s} | {dur:>8s} | {screenshots_cell} |")
        lines.append("")

    # Failed tests detail
    failed_detail = [(s, tn, d) for s, tests in by_suite.items() for tn, st, d, _, _ in tests if st != 'passed']
    if failed_detail:
        lines.append("### ❌ Failed Tests")
        lines.append("")
        for suite_name, test_name, dur in failed_detail:
            lines.append(f"- **{test_name}**")
            lines.append(f"  - Suite: `{suite_name}`")
            lines.append(f"  - Duration: {dur}")
        lines.append("")

    # Instructions for viewing screenshots
    if total > 0:
        lines.append("### 💡 Screenshots")
        lines.append("")
        lines.append("Screenshots werden als **GitHub Actions Artefakte** gespeichert.")
        lines.append("Lade das Artefakt **test-screenshots** herunter, um alle Bilder zu sehen.")
        lines.append("")

    # Footer
    lines.append("---")
    lines.append(f"*🧪 Playwright • Chromium • {total} tests • {duration_s:.1f}s*")

    return "\n".join(lines)


def main():
    data = load_results(RESULTS_FILE)
    if not data:
        fallback = "## ⚠️ No test results found\n\nCould not parse `test-results.json`. Check workflow logs for details."
        print(fallback)
        with open(OUTPUT_FILE, 'w') as f:
            f.write(fallback)
        summary_path = os.environ.get('GITHUB_STEP_SUMMARY', '')
        if summary_path:
            with open(summary_path, 'w') as f:
                f.write(fallback)
        return

    summary = generate_summary(data)
    print(summary)

    # Write to GitHub Step Summary
    summary_path = os.environ.get('GITHUB_STEP_SUMMARY', '')
    if summary_path:
        with open(summary_path, 'w') as f:
            f.write(summary)
        print(f"\n✅ Summary written to {summary_path}")

    # Also write to file for PR comment
    with open(OUTPUT_FILE, 'w') as f:
        f.write(summary)
    print(f"✅ Summary written to {OUTPUT_FILE}")


if __name__ == '__main__':
    main()
