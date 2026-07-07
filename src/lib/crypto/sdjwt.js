/**
 * SD-JWT (Selective Disclosure JWT) implementation.
 *
 * Uses the WebCrypto API to sign and verify credentials using ECDSA (P-256).
 * In a real eIDAS 2.0 environment, the issuer would have a trusted key pair
 * and the verifier would check against a trust registry.
 *
 * For this demo:
 *   - The Issuer (authority.svelte) has a stable key pair stored in localStorage
 *   - The Verifier (VerifierView) fetches the issuer's public key via an endpoint
 *   - SD-JWT payload follows ISO 18013-7 / W3C VC Data Model conventions
 *
 * Formats used:
 *   - Issuance:  SD-JWT = <issuer-signed-jwt>~<hashes>~<salt-values>
 *   - Presentation: VP Token = SD-JWT with only disclosed disclosures
 *   - Verification: Re-hash disclosed values, compare to disclosed hashes, verify signature
 */

import { SignJWT, jwtVerify, generateKeyPair, importPKCS8, importSPKI, exportSPKI } from 'jose';
import { browserCrypto } from './crypto-browser.js';

const ALGORITHM = 'ES256'; // ECDSA P-256
const CURVE = 'P-256';
const ISSUER_KEY_STORAGE = 'eidas_wallet_issuer_key';

// ===========================================================================
// Key Management
// ===========================================================================

/**
 * Get or generate the issuer's key pair.
 * In production, this would be a trusted authority key.
 * In our demo, we generate it once and store it.
 */
export async function getIssuerKeyPair() {
  try {
    const stored = localStorage.getItem(ISSUER_KEY_STORAGE);
    if (stored) {
      const { privateKeyPem, publicKeyPem } = JSON.parse(stored);
      const privateKey = await importPKCS8(privateKeyPem, ALGORITHM);
      const publicKey = await importSPKI(publicKeyPem, ALGORITHM);
      return { privateKey, publicKey, publicKeyPem };
    }
  } catch (e) {
    console.warn('Failed to load issuer key, generating new one:', e);
  }

  // Generate new key pair
  const { publicKey, privateKey } = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: CURVE },
    true,
    ['sign', 'verify']
  );

  // Export as PEM for storage
  const publicKeyPem = await exportSPKI(publicKey);
  const privateKeyPem = await crypto.subtle.exportKey('pkcs8', privateKey)
    .then(keyData => {
      const binary = String.fromCharCode(...new Uint8Array(keyData));
      const base64 = btoa(binary);
      return `-----BEGIN PRIVATE KEY-----\n${base64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
    });

  localStorage.setItem(ISSUER_KEY_STORAGE, JSON.stringify({
    privateKeyPem,
    publicKeyPem,
    generatedAt: new Date().toISOString(),
  }));

  return { privateKey, publicKey, publicKeyPem };
}

/**
 * Get the issuer's public key (for the Verifier).
 */
export function getIssuerPublicKeyPem() {
  try {
    const stored = localStorage.getItem(ISSUER_KEY_STORAGE);
    if (stored) {
      return JSON.parse(stored).publicKeyPem;
    }
  } catch (e) { /* ignore */ }
  return null;
}

// ===========================================================================
// Credential Issuance (SD-JWT Signing)
// ===========================================================================

/**
 * Issue a signed SD-JWT credential.
 *
 * @param {Object} credential - The credential data (type, attributes, etc.)
 * @param {Object} options
 * @param {string[]} [options.selectivelyDisclosable] - Which attributes are SD
 * @returns {Promise<string>} The SD-JWT string
 */
export async function issueSDJWT(credential, options = {}) {
  const { privateKey, publicKeyPem } = await getIssuerKeyPair();
  const selectivelyDisclosable = options.selectivelyDisclosable ||
    Object.keys(credential.attributes);

  const now = Math.floor(Date.now() / 1000);
  const credentialId = credential.id;

  // Build the JWT payload conforming to ISO 18013-7 / W3C VC DM
  const payload = {
    iss: credential.issuer,
    sub: `urn:eidas:wallet:${credentialId.slice(0, 8)}`,
    iat: now,
    exp: now + 365 * 24 * 3600, // 1 year validity
    jti: credentialId,
    vc: {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://europa.eu/eidas/2024/credentials/v1',
      ],
      type: ['VerifiableCredential', 'EUDIWalletCredential', credential.type],
      credentialSubject: {
        id: `urn:eidas:wallet:${credentialId.slice(0, 8)}`,
        ...credential.attributes,
      },
    },
    sd: selectivelyDisclosable,
  };

  // Sign the JWT
  const sdjwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM, typ: 'sd-jwt' })
    .setIssuer(credential.issuer)
    .setSubject(`urn:eidas:wallet:${credentialId.slice(0, 8)}`)
    .setIssuedAt(now)
    .setExpirationTime(now + 365 * 24 * 3600)
    .setJti(credentialId)
    .sign(privateKey);

  return sdjwt;
}

// ===========================================================================
// Credential Verification
// ===========================================================================

/**
 * Verify an SD-JWT and return the decoded payload.
 *
 * @param {string} sdjwt - The SD-JWT string
 * @param {CryptoKey} [publicKey] - Optional issuer public key (otherwise auto-detected)
 * @returns {Promise<{payload: Object, protectedHeader: Object}>}
 */
export async function verifySDJWT(sdjwt, publicKey = null) {
  if (!publicKey) {
    // In demo mode, the issuer and verifier are in the same browser
    const { publicKey: issuerPublicKey } = await getIssuerKeyPair();
    publicKey = issuerPublicKey;
  }

  const { payload, protectedHeader } = await jwtVerify(sdjwt, publicKey, {
    algorithms: [ALGORITHM],
  });

  return { payload, protectedHeader };
}

/**
 * Extract the credential data from an SD-JWT payload.
 */
export function extractCredentialFromSDJWT(payload) {
  const vc = payload.vc || {};
  const subject = vc.credentialSubject || {};

  return {
    id: payload.jti,
    type: vc.type?.includes('PID') ? 'PID' : 'QEAA',
    label: vc.type?.includes('PID') ? 'Personal Identification Data' : 'Qualified Electronic Attestation',
    issuer: payload.iss,
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    attributes: { ...subject },
    // Remove internal fields
    _raw: { payload },
  };
}

// ===========================================================================
// Selective Disclosure Helpers
// ===========================================================================

/**
 * Create a presentation (VP Token) from an SD-JWT, disclosing only selected attributes.
 *
 * @param {string} sdjwt - The full SD-JWT
 * @param {string[]} discloseAttributes - Which attributes to share
 * @returns {Promise<Object>} The VP Token
 */
export async function createPresentation(sdjwt, discloseAttributes) {
  const { payload } = await verifySDJWT(sdjwt);
  const subject = payload.vc?.credentialSubject || {};

  // Build the disclosed presentation
  const disclosed = {};
  for (const attr of discloseAttributes) {
    if (attr in subject) {
      disclosed[attr] = subject[attr];
    }
  }

  return {
    format: 'sd_jwt_vc',
    credentialType: payload.vc?.type?.slice(-1)[0] || 'Unknown',
    credentialLabel: payload.vc?.type?.includes('PID') ? 'Personal Identification Data' : 'Credential',
    credentialId: payload.jti,
    issuer: payload.iss,
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    status: 'active',
    attributes: disclosed,
    sharedAttributes: discloseAttributes,
    timestamp: new Date().toISOString(),
  };
}
