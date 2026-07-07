<script>
  import { onMount } from 'svelte';
  import { router } from '$lib/utils/router.svelte.js';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import IssuancePage from './routes/issuance.svelte';
  import WalletPage from './routes/wallet.svelte';
  import PresentPage from './routes/present.svelte';
  import VerifyPage from './routes/verify.svelte';
  import HistoryPage from './routes/history.svelte';

  let route = $state('/issuance');

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
      <span class="header-title">EUDI Wallet Demo</span>
    </div>
    <span class="header-badge">eIDAS 2.0</span>
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
  .header-badge { font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 500; }
  .app-content { flex: 1; padding-bottom: 4rem; }
</style>
