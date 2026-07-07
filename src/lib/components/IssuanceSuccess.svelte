<script>
  import { router } from '$lib/utils/router.svelte.js';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  const { t } = i18n;
  let { selectedTemplate, onReset } = $props();
</script>

<div class="success-container">
  <div class="success-icon">✅</div>
  <h2 class="success-title">{t('issuance.success.title')}</h2>
  <p class="success-subtitle"><span class="success-emoji">{selectedTemplate.icon}</span> {selectedTemplate.label}</p>
  <p class="success-desc">{t('issuance.success.desc')}</p>
  <div class="success-actions">
    <button class="btn btn-primary" onclick={() => router.navigate('/wallet')}>{t('issuance.success.view')}</button>
    <button class="btn btn-secondary" onclick={onReset}>{t('issuance.success.again')}</button>
  </div>
</div>

<style>
  .success-container { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2rem 1rem; }
  .success-icon { font-size: 3rem; margin-bottom: 0.5rem; }
  .success-title { color: #2e7d32; font-size: 1.3rem; margin-bottom: 0.5rem; }
  .success-subtitle { font-size: 1.1rem; color: #1a237e; font-weight: 500; margin-bottom: 0.5rem; }
  .success-emoji { margin-right: 0.3rem; }
  .success-desc { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
  .success-actions { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: 280px; }
  .btn { padding: 0.75rem 1.5rem; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.2s; }
  .btn:hover { opacity: 0.9; }
  .btn-primary { background: linear-gradient(135deg, #1a237e, #283593); color: white; }
  .btn-secondary { background: #f0f0f0; color: #333; }
  .btn-secondary:hover { background: #e0e0e0; }
</style>