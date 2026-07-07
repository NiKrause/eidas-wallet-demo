const STORAGE_KEY = 'eidas_wallet_history';

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('Failed to load:', e); }
  return [];
}

function saveHistory(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }
  catch (e) { console.warn('Failed to save:', e); }
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function createHistoryStore() {
  let entries = $state(loadHistory());

  return {
    get all() { return entries; },
    get count() { return entries.length; },
    add(entry) {
      const newEntry = { id: generateId(), ...entry, presentedAt: new Date().toISOString(), status: 'success' };
      entries = [newEntry, ...entries];
      saveHistory(entries);
      return newEntry;
    },
    getById(id) { return entries.find(e => e.id === id) || null; },
    clear() {
      entries = [];
      saveHistory(entries);
    },
    exportJSON() { return JSON.stringify(entries, null, 2); },
  };
}

export const historyStore = createHistoryStore();
