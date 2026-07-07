<script>
  import WalletDashboard from '$lib/components/WalletDashboard.svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  const { t } = i18n;
</script>
<div class="page">
  <div class="page-header">
    <h1>{t('wallet.title')}</h1>
    <p class="page-desc">{t('wallet.desc')}</p>
  </div>
  <WalletDashboard />
</div>
<style>
  .page { padding-bottom: 0.5rem; }
  .page-header { text-align: center; padding: 1rem 1rem 0; }
  h1 { color: #1a237e; font-size: 1.3rem; margin-bottom: 0.3rem; }
  .page-desc { color: #666; font-size: 0.85rem; }
</style>