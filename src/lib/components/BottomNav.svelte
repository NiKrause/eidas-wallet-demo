<script>
  import { router } from '$lib/utils/router.svelte.js';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  const { t } = i18n;
  const tabs = [
    { path: '/issuance', icon: '🪪' },
    { path: '/wallet',   icon: '👛' },
    { path: '/present',  icon: '📲' },
    { path: '/verify',   icon: '✅' },
    { path: '/history',  icon: '📋' },
  ];
</script>
<nav class="bottom-nav">
  {#each tabs as tab}
    <button class="nav-item" class:active={router.current === tab.path} onclick={() => router.navigate(tab.path)}>
      <span class="nav-icon">{tab.icon}</span>
      <span class="nav-label">{t('nav.' + tab.path.replace('/', ''))}</span>
    </button>
  {/each}
</nav>
<style>
  .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-around; align-items: center; background: #ffffff; border-top: 1px solid #e0e0e0; padding: 0.35rem 0; padding-bottom: max(0.35rem, env(safe-area-inset-bottom)); z-index: 100; box-shadow: 0 -2px 8px rgba(0,0,0,0.06); }
  .nav-item { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; background: none; border: none; cursor: pointer; padding: 0.25rem 0.6rem; border-radius: 8px; transition: background 0.2s; min-width: 56px; }
  .nav-item:hover { background: #f5f5f5; }
  .nav-item.active { color: #1a237e; }
  .nav-item.active .nav-icon { transform: scale(1.1); }
  .nav-icon { font-size: 1.3rem; transition: transform 0.2s; }
  .nav-label { font-size: 0.65rem; font-weight: 500; color: #666; }
  .nav-item.active .nav-label { color: #1a237e; font-weight: 600; }
</style>