<script>
  import { onMount } from 'svelte';
  import { router } from '$lib/utils/router.svelte.js';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import IssuancePage from './routes/issuance.svelte';
  import WalletPage from './routes/wallet.svelte';
  import PresentPage from './routes/present.svelte';
  import VerifyPage from './routes/verify.svelte';
  import HistoryPage from './routes/history.svelte';
  import AuthorityPage from './routes/authority.svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';

  let route = $state('/issuance');

  const { t, locale, setLocale } = i18n;

  function toggleLang() {
    setLocale(locale === 'de' ? 'en' : 'de');
  }

  // Global server status — checked on mount and every 10s
  let verifierOnline = $state(false);
  let issuerOnline = $state(false);
  let serverChecking = $state(true);

  async function checkServers() {
    serverChecking = true;
    try {
      const vr = await fetch('http://localhost:3000/api/info');
      verifierOnline = vr.ok;
    } catch { verifierOnline = false; }
    try {
      const ir = await fetch('http://localhost:3001/api/info');
      issuerOnline = ir.ok;
    } catch { issuerOnline = false; }
    serverChecking = false;
  }

  onMount(() => {
    function onHashChange() {
      route = router.current;
    }
    router.resolve();
    route = router.current;
    window.addEventListener('hashchange', onHashChange);

    // Initial server check
    checkServers();
    // Re-check every 10s
    const interval = setInterval(checkServers, 10000);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      clearInterval(interval);
    };
  });
</script>

<div class="app-shell">
  <header class="app-header">
    <div class="header-brand">
      <span class="header-flag">🇪🇺</span>
      <span class="header-title">{t('app.title')}</span>
    </div>
    <div class="server-leds">
      {#if serverChecking}
        <span class="led led-checking" title="Prüfe Server…"></span>
      {:else}
        <span class="led" class:led-verifier={verifierOnline} class:led-off={!verifierOnline} title={verifierOnline ? 'Verifier-Server ✅ (:3000)' : 'Verifier offline'}>V</span>
        <span class="led" class:led-issuer={issuerOnline} class:led-off={!issuerOnline} title={issuerOnline ? 'Issuer-Server ✅ (:3001)' : 'Issuer offline'}>I</span>
      {/if}
    </div>
    <div class="header-actions">
      <button class="lang-btn" onclick={toggleLang} title={locale === 'de' ? 'Switch to English' : 'Auf Deutsch umschalten'}>
        {locale === 'de' ? '🇬🇧' : '🇩🇪'}
      </button>
      <a href="https://github.com/NiKrause/eidas-wallet-demo" target="_blank" rel="noopener noreferrer" class="github-link" title="View source on GitHub">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>
      <span class="header-badge">{t('app.badge')}</span>
    </div>
  </header>
  <main class="app-content">
    {#if route === '/issuance'}
      <IssuancePage />
    {:else if route === '/wallet'}
      <WalletPage />
    {:else if route === '/present'}
      <PresentPage />
    {:else if route === '/verify'}
      <VerifyPage />
    {:else if route === '/history'}
      <HistoryPage />
    {:else if route === '/authority'}
      <AuthorityPage />
    {:else}
      <IssuancePage />
    {/if}
  </main>
  <BottomNav />
</div>

<style>
  :global(*) { margin: 0; padding: 0; box-sizing: border-box; }
  :global(body) { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9ff; color: #222; -webkit-font-smoothing: antialiased; }
  .app-shell { display: flex; flex-direction: column; min-height: 100dvh; }

  .app-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: linear-gradient(135deg, #1a237e 0%, #283593 100%); color: white; position: sticky; top: 0; z-index: 50; }
  .header-brand { display: flex; align-items: center; gap: 0.5rem; }
  .header-flag { font-size: 1.3rem; }
  .header-title { font-size: 1rem; font-weight: 600; }

  /* Server LEDs */
  .server-leds { display: flex; gap: 0.25rem; align-items: center; }
  .led { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; font-size: 0.55rem; font-weight: 700; color: white; transition: all 0.3s; cursor: help; }
  .led-verifier { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
  .led-issuer { background: #22c55e; box-shadow: 0 0 6px #22c55e; color: #22c55e; }
  .led-off { background: #555; opacity: 0.5; }
  .led-checking { width: 10px; height: 10px; background: #f59e0b; animation: ledPulse 1s infinite; }
  @keyframes ledPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

  .header-actions { display: flex; align-items: center; gap: 0.5rem; }
  .header-badge { font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 500; }

  .lang-btn { background: rgba(255,255,255,0.15); border: none; color: white; cursor: pointer; font-size: 1rem; padding: 0.2rem 0.4rem; border-radius: 6px; transition: background 0.2s; display: flex; align-items: center; }
  .lang-btn:hover { background: rgba(255,255,255,0.3); }

  .github-link { display: flex; align-items: center; color: white; opacity: 0.8; transition: opacity 0.2s; }
  .github-link:hover { opacity: 1; }

  .app-content { flex: 1; padding-bottom: 4.5rem; }
</style>
