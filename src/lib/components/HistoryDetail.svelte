<script>
  import { i18n } from '$lib/stores/i18n.svelte.js';
  const { t } = i18n;
  let { entry, onClose } = $props();
  function formatDateTime(iso) { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
</script>

<div class="backdrop" onclick={onClose} role="presentation"></div>
<div class="modal" role="dialog" aria-label="Presentation details">
  <div class="modal-header">
    <span class="modal-icon">{entry.credentialIcon || '📄'}</span>
    <div><h2 class="modal-title">{t('history.detail.title')}</h2><span class="modal-credential">{entry.credentialLabel}</span></div>
    <button class="close-btn" onclick={onClose}>✕</button>
  </div>
  <div class="modal-body">
    <div class="info-row"><span class="info-label">{t('history.detail.status')}</span><span class="info-value status-success">{t('history.detail.success')}</span></div>
    <div class="info-row"><span class="info-label">{t('history.detail.presented')}</span><span class="info-value">{formatDateTime(entry.presentedAt)}</span></div>
    {#if entry.verifierName && !entry.verifierName.startsWith('Pending')}
      <div class="info-row"><span class="info-label">{t('history.detail.verifier')}</span><span class="info-value">{entry.verifierName}</span></div>
    {/if}
    <div class="attributes-section">
      <h3 class="attributes-title">{t('history.detail.shared')}</h3>
      <p class="attributes-count">{t('history.detail.count', { count: entry.sharedAttributes?.length || 0 })}</p>
      {#if entry.sharedAttributes && entry.sharedAttributes.length > 0}
        <div class="attributes-list">
          {#each entry.sharedAttributes as key}
            <div class="attribute-row"><span class="attr-key">{key}</span><span class="attr-value">{entry.sharedValues?.[key] !== undefined ? String(entry.sharedValues[key]) : '—'}</span></div>
          {/each}
        </div>
      {:else}
        <p class="no-attrs">{t('history.detail.no_attrs')}</p>
      {/if}
    </div>
    <details class="raw-data"><summary>{t('history.detail.raw')}</summary><pre>{JSON.stringify(entry, null, 2)}</pre></details>
  </div>
  <div class="modal-footer"><button class="btn btn-secondary" onclick={onClose}>{t('history.detail.close')}</button></div>
</div>

<style>
  .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; animation: fadeIn 0.2s ease; }
  .modal { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-radius: 20px 20px 0 0; z-index: 201; padding: 1.5rem; max-height: 85vh; overflow-y: auto; animation: slideUp 0.3s ease; box-shadow: 0 -4px 24px rgba(0,0,0,0.15); }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
  .modal-icon { font-size: 2rem; }
  .modal-title { font-size: 1.1rem; color: #1a237e; margin: 0; }
  .modal-credential { font-size: 0.8rem; color: #666; display: block; }
  .close-btn { margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999; padding: 0.25rem; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
  .close-btn:hover { background: #f0f0f0; color: #333; }
  .modal-body { display: flex; flex-direction: column; gap: 0.75rem; }
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid #f5f5f5; }
  .info-label { font-size: 0.85rem; color: #888; }
  .info-value { font-size: 0.85rem; color: #333; font-weight: 500; text-align: right; }
  .status-success { color: #2e7d32; }
  .attributes-section { margin-top: 0.5rem; }
  .attributes-title { font-size: 0.9rem; color: #1a237e; margin-bottom: 0.15rem; }
  .attributes-count { font-size: 0.8rem; color: #888; margin-bottom: 0.5rem; }
  .attributes-list { display: flex; flex-direction: column; gap: 0.3rem; background: #f8f9ff; border-radius: 10px; padding: 0.75rem; }
  .attribute-row { display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0; border-bottom: 1px solid #eee; }
  .attribute-row:last-child { border-bottom: none; }
  .attr-key { font-size: 0.8rem; color: #888; font-family: monospace; }
  .attr-value { font-size: 0.85rem; color: #333; font-weight: 500; }
  .no-attrs { font-size: 0.85rem; color: #999; font-style: italic; padding: 0.5rem 0; }
  .raw-data { margin-top: 0.25rem; }
  .raw-data summary { font-size: 0.8rem; color: #888; cursor: pointer; margin-bottom: 0.5rem; }
  .raw-data pre { font-size: 0.65rem; background: #f5f5f5; border-radius: 8px; padding: 0.75rem; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; }
  .modal-footer { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
  .btn { flex: 1; padding: 0.7rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.2s; }
  .btn:hover { opacity: 0.9; }
  .btn-secondary { background: #f0f0f0; color: #333; }
</style>