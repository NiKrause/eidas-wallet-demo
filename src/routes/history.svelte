<script>
  import HistoryList from '$lib/components/HistoryList.svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  const { t } = i18n;
</script>
<div class="page">
  <div class="page-header">
    <h1>{t('history.title')}</h1>
    <p class="page-desc">{t('history.desc')}</p>
  </div>
  <HistoryList />
</div>
<style>
  .page { padding: 1.5rem 1rem; }
  .page-header { text-align: center; margin-bottom: 1.5rem; }
  h1 { color: #1a237e; font-size: 1.3rem; margin-bottom: 0.3rem; }
  .page-desc { color: #666; font-size: 0.85rem; max-width: 350px; margin: 0 auto; }
</style>