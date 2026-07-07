const routes = {
  '/issuance': () => import('../../routes/issuance.svelte'),
  '/wallet': () => import('../../routes/wallet.svelte'),
  '/present': () => import('../../routes/present.svelte'),
  '/verify': () => import('../../routes/verify.svelte'),
  '/history': () => import('../../routes/history.svelte'),
};

function createRouter() {
  let current = $state('/issuance');
  let currentComponent = $state(null);
  let currentProps = $state(null);

  function getPathFromHash() {
    const hash = window.location.hash || '#/issuance';
    return hash.slice(1) || '/issuance';
  }

  async function resolve() {
    const path = getPathFromHash();
    current = path;
    const loader = routes[path];
    if (loader) {
      const mod = await loader();
      currentComponent = mod.default || mod;
      currentProps = null;
    } else {
      current = '/issuance';
      window.location.hash = '#/issuance';
    }
  }

  function navigate(path) {
    if (path !== getPathFromHash()) {
      window.location.hash = '#' + path;
    }
  }

  function handleLinkClick(e) {
    const target = e.currentTarget;
    if (target && target.getAttribute('href')) {
      const href = target.getAttribute('href');
      if (href.startsWith('/')) {
        e.preventDefault();
        navigate(href);
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => resolve());
  }

  return {
    get current() { return current; },
    get currentComponent() { return currentComponent; },
    get currentProps() { return currentProps; },
    navigate,
    handleLinkClick,
    resolve,
  };
}

export const router = createRouter();
