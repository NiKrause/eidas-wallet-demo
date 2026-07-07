import { test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Extends Playwright's test with automatic before/after screenshots.
 *
 * Usage:
 *   import { test, expect } from './base-test.js';
 *
 *   test('my test', async ({ page, screenshot }) => {
 *     await screenshot('start');  // optional, auto-called by beforeEach
 *     // ... test logic ...
 *     // auto-called by afterEach
 *   });
 */

export const test = base.extend({
  /**
   * Auto-screenshot helper – call it whenever you want a screenshot.
   * Saves to test-results/<test-dir>/<name>.png
   */
  screenshot: async ({ page }, use, testInfo) => {
    let counter = 0;
    const takeScreenshot = async (name) => {
      counter++;
      const testDir = path.join('test-results', testInfo.titlePath.join('-').replace(/[^a-zA-Z0-9_-]/g, '-'));
      fs.mkdirSync(testDir, { recursive: true });
      const filePath = path.join(testDir, `${counter}-${name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
    };
    await use(takeScreenshot);
  },
});

export { expect } from '@playwright/test';
