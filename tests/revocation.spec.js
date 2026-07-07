import { test, expect } from '@playwright/test';

/**
 * Revocation E2E Tests
 *
 * Tests the credential revocation lifecycle:
 * Issue → Revoke via Authority Dashboard → Wallet shows REVOKED → Present blocked → Verify shows revoked
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
  await page.locator('.submit-btn').click();
  await expect(page.locator('.success-title')).toHaveText('Credential Issued!');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForApp(page);
});

// =============================================================================
// Test 1: Revoke a credential via Authority Dashboard
// =============================================================================
test('R1: Revoke a credential via Authority Dashboard', async ({ page }) => {
  await issuePID(page);

  // Navigate to Authority Dashboard
  await navigateTo(page, 'Authority');
  await expect(page.locator('h1')).toContainText('Authority Dashboard');

  // Check stats
  await expect(page.locator('.stat-value').first()).toHaveText('1');
  await expect(page.locator('.stat-value').nth(1)).toHaveText('1'); // Active

  // Find the revoke button
  const revokeBtn = page.locator('.btn-revoke');
  await expect(revokeBtn).toBeVisible();
  await revokeBtn.click();

  // Modal should appear
  await expect(page.locator('.modal')).toBeVisible();
  await expect(page.locator('.modal-title')).toContainText('Revoke Credential');

  // Select a reason
  await page.locator('.reason-option input[type="radio"]').first().check();

  // Confirm revoke
  await page.locator('.btn-revoke-confirm').click();
  await page.waitForTimeout(300);

  // Modal should close
  await expect(page.locator('.modal')).not.toBeVisible();

  // Check stats updated
  await expect(page.locator('.stat-value').nth(1)).toHaveText('0'); // Active
  await expect(page.locator('.stat-value').nth(2)).toHaveText('1'); // Revoked

  // Credential should show revoked badge
  await expect(page.locator('.revoked-badge')).toContainText('REVOKED');
});

// =============================================================================
// Test 2: Wallet shows REVOKED status
// =============================================================================
test('R2: Wallet shows REVOKED status', async ({ page }) => {
  await issuePID(page);

  // Revoke via authority
  await navigateTo(page, 'Authority');
  await page.locator('.btn-revoke').click();
  await page.locator('.reason-option input[type="radio"]').first().check();
  await page.locator('.btn-revoke-confirm').click();
  await page.waitForTimeout(300);

  // Navigate to Wallet
  await navigateTo(page, 'Wallet');
  await expect(page.locator('h1')).toContainText('Wallet');

  // Card should show REVOKED badge
  const card = page.locator('.credential-card');
  await expect(card).toContainText('REVOKED');
  // Card should have revoked styling
  await expect(card).toHaveClass(/is-revoked/);

  // Open detail modal
  await card.click();
  await expect(page.locator('.modal')).toBeVisible();
  await expect(page.locator('.modal')).toContainText('REVOKED');
  await expect(page.locator('.revoked-notice')).toBeVisible();
  await expect(page.locator('.revoked-notice')).toContainText('revoked');

  // Remove button should be hidden for revoked credentials
  await expect(page.locator('.btn-danger')).not.toBeVisible();

  // Close
  await page.locator('.close-btn').click();
});

// =============================================================================
// Test 3: Present blocks revoked credentials
// =============================================================================
test('R3: Present blocks revoked credentials', async ({ page }) => {
  await issuePID(page);

  // Revoke
  await navigateTo(page, 'Authority');
  await page.locator('.btn-revoke').click();
  await page.locator('.reason-option input[type="radio"]').first().check();
  await page.locator('.btn-revoke-confirm').click();
  await page.waitForTimeout(300);

  // Navigate to Present
  await navigateTo(page, 'Present');

  // Credential should show REVOKED badge in list
  const revokedOption = page.locator('.credential-option.is-revoked');
  await expect(revokedOption).toBeVisible();
  await expect(revokedOption).toContainText('REVOKED');

  // Select the revoked credential
  await revokedOption.click();

  // Should show revocation warning instead of attribute selection
  await expect(page.locator('.revoked-warning')).toBeVisible();
  await expect(page.locator('.revoked-warning')).toContainText('revoked');
  await expect(page.locator('.attribute-item')).toHaveCount(0);
  await expect(page.locator('.present-btn')).not.toBeVisible();
});

// =============================================================================
// Test 4: Verify shows revoked status
// =============================================================================
test('R4: Verify shows revoked credential status', async ({ page }) => {
  await issuePID(page);

  // Get the credential ID for later
  const credId = await page.evaluate(() => {
    const raw = localStorage.getItem('eidas_wallet_credentials');
    return raw ? JSON.parse(raw)[0].id : null;
  });
  expect(credId).toBeTruthy();

  // Revoke the credential
  await navigateTo(page, 'Authority');
  await page.locator('.btn-revoke').click();
  await page.locator('.reason-option input[type="radio"]').first().check();
  await page.locator('.btn-revoke-confirm').click();
  await page.waitForTimeout(300);

  // Go to Verifier and craft a presentation with the revoked credential ID
  await navigateTo(page, 'Verify');
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

  // Should show revoked result
  await expect(page.locator('.result-title')).toHaveText('🔴 Credential Revoked');
  await expect(page.locator('.revoked-card')).toBeVisible();
  await expect(page.locator('.revoked-card')).toContainText('Device reported stolen');
});

// =============================================================================
// Test 5: Full Revocation Lifecycle
// =============================================================================
test('R5: Full Revocation Lifecycle', async ({ page }) => {
  // Step 1: Issue PID
  await issuePID(page);

  // Step 2: Issue QEAA — use "Issue Another" button on success page
  await page.locator('.btn-secondary').click();
  await page.waitForSelector('.template-card');
  await page.locator('.template-card').nth(1).click(); // Age Verification
  await page.selectOption('#age_over_18', 'true');
  await page.selectOption('#age_over_21', 'false');
  await page.fill('#birth_date', '1985-03-20');
  await page.locator('.submit-btn').click();
  await expect(page.locator('.success-title')).toHaveText('Credential Issued!');

  // Step 3: Authority shows 2 credentials
  await navigateTo(page, 'Authority');
  await expect(page.locator('.stat-value').first()).toHaveText('2');

  // Step 4: Revoke the PID only
  await page.locator('.btn-revoke').first().click();
  await page.locator('.reason-option input[type="radio"]').first().check();
  await page.locator('.btn-revoke-confirm').click();
  await page.waitForTimeout(300);

  // Stats should show 1 active, 1 revoked
  await expect(page.locator('.stat-value').nth(1)).toHaveText('1');
  await expect(page.locator('.stat-value').nth(2)).toHaveText('1');

  // Step 5: Wallet shows both, one revoked
  await navigateTo(page, 'Wallet');
  await expect(page.locator('.credential-card')).toHaveCount(2);
  // First card should be revoked (is-revoked class)
  const cards = page.locator('.credential-card');
  await expect(cards.first()).toHaveClass(/is-revoked/);
  await expect(cards.nth(1)).not.toHaveClass(/is-revoked/);

  // Step 6: Reinstate the revoked credential
  await navigateTo(page, 'Authority');
  await page.locator('.btn-reinstate').click();
  await page.waitForTimeout(300);
  await expect(page.locator('.modal-title')).toContainText('Reinstate');
  await page.locator('.btn-reinstate-confirm').click();
  await page.waitForTimeout(300);

  // All active again
  await expect(page.locator('.stat-value').nth(1)).toHaveText('2');
  await expect(page.locator('.stat-value').nth(2)).toHaveText('0');

  // Step 7: Wallet shows both active
  await navigateTo(page, 'Wallet');
  await expect(page.locator('.credential-card').first()).not.toHaveClass(/is-revoked/);
});
