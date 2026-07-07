import { test, expect } from '@playwright/test';

/**
 * eIDAS 2.0 / EUDI Wallet Demo – E2E Tests
 *
 * Tests the complete lifecycle: Issuance → Wallet → Presentation → Verify → History
 * Navigates by clicking bottom nav buttons.
 * Screenshots are taken at key steps for visual documentation.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.app-header')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.bottom-nav')).toBeVisible();
});

/**
 * Navigate by clicking bottom nav button, then wait for h1 to match.
 */
async function navigateTo(page, label, expectedTitle) {
  await page.locator('.bottom-nav .nav-item', { hasText: label }).click();
  await expect(page.locator('.page-header h1')).toHaveText(expectedTitle, { timeout: 5000 });
}

// =============================================================================
// Test 1: Issuance – Issue a PID credential
// =============================================================================
test('Test 1: Issuance – Issue a PID credential', async ({ page }) => {
  await navigateTo(page, 'Issuance', 'Issue Credential');
  await page.screenshot({ path: 'test-results/screenshots/test1-start-issuance-form.png', fullPage: true });

  await expect(page.locator('.template-card')).toHaveCount(4);
  await page.locator('.template-card').first().click();
  await page.fill('#given_name', 'Jane');
  await page.fill('#family_name', 'Doe');
  await page.fill('#birth_date', '1990-06-15');
  await page.fill('#nationality', 'DE');

  await page.screenshot({ path: 'test-results/screenshots/test1-form-filled.png', fullPage: true });

  await page.locator('.btn-submit').click();
  await expect(page.locator('.success-title')).toHaveText('Credential Issued!');

  await page.screenshot({ path: 'test-results/screenshots/test1-credential-issued.png', fullPage: true });

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('eidas_wallet_credentials') || '[]'));
  expect(stored).toHaveLength(1);
  expect(stored[0].type).toBe('PID');
});

// =============================================================================
// Test 2: Issuance – Issue a QEAA credential
// =============================================================================
test('Test 2: Issuance – Issue a QEAA (Age Verification)', async ({ page }) => {
  await navigateTo(page, 'Issuance', 'Issue Credential');
  await page.screenshot({ path: 'test-results/screenshots/test2-start-issuance.png', fullPage: true });

  await page.locator('.template-card').nth(1).click();
  await page.selectOption('#age_over_18', 'true');
  await page.selectOption('#age_over_21', 'false');
  await page.fill('#birth_date', '1990-06-15');

  await page.screenshot({ path: 'test-results/screenshots/test2-form-filled.png', fullPage: true });

  await page.locator('.btn-submit').click();
  await expect(page.locator('.success-title')).toHaveText('Credential Issued!');

  await page.screenshot({ path: 'test-results/screenshots/test2-credential-issued.png', fullPage: true });

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('eidas_wallet_credentials') || '[]'));
  expect(stored).toHaveLength(1);
  expect(stored[0].type).toBe('QEAA');
});

// =============================================================================
// Test 3: Wallet – Display and show detail
// =============================================================================
test('Test 3: Wallet – Display credentials and show detail', async ({ page }) => {
  await page.evaluate(() => { localStorage.clear(); });
  await page.evaluate(() => {
    localStorage.setItem('eidas_wallet_credentials', JSON.stringify([{
      id: crypto.randomUUID(), type: 'PID', label: 'Personal Identification Data',
      icon: '🆔', issuerLabel: 'National Identity Authority', issuer: 'National Identity Authority',
      issuedAt: new Date().toISOString(),
      attributes: { given_name: 'Jane', family_name: 'Doe', birth_date: '1990-06-15', nationality: 'DE' },
    }]));
  });
  await page.goto('/');
  await expect(page.locator('.app-header')).toBeVisible({ timeout: 10000 });

  await navigateTo(page, 'Wallet', 'My Wallet');
  await page.screenshot({ path: 'test-results/screenshots/test3-wallet-overview.png', fullPage: true });

  await expect(page.locator('.stat-card')).toHaveCount(3);
  await expect(page.locator('.stat-value').first()).toHaveText('1');

  const card = page.locator('.credential-card');
  await expect(card).toContainText('Personal Identification Data');
  await card.click();
  await expect(page.locator('.modal')).toBeVisible();
  await expect(page.locator('.modal-title')).toContainText('Personal Identification Data');

  await page.screenshot({ path: 'test-results/screenshots/test3-credential-detail.png', fullPage: true });

  await page.locator('.close-btn').click();
  await expect(page.locator('.modal')).not.toBeVisible();
});

