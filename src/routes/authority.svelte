<script>
  import { credentialStore } from '$lib/stores/credentials.svelte.js';
  import { revocationStore } from '$lib/stores/revocation.svelte.js';
  import { REVOCATION_REASONS } from '$lib/models/credential.js';
  import { i18n } from '$lib/stores/i18n.svelte.js';

  const { t } = i18n;

  let selectedCredentialId = $state(null);
  let selectedReason = $state('');
  let showConfirm = $state(false);
  let showReinstateConfirm = $state(null); // credentialId or null

  let credentials = $derived(credentialStore.all);
  let revokedIds = $derived(revocationStore.all.map(e => e.credentialId));

  function proposeRevoke(credId) {
    selectedCredentialId = credId;
    selectedReason = '';
    showConfirm = true;
  }

  function confirmRevoke() {
    if (!selectedCredentialId || !selectedReason) return;
    const cred = credentialStore.getById(selectedCredentialId);
    revocationStore.revoke(selectedCredentialId, selectedReason, cred?.issuer || 'Authority');
    // Also update the credential in the store
    if (cred) {
      credentialStore.updateStatus(selectedCredentialId, 'revoked', selectedReason);
    }
    selectedCredentialId = null;
    selectedReason = '';
    showConfirm = false;
  }

  function cancelRevoke() {
    selectedCredentialId = null;
    selectedReason = '';
    showConfirm = false;
  }

  function proposeReinstate(credId) {
    showReinstateConfirm = credId;
  }

  function confirmReinstate() {
    if (showReinstateConfirm) {
      revocationStore.reinstate(showReinstateConfirm);
      credentialStore.updateStatus(showReinstateConfirm, 'active', null);
      showReinstateConfirm = null;
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  let stats = $derived({
    total: credentials.length,
    active: credentials.filter(c => c.status !== 'revoked').length,
    revoked: credentials.filter(c => c.status === 'revoked').length,
  });
</script>

<div class="page">
  <div class="page-header">
    <h1>{t('authority.title')}</h1>
    <p class="page-desc">{t('authority.desc')}</p>
  </div>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-card"><span class="stat-value">{stats.total}</span><span class="stat-label">{t('wallet.total')}</span></div>
    <div class="stat-card stat-active"><span class="stat-value">{stats.active}</span><span class="stat-label">{t('authority.active')}</span></div>
    <div class="stat-card stat-revoked"><span class="stat-value">{stats.revoked}</span><span class="stat-label">{t('authority.revoked')}</span></div>
  </div>

  {#if credentials.length === 0}
    <div class="empty-state">
      <div class="empty-icon">🏛️</div>
      <h3>{t('authority.empty.title')}</h3>
      <p>{t('authority.empty.desc')}</p>
    </div>
  {:else}
    <div class="credential-list">
      {#each credentials as cred (cred.id)}
        {@const rev = revocationStore.getRevocation(cred.id)}
        <div class="cred-row" class:is-revoked={cred.status === 'revoked'}>
          <div class="cred-info">
            <span class="cred-icon">{cred.icon}</span>
            <div class="cred-details">
              <span class="cred-label">{cred.label}</span>
              <span class="cred-issuer">{cred.issuer}</span>
              <span class="cred-date">{formatDate(cred.issuedAt)}</span>
              {#if cred.status === 'revoked'}
                <span class="revoked-badge">
                  {t('authority.revoked_badge')} — {rev?.reasonLabel || cred.revocationReason || ''}
                </span>
              {/if}
            </div>
          </div>
          <div class="cred-actions">
            {#if cred.status === 'revoked'}
              <button class="btn btn-reinstate" onclick={() => proposeReinstate(cred.id)}>
                {t('authority.reinstate_btn')}
              </button>
            {:else}
              <button class="btn btn-revoke" onclick={() => proposeRevoke(cred.id)}>
                {t('authority.revoke_btn')}
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Revoke Modal -->
{#if showConfirm}
  <div class="backdrop" onclick={cancelRevoke} role="presentation"></div>
  <div class="modal" role="dialog">
    <h2 class="modal-title">{t('authority.revoke_modal.title')}</h2>
    <p class="modal-desc">{t('authority.revoke_modal.desc')}</p>
    <div class="modal-body">
      <label class="reason-label">{t('authority.revoke_modal.reason')}</label>
      {#each REVOCATION_REASONS as reason}
        <label class="reason-option">
          <input type="radio" name="reason" value={reason.id} checked={selectedReason === reason.id} onchange={() => selectedReason = reason.id} />
          <span>{t('revocation.' + reason.id) || reason.label}</span>
        </label>
      {/each}
    </div>
    <div class="modal-footer">
      <button class="btn btn-cancel" onclick={cancelRevoke}>{t('history.cancel')}</button>
      <button class="btn btn-revoke-confirm" disabled={!selectedReason} onclick={confirmRevoke}>
        🔴 {t('authority.revoke_btn')}
      </button>
    </div>
  </div>
{/if}

<!-- Reinstate Modal -->
{#if showReinstateConfirm}
  <div class="backdrop" onclick={() => showReinstateConfirm = null} role="presentation"></div>
  <div class="modal" role="dialog">
    <h2 class="modal-title">{t('authority.reinstate_modal.title')}</h2>
    <p class="modal-desc">{t('authority.reinstate_modal.desc')}</p>
    <div class="modal-footer">
      <button class="btn btn-cancel" onclick={() => showReinstateConfirm = null}>{t('history.cancel')}</button>
      <button class="btn btn-reinstate-confirm" onclick={confirmReinstate}>
        ✅ {t('authority.reinstate_btn')}
      </button>
    </div>
  </div>
{/if}

<style>
  .page { padding: 1.5rem 1rem; }
  .page-header { text-align: center; margin-bottom: 1.5rem; }
  h1 { color: #1a237e; font-size: 1.3rem; margin-bottom: 0.3rem; }
  .page-desc { color: #666; font-size: 0.85rem; max-width: 400px; margin: 0 auto; }

  .stats-row { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
  .stat-card { flex: 1; background: white; border: 1px solid #e8e8e8; border-radius: 12px; padding: 0.75rem; text-align: center; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: #1a237e; }
  .stat-label { font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-active .stat-value { color: #2e7d32; }
  .stat-revoked .stat-value { color: #dc2626; }

  .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 3rem 1rem; background: white; border-radius: 16px; border: 1px dashed #ccc; }
  .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }
  .empty-state h3 { color: #1a237e; margin-bottom: 0.5rem; }
  .empty-state p { color: #888; font-size: 0.9rem; }

  .credential-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .cred-row { display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid #e8e8e8; border-radius: 12px; padding: 0.85rem 1rem; gap: 0.75rem; }
  .cred-row.is-revoked { background: #fef2f2; border-color: #fecaca; }
  .cred-info { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
  .cred-icon { font-size: 1.5rem; }
  .cred-details { display: flex; flex-direction: column; gap: 0.1rem; }
  .cred-label { font-weight: 600; color: #1a237e; font-size: 0.9rem; }
  .cred-issuer { font-size: 0.8rem; color: #666; }
  .cred-date { font-size: 0.75rem; color: #999; }
  .revoked-badge { font-size: 0.7rem; color: #dc2626; font-weight: 500; margin-top: 0.1rem; }
  .cred-actions { flex-shrink: 0; }

  .btn { padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.2s; }
  .btn:hover { opacity: 0.85; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-revoke { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .btn-revoke:hover { background: #fee2e2; }
  .btn-reinstate { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .btn-reinstate:hover { background: #dcfce7; }

  /* Modal */
  .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; }
  .modal { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-radius: 20px 20px 0 0; z-index: 201; padding: 1.5rem; max-height: 85vh; overflow-y: auto; animation: slideUp 0.3s ease; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-title { font-size: 1.1rem; color: #1a237e; margin-bottom: 0.5rem; }
  .modal-desc { font-size: 0.85rem; color: #666; margin-bottom: 1rem; }
  .modal-body { margin-bottom: 1.5rem; }
  .reason-label { display: block; font-size: 0.9rem; font-weight: 600; color: #333; margin-bottom: 0.75rem; }
  .reason-option { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid #f5f5f5; cursor: pointer; font-size: 0.9rem; color: #333; }
  .reason-option:last-child { border-bottom: none; }
  .reason-option input[type="radio"] { accent-color: #dc2626; }
  .modal-footer { display: flex; gap: 0.75rem; }
  .btn-cancel { flex: 1; background: #f0f0f0; color: #555; }
  .btn-revoke-confirm { flex: 1; background: #dc2626; color: white; }
  .btn-reinstate-confirm { flex: 1; background: #16a34a; color: white; }
</style>
