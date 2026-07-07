import { test, expect } from '@playwright/test';

/**
 * Revocation E2E Tests with screenshots
 */

async function waitForApp(page) {
  await expect(page.locator('.app-header')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.bottom-nav')).toBeVisible();
}

async function navigateTo(page, label) {
  await page.locator('.bottom-nav .nav-item', { hasText: label }).click();
  await page.waitForTimeout(300);
}

async function issuePID(page) {
  await navigateTo(page, 'Issuance');
  await page.waitForSelector('.template-card');
  await page.locator('.template-card').first().click();
  await page.fill('#given_name', 'Max');
  await page.fill('#family_name', 'Mustermann');
  await page.fill('#birth_date', '1985-03-20');
  await page.fill('#nationality', 'DE');
  await page.locator('.btn-submit').click();
  await expect(page.locator('.success-title')).toHaveText('Credential Issued!');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForApp(page);
});

// =============================================================================
// R1: Revoke a credential via Authority Dashboard
// =============================================================================
test('R1: Revoke a credential via Authority Dashboard', async ({ page }) => {
  await issuePID(page);
  await page.screenshot({ path: 'test-results/screenshots/r1-pid-issued.png', fullPage: true });

  await navigateTo(page, 'Authority');
  await expect(page.locator('h1')).toContainText('Authority Dashboard');
  await page.screenshot({ path: 'test-results/screenshots/r1-authority-overview.png', fullPage: true });

  await expect(page.locator('.stat-value').first()).toHaveText('1');
  await expect(page.locator('.stat-value').nth(1)).toHaveText('1');

  const revokeBtn = page.locator('.btn-revoke');
  await expect(revokeBtn).toBeVisible();
  await revokeBtn.click();

  await expect(page.locator('.modal')).toBeVisible();
  await expect(page.locator('.modal-title')).toContainText('Revoke Credential');
  await page.screenshot({ path: 'test-results/screenshots/r1-revoke-modal.png', fullPage: true });

  await page.locator('.reason-option input[type="radio"]').first().check();
  await page.locator('.btn-revoke-confirm').click();
  await page.waitForTimeout(300);

  await expect(page.locator('.modal')).not.toBeVisible();
  await expect(page.locator('.stat-value').nth(1)).toHaveText('0');
  await expect(page.locator('.stat-value').nth(2)).toHaveText('1');
  await page.screenshot({ path: 'test-results/screenshots/r1-revoked.png', fullPage: true });
});

// =============================================================================
// R2: Wallet shows REVOKED status
// =============================================================================
test('R2: Wallet shows REVOKED status', async ({ page }) => {
  await issuePID(page);
  await navigateTo(page, 'Authority');
  await page.locator('.btn-revoke').click();
  await page.locator('.reason-option input[type="radio"]').first().check();
  await page.locator('.btn-revoke-confirm').click();
  await page.waitForTimeout(300);

  await navigateTo(page, 'Wallet');
  await expect(page.locator('h1')).toContainText('Wallet');
  await page.screenshot({ path: 'test-results/screenshots/r2-wallet-revoked.png', fullPage: true });

  const card = page.locator('.credential-card');
  await expect(card).toContainText('REVOKED');
  await expect(card).toHaveClass(/is-revoked/);

  await card.click();
  await expect(page.locator('.modal')).toBeVisible();
  await expect(page.locator('.modal')).toContainText('REVOKED');
  await expect(page.locator('.revoked-notice')).toBeVisible();
  await expect(page.locator('.btn-danger')).not.toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/r2-revoked-detail.png', fullPage: true });

  await page.locator('.close-btn').click();
});

// =============================================================================
// R3: Present blocks revoked credentials
// =============================================================================
test('R3: Present blocks revoked credentials', async ({ page }) => {
  await issuePID(page);
  await navigateTo(page, 'Authority');
  await page.locator('.btn-revoke').click();
  await page.locator('.reason-option input[type="radio"]').first().check();
  await page.locator('.btn-revoke-confirm').click();
  await page.waitForTimeout(300);

  await navigateTo(page, 'Present');
  await page.screenshot({ path: 'test-results/screenshots/r3-present-revoked-list.png', fullPage: true });

  const revokedOption = page.locator('.credential-option.is-revoked');
  await expect(revokedOption).toBeVisible();
  await expect(revokedOption).toContainText('REVOKED');

  await revokedOption.click();
  await expect(page.locator('.revoked-warning')).toBeVisible();
  await expect(page.locator('.revoked-warning')).toContainText('revoked');
  await expect(page.locator('.attribute-item')).toHaveCount(0);
  await expect(page.locator('.present-btn')).not.toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/r3-revoked-warning.png', fullPage: true });
});

