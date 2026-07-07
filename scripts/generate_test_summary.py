#!/usr/bin/env python3
"""
Generate a beautiful Markdown test summary from Playwright's JSON output.
Reads test-results.json, writes summary to GITHUB_STEP_SUMMARY and test_summary.md.
"""

import json
import os

RESULTS_FILE = 'test-output.json'
OUTPUT_FILE = 'test_summary.md'


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
        for test in spec.get('tests', []):
            result = test.get('results', [{}])[0]
            status = result.get('status', 'unknown')
            # Duration is in milliseconds (Node.js epoch ms)
            dur_ms = result.get('duration', 0)
            dur_str = f"{dur_ms / 1000:.1f}s" if dur_ms > 1000 else f"{dur_ms:.0f}ms"
            results.append((full_name, test_name, status, dur_str))
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
    for suite_name, test_name, status, dur in all_tests:
        by_suite.setdefault(suite_name, []).append((test_name, status, dur))

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

    # Per-suite results
    for suite_name, tests in by_suite.items():
        suite_ok = all(s == 'passed' for _, s, _ in tests)
        icon = '✅' if suite_ok else '❌'
        suite_short = suite_name.split(' › ')[-1] if ' › ' in suite_name else suite_name
        lines.append(f"### {icon} `{suite_short}`")
        lines.append("")
        lines.append("| Ergebnis | Test | Dauer |")
        lines.append("|:--------:|------|:-----:|")
        for test_name, status, dur in tests:
            i = status_icon(status)
            display = test_name[:56] + '..' if len(test_name) > 58 else test_name
            lines.append(f"| {i} | {display:<58s} | {dur:>8s} |")
        lines.append("")

    # Failed detail
    failed_detail = [(s, tn, d) for s, tests in by_suite.items() for tn, st, d in tests if st != 'passed']
    if failed_detail:
        lines.append("### ❌ Failed Tests")
        lines.append("")
        for suite_name, test_name, dur in failed_detail:
            lines.append(f"- **{test_name}**")
            lines.append(f"  - Suite: `{suite_name}`")
            lines.append(f"  - Duration: {dur}")
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
        return  # Don't exit with error, just skip

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
