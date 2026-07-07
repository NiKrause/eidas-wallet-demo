<script>
  import { credentialStore } from '$lib/stores/credentials.svelte.js';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  let { credential, onClose } = $props();
  const { t } = i18n;

  function formatDate(iso) { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  function handleDelete() { if (confirm(t('wallet.delete_confirm', { label: credential.label }))) { credentialStore.remove(credential.id); onClose?.(); } }
  let isPID = $derived(credential.type === 'PID');
  let isRevoked = $derived(credential.status === 'revoked');
</script>

<div class="backdrop" onclick={onClose} role="presentation"></div>
<div class="modal" role="dialog" aria-label="Credential details">
  <div class="modal-header">
    <span class="modal-icon">{credential.icon}</span>
    <div>
      <h2 class="modal-title">{credential.label}</h2>
      <div class="modal-badges">
        <span class="modal-badge" class:badge-pid={isPID} class:badge-qeaa={!isPID}>{credential.type}</span>
        {#if isRevoked}
          <span class="modal-badge badge-revoked">{t('wallet.revoked_badge')}</span>
        {/if}
      </div>
    </div>
    <button class="close-btn" onclick={onClose}>✕</button>
  </div>
  <div class="modal-body">
    <div class="info-row"><span class="info-label">{t('wallet.detail.issuer')}</span><span class="info-value">{credential.issuer}</span></div>
    <div class="info-row"><span class="info-label">{t('wallet.detail.issuedAt')}</span><span class="info-value">{formatDate(credential.issuedAt)}</span></div>
    {#if isRevoked}
      <div class="info-row"><span class="info-label">{t('verify.result.revoked_at')}</span><span class="info-value status-revoked">{formatDate(credential.revokedAt)}</span></div>
      <div class="info-row"><span class="info-label">{t('verify.result.revoked_reason')}</span><span class="info-value status-revoked">{credential.revocationReason || '—'}</span></div>
      <div class="revoked-notice">🔴 {t('wallet.revoked_detail')}</div>
    {/if}
    <div class="info-row"><span class="info-label">{t('wallet.detail.id')}</span><span class="info-value id-value">{credential.id}</span></div>
    <div class="attributes-section">
      <h3 class="attributes-title">{t('wallet.detail.title')}</h3>
      <div class="attributes-list">
        {#each Object.entries(credential.attributes) as [key, value]}
          <div class="attribute-row"><span class="attr-key">{key}</span><span class="attr-value">{String(value)}</span></div>
        {/each}
      </div>
    </div>
  </div>
  <div class="modal-footer">
    {#if !isRevoked}
      <button class="btn btn-danger" onclick={handleDelete}>🗑️ {t('wallet.detail.remove')}</button>
    {/if}
    <button class="btn btn-secondary" onclick={onClose}>{t('wallet.detail.close')}</button>
  </div>
</div>

<style>
  .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; animation: fadeIn 0.2s ease; }
  .modal { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-radius: 20px 20px 0 0; z-index: 201; padding: 1.5rem; max-height: 85vh; overflow-y: auto; animation: slideUp 0.3s ease; box-shadow: 0 -4px 24px rgba(0,0,0,0.15); }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
  .modal-icon { font-size: 2rem; }
  .modal-title { font-size: 1.1rem; color: #1a237e; margin: 0; }
  .modal-badges { display: flex; gap: 0.3rem; margin-top: 0.2rem; }
  .modal-badge { font-size: 0.6rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 8px; text-transform: uppercase; display: inline-block; }
  .badge-revoked { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .close-btn { margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999; padding: 0.25rem; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
  .close-btn:hover { background: #f0f0f0; color: #333; }
  .modal-body { display: flex; flex-direction: column; gap: 0.75rem; }
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid #f5f5f5; }
  .info-label { font-size: 0.85rem; color: #888; }
  .info-value { font-size: 0.85rem; color: #333; font-weight: 500; text-align: right; max-width: 60%; }
  .status-revoked { color: #dc2626; }
  .id-value { font-size: 0.7rem; font-family: monospace; color: #999; word-break: break-all; }
  .revoked-notice { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 0.6rem 0.8rem; font-size: 0.85rem; color: #dc2626; text-align: center; }
  .attributes-section { margin-top: 0.5rem; }
  .attributes-title { font-size: 0.9rem; color: #1a237e; margin-bottom: 0.5rem; }
  .attributes-list { display: flex; flex-direction: column; gap: 0.3rem; background: #f8f9ff; border-radius: 10px; padding: 0.75rem; }
  .attribute-row { display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0; border-bottom: 1px solid #eee; }
  .attribute-row:last-child { border-bottom: none; }
  .attr-key { font-size: 0.8rem; color: #888; font-family: monospace; }
  .attr-value { font-size: 0.85rem; color: #333; font-weight: 500; }
  .modal-footer { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
  .btn { flex: 1; padding: 0.7rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.2s; }
  .btn:hover { opacity: 0.9; }
  .btn-danger { background: #fef2f2; color: #dc2626; }
  .btn-danger:hover { background: #fee2e2; }
  .btn-secondary { background: #f0f0f0; color: #333; }
</style>