// =============================================================================
// Test 4: Wallet – Delete a credential
// =============================================================================
test('Test 4: Wallet – Delete a credential', async ({ page }) => {
  await page.evaluate(() => { localStorage.clear(); });
  await page.evaluate(() => {
    localStorage.setItem('eidas_wallet_credentials', JSON.stringify([{
      id: crypto.randomUUID(), type: 'PID', label: 'Personal Identification Data',
      icon: '🆔', issuerLabel: 'National Identity Authority', issuer: 'National Identity Authority',
      issuedAt: new Date().toISOString(),
      attributes: { given_name: 'Jane', family_name: 'Doe', birth_date: '1990-06-15', nationality: 'DE' },
    }]));
  });
  await page.goto('/');
  await expect(page.locator('.app-header')).toBeVisible({ timeout: 10000 });

  await navigateTo(page, 'Wallet', 'My Wallet');
  await page.screenshot({ path: 'test-results/screenshots/test4-wallet-before-delete.png', fullPage: true });

  const card = page.locator('.credential-card');
  await expect(card).toBeVisible({ timeout: 5000 });
  await card.hover();
  const deleteBtn = card.locator('.delete-btn');

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Personal Identification Data');
    await dialog.accept();
  });

  await deleteBtn.click();
  await expect(page.locator('.empty-state')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.empty-state h3')).toHaveText('Wallet is empty');

  await page.screenshot({ path: 'test-results/screenshots/test4-wallet-empty.png', fullPage: true });
});

// =============================================================================
// Test 5: Presentation – Select attributes and generate QR
// =============================================================================
test('Test 5: Presentation – Select attributes and generate QR code', async ({ page }) => {
  await page.evaluate(() => { localStorage.clear(); });
  await page.evaluate(() => {
    localStorage.setItem('eidas_wallet_credentials', JSON.stringify([{
      id: 'test-pid-1', type: 'PID', label: 'Personal Identification Data',
      icon: '🆔', issuerLabel: 'National Identity Authority', issuer: 'National Identity Authority',
      issuedAt: new Date().toISOString(),
      attributes: { given_name: 'Jane', family_name: 'Doe', birth_date: '1990-06-15', nationality: 'DE', birth_place: 'Berlin', resident_address: 'Main St 42', gender: 'female' },
    }]));
  });
  await page.goto('/');
  await expect(page.locator('.app-header')).toBeVisible({ timeout: 10000 });

  await navigateTo(page, 'Present', 'Present Credential');
  await page.screenshot({ path: 'test-results/screenshots/test5-credential-selection.png', fullPage: true });

  await page.locator('.credential-option').click();
  await expect(page.locator('.attribute-item')).toHaveCount(7, { timeout: 5000 });

  await page.locator('.attribute-item input[type="checkbox"]').nth(0).check();
  await page.locator('.attribute-item input[type="checkbox"]').nth(1).check();
  await expect(page.locator('.selection-summary')).toContainText('2 attribute(s) selected');

  await page.screenshot({ path: 'test-results/screenshots/test5-attributes-selected.png', fullPage: true });

  await page.locator('.present-btn').click();
  await expect(page.locator('.qr-title')).toHaveText('Presentation QR Code');
  await expect(page.locator('.qr-image')).toBeVisible({ timeout: 8000 });

  await page.screenshot({ path: 'test-results/screenshots/test5-qr-code.png', fullPage: true });

  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('eidas_wallet_history') || '[]'));
  expect(history).toHaveLength(1);
  expect(history[0].sharedAttributes).toEqual(['given_name', 'family_name']);
});

// =============================================================================
// Test 6: Verifier – Validate JSON payload
// =============================================================================
test('Test 6: Verifier – Validate JSON payload', async ({ page }) => {
  await navigateTo(page, 'Verify', '🔍 Verifier');
  await page.screenshot({ path: 'test-results/screenshots/test6-verifier-empty.png', fullPage: true });

  await expect(page.locator('.btn-sample')).toBeVisible();
  await page.locator('.btn-sample').click();

  await page.screenshot({ path: 'test-results/screenshots/test6-sample-loaded.png', fullPage: true });

  await page.locator('.btn-verify').click();
  await expect(page.locator('.result-title')).toHaveText('Verification Successful');
  await expect(page.locator('.result-card')).toContainText('PID');
  await expect(page.locator('.attr-row')).toHaveCount(4);

  await page.screenshot({ path: 'test-results/screenshots/test6-verification-result.png', fullPage: true });
});

// =============================================================================
// Test 7: History – Check entry and clear all
// =============================================================================
test('Test 7: History – Check entry and clear all', async ({ page }) => {
  await page.evaluate(() => { localStorage.clear(); });
  await page.evaluate(() => {
    localStorage.setItem('eidas_wallet_history', JSON.stringify([{
      id: 'test-entry-1', credentialId: 'test-cred-1',
      credentialLabel: 'Age Verification', credentialIcon: '🔞',
      sharedAttributes: ['age_over_18', 'age_over_21'],
      sharedValues: { age_over_18: true, age_over_21: false },
      verifierName: 'Test Verifier',
      presentedAt: new Date().toISOString(), status: 'success',
    }]));
  });
  await page.goto('/');
  await expect(page.locator('.app-header')).toBeVisible({ timeout: 10000 });

  await navigateTo(page, 'History', 'History');
  await page.screenshot({ path: 'test-results/screenshots/test7-history-overview.png', fullPage: true });

  const timelineItem = page.locator('.timeline-item');
  await expect(timelineItem).toContainText('Age Verification');
  await expect(timelineItem).toContainText('2 attribute(s) shared');

  await timelineItem.click();
  await expect(page.locator('.modal')).toBeVisible();
  await expect(page.locator('.modal-title')).toHaveText('Presentation Details');

  await page.screenshot({ path: 'test-results/screenshots/test7-history-detail.png', fullPage: true });

  await page.locator('.close-btn').click();
  await expect(page.locator('.modal')).not.toBeVisible();

  await page.locator('.btn-danger-outline').click();
  await page.locator('.btn-danger').click();
  await expect(page.locator('.empty-state')).toBeVisible();
  await expect(page.locator('.empty-state h3')).toHaveText('No presentations yet');

  await page.screenshot({ path: 'test-results/screenshots/test7-history-empty.png', fullPage: true });

  const stored = await page.evaluate(() => localStorage.getItem('eidas_wallet_history'));
  expect(stored).toBe('[]');
});

