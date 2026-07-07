/**
 * Revocation store — tracks revoked credentials and provides lookup.
 *
 * In a real eIDAS 2.0 system, revocation would use:
 *   - CRL (Certificate Revocation List) – periodic bulk download
 *   - OCSP (Online Certificate Status Protocol) – real-time check
 *   - Status List JWT (RFC 9576) – efficient status embedding
 *
 * This demo simulates revocation by maintaining a local list of
 * revoked credential IDs. The "Authority Dashboard" triggers revocations,
 * and the Verifier checks against this list during presentation.
 */

const STORAGE_KEY = 'eidas_wallet_revoked';

function loadRevoked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('Failed to load revoked list:', e); }
  return [];
}

function saveRevoked(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }
  catch (e) { console.warn('Failed to save revoked list:', e); }
}

function createRevocationStore() {
  let _revoked = $state(loadRevoked());

  return {
    /** All revoked credential entries */
    get all() { return _revoked; },
    get count() { return _revoked.length; },

    /** Check if a credential ID has been revoked */
    isRevoked(credentialId) {
      return _revoked.some(e => e.credentialId === credentialId);
    },

    /** Get revocation details for a credential */
    getRevocation(credentialId) {
      return _revoked.find(e => e.credentialId === credentialId) || null;
    },

    /**
     * Revoke a credential.
     * @param {string} credentialId
     * @param {string} reasonId – key from REVOCATION_REASONS
     * @param {string} authority – name of revoking authority
     */
    revoke(credentialId, reasonId, authority = 'National Identity Authority') {
      if (this.isRevoked(credentialId)) return false;

      const entry = {
        credentialId,
        reasonId,
        reasonLabel: getReasonLabel(reasonId),
        authority,
        revokedAt: new Date().toISOString(),
      };
      _revoked = [..._revoked, entry];
      saveRevoked(_revoked);
      return true;
    },

    /** Reinstate a revoked credential */
    reinstate(credentialId) {
      _revoked = _revoked.filter(e => e.credentialId !== credentialId);
      saveRevoked(_revoked);
    },

    clear() {
      _revoked = [];
      saveRevoked(_revoked);
    },
  };
}

function getReasonLabel(reasonId) {
  const reasons = {
    stolen: 'Device reported stolen',
    lost: 'Device or eID card lost',
    identity_change: 'Identity data changed',
    expired: 'Credential expired',
    administrative: 'Administrative revocation',
    fraud: 'Fraud or misuse detected',
  };
  return reasons[reasonId] || reasonId;
}

export const revocationStore = createRevocationStore();