// =============================================================================
// R4: Verify shows revoked credential status
// =============================================================================
test('R4: Verify shows revoked credential status', async ({ page }) => {
  await issuePID(page);

  const credId = await page.evaluate(() => {
    const raw = localStorage.getItem('eidas_wallet_credentials');
    return raw ? JSON.parse(raw)[0].id : null;
  });
  expect(credId).toBeTruthy();

  await navigateTo(page, 'Authority');
  await page.locator('.btn-revoke').click();
  await page.locator('.reason-option input[type="radio"]').first().check();
  await page.locator('.btn-revoke-confirm').click();
  await page.waitForTimeout(300);

  await navigateTo(page, 'Verify');
  await page.screenshot({ path: 'test-results/screenshots/r4-verify-empty.png', fullPage: true });

  const revokedPayload = JSON.stringify({
    format: 'eidas-wallet-demo-v1',
    credentialType: 'PID',
    credentialLabel: 'Personal Identification Data',
    credentialId: credId,
    status: 'revoked',
    issuer: 'National Identity Authority',
    issuedAt: new Date().toISOString(),
    attributes: { given_name: 'Max', family_name: 'Mustermann', birth_date: '1985-03-20', nationality: 'DE' },
    sharedAttributes: ['given_name'],
    timestamp: new Date().toISOString(),
  }, null, 2);

  await page.locator('.json-input').fill(revokedPayload);
  await page.locator('.btn-verify').click();
  await page.waitForTimeout(500);

  await expect(page.locator('.result-title')).toHaveText('🔴 Credential Revoked');
  await expect(page.locator('.revoked-card')).toBeVisible();
  await expect(page.locator('.revoked-card')).toContainText('Device reported stolen');
  await page.screenshot({ path: 'test-results/screenshots/r4-revoked-verify.png', fullPage: true });
});

// =============================================================================
// R5: Full Revocation Lifecycle
// =============================================================================
test('R5: Full Revocation Lifecycle', async ({ page }) => {
  // Step 1: Issue PID
  await issuePID(page);
  await page.screenshot({ path: 'test-results/screenshots/r5-step1-pid-issued.png', fullPage: true });

  // Step 2: Issue QEAA
  await page.locator('.btn-secondary').click();
  await page.waitForSelector('.template-card');
  await page.locator('.template-card').nth(1).click();
  await page.selectOption('#age_over_18', 'true');
  await page.selectOption('#age_over_21', 'false');
  await page.fill('#birth_date', '1985-03-20');
  await page.locator('.btn-submit').click();
  await expect(page.locator('.success-title')).toHaveText('Credential Issued!');
  await page.screenshot({ path: 'test-results/screenshots/r5-step2-qeaa-issued.png', fullPage: true });

  // Step 3: Authority shows 2 credentials
  await navigateTo(page, 'Authority');
  await expect(page.locator('.stat-value').first()).toHaveText('2');
  await page.screenshot({ path: 'test-results/screenshots/r5-step3-authority-2-creds.png', fullPage: true });

  // Step 4: Revoke the PID only
  await page.locator('.btn-revoke').first().click();
  await page.locator('.reason-option input[type="radio"]').first().check();
  await page.locator('.btn-revoke-confirm').click();
  await page.waitForTimeout(300);

  await expect(page.locator('.stat-value').nth(1)).toHaveText('1');
  await expect(page.locator('.stat-value').nth(2)).toHaveText('1');
  await page.screenshot({ path: 'test-results/screenshots/r5-step4-one-revoked.png', fullPage: true });

  // Step 5: Wallet shows both, one revoked
  await navigateTo(page, 'Wallet');
  await expect(page.locator('.credential-card')).toHaveCount(2);
  await expect(page.locator('.credential-card').first()).toHaveClass(/is-revoked/);
  await expect(page.locator('.credential-card').nth(1)).not.toHaveClass(/is-revoked/);
  await page.screenshot({ path: 'test-results/screenshots/r5-step5-wallet-mixed.png', fullPage: true });

  // Step 6: Reinstate
  await navigateTo(page, 'Authority');
  await page.locator('.btn-reinstate').click();
  await page.waitForTimeout(300);
  await expect(page.locator('.modal-title')).toContainText('Reinstate');
  await page.screenshot({ path: 'test-results/screenshots/r5-step6-reinstate-modal.png', fullPage: true });
  await page.locator('.btn-reinstate-confirm').click();
  await page.waitForTimeout(300);

  await expect(page.locator('.stat-value').nth(1)).toHaveText('2');
  await expect(page.locator('.stat-value').nth(2)).toHaveText('0');
  await page.screenshot({ path: 'test-results/screenshots/r5-step7-all-active.png', fullPage: true });

  // Step 7: Wallet shows both active
  await navigateTo(page, 'Wallet');
  await expect(page.locator('.credential-card').first()).not.toHaveClass(/is-revoked/);
  await page.screenshot({ path: 'test-results/screenshots/r5-step8-wallet-reinstated.png', fullPage: true });
});
