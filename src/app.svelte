<script>
  import { onMount } from 'svelte';
  import { router } from '$lib/utils/router.svelte.js';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import IssuancePage from './routes/issuance.svelte';
  import WalletPage from './routes/wallet.svelte';
  import PresentPage from './routes/present.svelte';
  import VerifyPage from './routes/verify.svelte';
  import HistoryPage from './routes/history.svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';

  let route = $state('/issuance');

  const { t, locale, setLocale } = i18n;

  function toggleLang() {
    setLocale(locale === 'de' ? 'en' : 'de');
  }

  onMount(() => {
    function onHashChange() {
      route = router.current;
    }
    router.resolve();
    route = router.current;
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  });
</script>

<div class="app-shell">
  <header class="app-header">
    <div class="header-brand">
      <span class="header-flag">🇪🇺</span>
      <span class="header-title">{t('app.title')}</span>
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
  .header-actions { display: flex; align-items: center; gap: 0.5rem; }
  .header-badge { font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 500; }

  .lang-btn { background: rgba(255,255,255,0.15); border: none; color: white; cursor: pointer; font-size: 1rem; padding: 0.2rem 0.4rem; border-radius: 6px; transition: background 0.2s; display: flex; align-items: center; }
  .lang-btn:hover { background: rgba(255,255,255,0.3); }

  .github-link { display: flex; align-items: center; color: white; opacity: 0.8; transition: opacity 0.2s; }
  .github-link:hover { opacity: 1; }

  .app-content { flex: 1; padding-bottom: 4rem; }
</style>
