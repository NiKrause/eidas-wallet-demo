<script>
  import IssuanceForm from '$lib/components/IssuanceForm.svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  const { t } = i18n;
</script>
<div class="page">
  <div class="page-header">
    <h1>{t('issuance.title')}</h1>
    <p class="page-desc">{t('issuance.desc')}</p>
  </div>
  <IssuanceForm onNavigate={(path) => { window.location.hash = '#' + path; }} />
</div>
<style>
  .page { padding: 1.5rem 1rem; }
  .page-header { text-align: center; margin-bottom: 1.5rem; }
  h1 { color: #1a237e; font-size: 1.3rem; margin-bottom: 0.5rem; }
  .page-desc { color: #666; font-size: 0.85rem; max-width: 400px; margin: 0 auto; line-height: 1.5; }
</style>