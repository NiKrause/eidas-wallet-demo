/**
 * Simple hash-based router. Just handles hash state and navigation.
 * Component selection is done in app.svelte via {#if} blocks.
 */

function createRouter() {
  let _current = '/issuance';

  function getPathFromHash() {
    const hash = window.location.hash || '#/issuance';
    return hash.slice(1) || '/issuance';
  }

  function resolve() {
    const path = getPathFromHash();
    _current = path;
    window.location.hash = '#' + path;
  }

  function navigate(path) {
    if (path !== getPathFromHash()) {
      window.location.hash = '#' + path;
      _current = path;
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => resolve());
  }

  return {
    get current() { return _current; },
    navigate,
    resolve,
  };
}

export const router = createRouter();
