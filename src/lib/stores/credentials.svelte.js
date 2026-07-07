const STORAGE_KEY = 'eidas_wallet_credentials';

function loadCredentials() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('Failed to load:', e); }
  return [];
}

function saveCredentials(credentials) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials)); }
  catch (e) { console.warn('Failed to save:', e); }
}

function createCredentialStore() {
  let credentials = $state(loadCredentials());

  return {
    get all() { return credentials; },
    getById(id) { return credentials.find(c => c.id === id) || null; },
    getByType(type) { return credentials.filter(c => c.type === type); },
    get pid() { return credentials.filter(c => c.type === 'PID'); },
    get qeaas() { return credentials.filter(c => c.type === 'QEAA'); },
    get count() { return credentials.length; },
    get active() { return credentials.filter(c => c.status !== 'revoked'); },
    get revoked() { return credentials.filter(c => c.status === 'revoked'); },

    add(credential) {
      credentials = [...credentials, credential];
      saveCredentials(credentials);
    },

    remove(id) {
      credentials = credentials.filter(c => c.id !== id);
      saveCredentials(credentials);
    },

    /** Update the revocation status of a credential */
    updateStatus(id, status, revocationReason) {
      credentials = credentials.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status,
            revokedAt: status === 'revoked' ? new Date().toISOString() : null,
            revocationReason: status === 'revoked' ? revocationReason : null,
          };
        }
        return c;
      });
      saveCredentials(credentials);
    },

    clear() {
      credentials = [];
      saveCredentials(credentials);
    },
  };
}

export const credentialStore = createCredentialStore();
