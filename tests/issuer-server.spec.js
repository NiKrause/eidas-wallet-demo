/**
 * PID Issuance Server E2E Tests
 *
 * Tests the Flask issuer server API endpoints for PID/QEAA credential issuance:
 * 1. GET /api/info — Server metadata
 * 2. POST /api/issue/credential — Issue a PID credential with JWT verification
 * 3. POST /api/issue/credential with QEAA — Issue a QEAA Age Verification credential
 * 4. GET /api/issuer/public-key — Public key in PEM format
 * 5. POST /api/issue/status + GET /api/issuer/status/<id> — Revocation lifecycle
 *
 * Requires the issuer server running on http://localhost:3001 (plain HTTP, no SSL).
 */

import { test, expect } from '@playwright/test';

const ISSUER_URL = 'http://localhost:3001';

// Allow self-signed certificates (kept from verifier test pattern)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

test.describe('PID Issuance Server', () => {

  // ===========================================================================
  // Test 1: GET /api/info — Server metadata
  // ===========================================================================
  test('GET /api/info returns correct server metadata', async () => {
    const response = await fetch(`${ISSUER_URL}/api/info`);
    expect(response.ok).toBeTruthy();

    const data = await response.json();

    // Verify server identity
    expect(data).toHaveProperty('name', 'eIDAS PID Issuer');
    expect(data).toHaveProperty('issuer', 'National Identity Authority');
    expect(data).toHaveProperty('algorithm', 'ES256');
    expect(data).toHaveProperty('curve', 'P-256');

    // Verify endpoints are listed
    expect(data).toHaveProperty('endpoints');
    expect(data.endpoints).toHaveProperty('issue', '/api/issue/credential');
    expect(data.endpoints).toHaveProperty('publicKey', '/api/issuer/public-key');
    expect(data.endpoints).toHaveProperty('statusUpdate', '/api/issue/status');
    expect(data.endpoints).toHaveProperty('statusCheck', '/api/issuer/status/<credential_id>');
    expect(data.endpoints).toHaveProperty('info', '/api/info');

    console.log('✅ GET /api/info: server metadata confirmed');
  });

  // ===========================================================================
  // Test 2: POST /api/issue/credential — Issue a PID credential
  // ===========================================================================
  test('POST /api/issue/credential issues a PID SD-JWT credential', async () => {
    const attributes = {
      given_name: 'Jane',
      family_name: 'Smith',
      birth_date: '1990-06-15',
      nationality: 'US',
    };

    const response = await fetch(`${ISSUER_URL}/api/issue/credential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'PID',
        attributes,
        issuer: 'National Identity Authority',
      }),
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();

    // Verify top-level credential structure
    expect(data).toHaveProperty('credential');
    const credential = data.credential;

    expect(credential).toHaveProperty('id');
    expect(credential).toHaveProperty('sdjwt');
    expect(credential).toHaveProperty('format', 'sd_jwt_vc');
    expect(credential).toHaveProperty('type', 'PID');
    expect(credential).toHaveProperty('attributes');
    expect(credential).toHaveProperty('issuer', 'National Identity Authority');
    expect(credential).toHaveProperty('publicKeyPem');

    // Verify sdjwt is a valid compact JWT (3 dot-separated base64url parts)
    const sdjwt = credential.sdjwt;
    const parts = sdjwt.split('.');
    expect(parts.length).toBe(3);

    // Each part should be base64url-encoded (no padding characters)
    const base64urlRegex = /^[A-Za-z0-9_-]+$/;
    expect(parts[0]).toMatch(base64urlRegex);
    expect(parts[1]).toMatch(base64urlRegex);
    expect(parts[2]).toMatch(base64urlRegex);

    // Decode the JWT payload (middle part)
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    // Verify standard JWT claims
    expect(payload).toHaveProperty('iss', 'National Identity Authority');
    expect(payload).toHaveProperty('iat');
    expect(typeof payload.iat).toBe('number');
    expect(payload).toHaveProperty('exp');
    expect(typeof payload.exp).toBe('number');
    expect(payload.exp).toBeGreaterThan(payload.iat);
    expect(payload).toHaveProperty('jti');
    expect(payload.jti).toBe(credential.id);

    // Verify W3C VC structure
    expect(payload).toHaveProperty('vc');
    expect(payload.vc).toHaveProperty('@context');
    expect(payload.vc['@context']).toContain('https://www.w3.org/2018/credentials/v1');
    expect(payload.vc).toHaveProperty('type');
    expect(payload.vc.type).toContain('VerifiableCredential');
    expect(payload.vc.type).toContain('PID');

    // Verify credentialSubject contains the requested attributes
    expect(payload.vc).toHaveProperty('credentialSubject');
    expect(payload.vc.credentialSubject).toHaveProperty('id');
    expect(payload.vc.credentialSubject.given_name).toBe('Jane');
    expect(payload.vc.credentialSubject.family_name).toBe('Smith');
    expect(payload.vc.credentialSubject.birth_date).toBe('1990-06-15');
    expect(payload.vc.credentialSubject.nationality).toBe('US');

    // Verify returned attributes match
    expect(credential.attributes).toEqual(attributes);

    console.log(`✅ POST /api/issue/credential: PID issued (id=${credential.id}, jwt=${sdjwt.substring(0, 60)}...)`);
  });

  // ===========================================================================
  // Test 3: POST /api/issue/credential with QEAA type
  // ===========================================================================
  test('POST /api/issue/credential issues a QEAA Age Verification credential', async () => {
    const attributes = {
      age_over_18: true,
      age_over_21: false,
      birth_date: '2000-01-15',
    };

    const response = await fetch(`${ISSUER_URL}/api/issue/credential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'QEAA',
        attributes,
        issuer: 'National Identity Authority',
      }),
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();

    // Verify credential structure
    expect(data).toHaveProperty('credential');
    const credential = data.credential;

    expect(credential).toHaveProperty('id');
    expect(credential).toHaveProperty('sdjwt');
    expect(credential).toHaveProperty('format', 'sd_jwt_vc');
    expect(credential).toHaveProperty('type', 'QEAA');
    expect(credential).toHaveProperty('attributes');
    expect(credential.attributes).toEqual(attributes);

    // Verify sdjwt is a valid JWT
    const sdjwt = credential.sdjwt;
    const parts = sdjwt.split('.');
    expect(parts.length).toBe(3);

    // Decode payload and verify QEAA-specific content
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    expect(payload).toHaveProperty('iss', 'National Identity Authority');
    expect(payload).toHaveProperty('jti', credential.id);
    expect(payload.vc.type).toContain('VerifiableCredential');
    expect(payload.vc.type).toContain('QEAA');

    // Verify credentialSubject contains age verification attributes
    expect(payload.vc.credentialSubject.age_over_18).toBe(true);
    expect(payload.vc.credentialSubject.age_over_21).toBe(false);
    expect(payload.vc.credentialSubject.birth_date).toBe('2000-01-15');

    console.log(`✅ POST /api/issue/credential: QEAA issued (id=${credential.id})`);
  });

  // ===========================================================================
  // Test 4: GET /api/issuer/public-key — Returns PEM public key
  // ===========================================================================
  test('GET /api/issuer/public-key returns PEM public key', async () => {
    const response = await fetch(`${ISSUER_URL}/api/issuer/public-key`);
    expect(response.ok).toBeTruthy();

    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('publicKeyPem');
    expect(data).toHaveProperty('algorithm', 'ES256');
    expect(data).toHaveProperty('curve', 'P-256');
    expect(data).toHaveProperty('issuer', 'National Identity Authority');

    // Verify PEM format
    const pem = data.publicKeyPem;
    expect(pem).toContain('-----BEGIN PUBLIC KEY-----');
    expect(pem).toContain('-----END PUBLIC KEY-----');

    // Verify it's a valid base64-encoded key between the headers
    const pemContent = pem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');
    expect(pemContent.length).toBeGreaterThan(0);

    // The decoded content should be a valid DER SubjectPublicKeyInfo
    const decoded = Buffer.from(pemContent, 'base64');
    expect(decoded.length).toBeGreaterThan(0);

    console.log('✅ GET /api/issuer/public-key: PEM key confirmed');
  });

  // ===========================================================================
  // Test 5: POST /api/issue/status + GET /api/issuer/status/<id> — Revocation
  // ===========================================================================
  test('POST /api/issue/status + GET /api/issuer/status/<id> revokes and checks credential status', async () => {
    // First, issue a credential so we have an ID to revoke
    const issueResponse = await fetch(`${ISSUER_URL}/api/issue/credential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'PID',
        attributes: { given_name: 'Revoke', family_name: 'Test' },
      }),
    });

    expect(issueResponse.ok).toBeTruthy();
    const issueData = await issueResponse.json();
    const credentialId = issueData.credential.id;
    expect(credentialId).toBeTruthy();

    // Verify initial status is 'active'
    const initialStatusResponse = await fetch(`${ISSUER_URL}/api/issuer/status/${credentialId}`);
    expect(initialStatusResponse.ok).toBeTruthy();
    const initialStatus = await initialStatusResponse.json();
    expect(initialStatus).toHaveProperty('credentialId', credentialId);
    expect(initialStatus).toHaveProperty('status', 'active');

    // Revoke the credential
    const revokeResponse = await fetch(`${ISSUER_URL}/api/issue/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentialId,
        status: 'revoked',
      }),
    });

    expect(revokeResponse.ok).toBeTruthy();
    const revokeData = await revokeResponse.json();
    expect(revokeData).toHaveProperty('credentialId', credentialId);
    expect(revokeData).toHaveProperty('status', 'revoked');
    expect(revokeData).toHaveProperty('updated', true);

    // Verify the status has changed
    const statusResponse = await fetch(`${ISSUER_URL}/api/issuer/status/${credentialId}`);
    expect(statusResponse.ok).toBeTruthy();
    const statusData = await statusResponse.json();
    expect(statusData).toHaveProperty('credentialId', credentialId);
    expect(statusData).toHaveProperty('status', 'revoked');

    // Verify 404 for non-existent credential
    const notFoundResponse = await fetch(`${ISSUER_URL}/api/issuer/status/nonexistent-id`);
    expect(notFoundResponse.status).toBe(404);
    const notFoundData = await notFoundResponse.json();
    expect(notFoundData).toHaveProperty('error', 'Credential not found');

    // Test suspended status as well
    const suspendResponse = await fetch(`${ISSUER_URL}/api/issue/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentialId,
        status: 'suspended',
      }),
    });

    expect(suspendResponse.ok).toBeTruthy();
    const suspendData = await suspendResponse.json();
    expect(suspendData).toHaveProperty('status', 'suspended');

    const suspendCheck = await fetch(`${ISSUER_URL}/api/issuer/status/${credentialId}`);
    const suspendCheckData = await suspendCheck.json();
    expect(suspendCheckData).toHaveProperty('status', 'suspended');

    console.log(`✅ POST /api/issue/status + GET /api/issuer/status: revocation lifecycle verified (id=${credentialId})`);
  });
});