// =============================================================================
// Test 8: Full Flow – Complete lifecycle simulation
// =============================================================================
test('Test 8: Full Flow – Complete lifecycle simulation', async ({ page }) => {
  // STEP 1: Issue PID
  await navigateTo(page, 'Issuance', 'Issue Credential');
  await page.screenshot({ path: 'test-results/screenshots/test8-step1-issuance-start.png', fullPage: true });
  await page.locator('.template-card').first().click();
  await page.fill('#given_name', 'Max');
  await page.fill('#family_name', 'Mustermann');
  await page.fill('#birth_date', '1985-03-20');
  await page.fill('#nationality', 'DE');
  await page.locator('.btn-submit').click();
  await expect(page.locator('.success-title')).toHaveText('Credential Issued!');
  await page.screenshot({ path: 'test-results/screenshots/test8-step1-pid-issued.png', fullPage: true });

  // STEP 2: Issue QEAA (via success page "Issue Another")
  await page.locator('.btn-secondary').click();
  await page.waitForSelector('.template-card');
  await page.locator('.template-card').nth(1).click();
  await page.selectOption('#age_over_18', 'true');
  await page.selectOption('#age_over_21', 'true');
  await page.fill('#birth_date', '1985-03-20');
  await page.locator('.btn-submit').click();
  await expect(page.locator('.success-title')).toHaveText('Credential Issued!');
  await page.screenshot({ path: 'test-results/screenshots/test8-step2-qeaa-issued.png', fullPage: true });

  let creds = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('eidas_wallet_credentials') || '[]'));
  expect(creds).toHaveLength(2);

  // STEP 3: Wallet
  await navigateTo(page, 'Wallet', 'My Wallet');
  await expect(page.locator('.credential-card')).toHaveCount(2, { timeout: 5000 });
  await expect(page.locator('.stat-value').first()).toHaveText('2');
  await page.screenshot({ path: 'test-results/screenshots/test8-step3-wallet.png', fullPage: true });

  // STEP 4: Present
  await navigateTo(page, 'Present', 'Present Credential');
  await page.locator('.credential-option').first().click();
  await expect(page.locator('.attribute-item')).toHaveCount(7, { timeout: 5000 });
  await page.locator('.attribute-item input[type="checkbox"]').nth(0).check();
  await page.locator('.attribute-item input[type="checkbox"]').nth(1).check(); // family_name
  await page.locator('.present-btn').click();
  await expect(page.locator('.qr-title')).toHaveText('Presentation QR Code');
  await page.screenshot({ path: 'test-results/screenshots/test8-step4-qr.png', fullPage: true });

  // Should show fallback notice since Flask server isn't running during tests
  await expect(page.locator('.warning-badge')).toBeVisible({ timeout: 5000 });

  // Click "View" button to show raw JSON data
  await page.locator('.action-btn').click();
  await expect(page.locator('.raw-data')).toBeVisible({ timeout: 5000 });
  const rawJson = await page.locator('.raw-data code').textContent();
  const presentationData = JSON.parse(rawJson);
  expect(presentationData.format).toBe('sd_jwt_vc');
  expect(presentationData.sharedAttributes).toEqual(['given_name', 'family_name']);

  // STEP 5: Verify
  await navigateTo(page, 'Verify', '🔍 Verifier');
  await page.locator('.json-input').fill(JSON.stringify(presentationData, null, 2));
  await page.locator('.btn-verify').click();
  await expect(page.locator('.result-title')).toHaveText('Verification Successful');
  await expect(page.locator('.result-card')).toContainText('Personal Identification Data');
  await expect(page.locator('.result-card')).toContainText('PID');
  await page.screenshot({ path: 'test-results/screenshots/test8-step5-verify.png', fullPage: true });

  // STEP 6: History
  await navigateTo(page, 'History', 'History');
  const historyItems = page.locator('.timeline-item');
  await expect(historyItems.first()).toContainText('Personal Identification Data');
  await page.screenshot({ path: 'test-results/screenshots/test8-step6-history.png', fullPage: true });
});
