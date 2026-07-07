/**
 * OpenID4VP Verifier Server E2E Tests
 *
 * Tests the Flask server API endpoints for the OpenID4VP flow:
 * 1. POST /api/presentation-request — creates a request
 * 2. The QR encodes the openid4vp:// URI
 * 3. POST /api/response — validates and stores a VP token
 * 4. GET /api/result — returns the verification result
 *
 * These tests require the Flask server running on port 3000.
 * Skip if server is unavailable.
 */

import { test, expect } from '@playwright/test';

const VERIFIER_URL = 'http://localhost:3000';

// Helper to bypass self-signed cert in Node.js fetch
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

test.describe('OpenID4VP Verifier Server', () => {

  // Phase 2: Create a presentation request
  test('POST /api/presentation-request creates an OpenID4VP URI', async () => {
    const response = await fetch(`${VERIFIER_URL}/api/presentation-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentialType: 'PID',
        credentialLabel: 'Personal Identification Data',
        credentialId: 'e2e-test-1',
        attributes: { given_name: 'Jane', family_name: 'Smith' },
        sharedAttributes: ['given_name', 'family_name'],
      }),
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('request_id');
    expect(data).toHaveProperty('openid4vp_uri');
    expect(data.openid4vp_uri).toContain('openid4vp://authorize');
    expect(data.openid4vp_uri).toContain('response_type=vp_token');
    expect(data.openid4vp_uri).toContain('client_id=');
    expect(data.openid4vp_uri).toContain('presentation_definition=');
    expect(data.openid4vp_uri).toContain('nonce=');
    expect(data.openid4vp_uri).toContain('response_mode=direct_post');
    expect(data.openid4vp_uri).toContain('response_uri=');
    expect(data).toHaveProperty('presentation_definition');
    expect(data.presentation_definition).toHaveProperty('input_descriptors');
    expect(data.presentation_definition.input_descriptors[0]).toHaveProperty('constraints');
    expect(data.presentation_definition.input_descriptors[0].constraints.fields.length).toBe(2);

    console.log(`✅ OpenID4VP URI created: ${data.openid4vp_uri.substring(0, 80)}...`);
  });

  // Phase 3b: Submit a valid VP token
  test('POST /api/response accepts valid VP token', async () => {
    const response = await fetch(`${VERIFIER_URL}/api/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vp_token: JSON.stringify({
          format: 'sd_jwt_vc',
          credentialType: 'PID',
          credentialLabel: 'Personal Identification Data',
          credentialId: 'e2e-test-2',
          issuer: 'National Identity Authority',
          issuedAt: '2026-07-07T12:00:00Z',
          attributes: { given_name: 'Jane', family_name: 'Smith' },
          sharedAttributes: ['given_name', 'family_name'],
          timestamp: new Date().toISOString(),
        }),
        presentation_submission: {
          definition_id: 'e2e-def-2',
          descriptor_map: [{ id: 'PID', format: 'sd_jwt_vc', path: '$' }],
        },
      }),
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('result_id');
    expect(data.status).toBe('received');
    expect(data.verified).toBe(true);

    console.log(`✅ VP token accepted: result_id=${data.result_id}`);

    // Now fetch the result
    const resultResponse = await fetch(`${VERIFIER_URL}/api/result/${data.result_id}`);
    expect(resultResponse.ok).toBeTruthy();
    const result = await resultResponse.json();

    expect(result.verified).toBe(true);
    expect(result.vp_token).toHaveProperty('credentialType', 'PID');
    expect(result.vp_token.attributes).toHaveProperty('given_name', 'Jane');
    expect(result.validation_errors).toBeNull();

    console.log('✅ Verification result confirmed: verified=true');
  });

  // Phase 3b: Reject invalid VP token (missing fields)
  test('POST /api/response rejects VP token with missing required fields', async () => {
    const response = await fetch(`${VERIFIER_URL}/api/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vp_token: JSON.stringify({
          format: 'sd_jwt_vc',
          // missing: credentialType, credentialId
        }),
        presentation_submission: {},
      }),
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();

    expect(data.verified).toBe(false);
    expect(data.status).toBe('rejected');
    expect(data.validation_errors).toBeTruthy();
    expect(data.validation_errors.length).toBeGreaterThan(0);
    expect(data.validation_errors[0]).toContain('Missing required fields');

    console.log(`✅ Rejected invalid VP: ${data.validation_errors.join('; ')}`);
  });

  // Phase 3b: Reject unsupported format
  test('POST /api/response rejects unsupported credential format', async () => {
    const response = await fetch(`${VERIFIER_URL}/api/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vp_token: JSON.stringify({
          format: 'my-custom-format',
          credentialType: 'PID',
          credentialId: 'e2e-test-3',
          timestamp: new Date().toISOString(),
        }),
        presentation_submission: {},
      }),
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();

    expect(data.verified).toBe(false);
    expect(data.status).toBe('rejected');
    expect(data.validation_errors[0]).toContain('Unsupported format');

    console.log('✅ Rejected unsupported format');
  });

  // Phase 3b: Reject expired VP token
  test('POST /api/response rejects expired VP token (older than 5 min)', async () => {
    const response = await fetch(`${VERIFIER_URL}/api/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vp_token: JSON.stringify({
          format: 'sd_jwt_vc',
          credentialType: 'PID',
          credentialId: 'e2e-test-4',
          timestamp: '2020-01-01T00:00:00Z', // expired!
        }),
        presentation_submission: {},
      }),
    });

    expect(response.ok).toBeTruthy();
    const data = await response.json();

    expect(data.verified).toBe(false);
    expect(data.status).toBe('rejected');
    expect(data.validation_errors[0]).toContain('older than 5 minutes');

    console.log('✅ Rejected expired VP');
  });

  // Endpoint discovery
  test('GET /api/info returns server status', async () => {
    const response = await fetch(`${VERIFIER_URL}/api/info`);
    expect(response.ok).toBeTruthy();
    const data = await response.json();

    expect(data.status).toBe('running');
    expect(data).toHaveProperty('endpoints');
    expect(data.endpoints).toHaveProperty('create_request');
    expect(data.endpoints).toHaveProperty('receive_response');
    expect(data.endpoints).toHaveProperty('get_result');

    console.log('✅ Server info confirmed: status=running');
  });
});
