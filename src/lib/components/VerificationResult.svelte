<script>
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import { revocationStore } from '$lib/stores/revocation.svelte.js';
  let { data, onReset } = $props();
  const { t } = i18n;

  let formatDate = (iso) => iso ? new Date(iso).toLocaleString('en-GB') : '—';
  let attributeEntries = $derived(Object.entries(data.attributes || {}));
  let sharedCount = $derived(data.sharedAttributes?.length || 0);
  let totalCount = $derived(Object.keys(data.attributes || {}).length);

  // Check if the credential was revoked using the credential ID from the QR payload
  let revocation = $derived.by(() => {
    if (!data.credentialId) return null;
    return revocationStore.getRevocation(data.credentialId);
  });
  let isRevoked = $derived(!!revocation);
</script>

<div class="result">
  <div class="result-header" class:result-success={!isRevoked} class:result-revoked={isRevoked}>
    <div class="result-icon">{isRevoked ? '🔴' : '✅'}</div>
    <h2 class="result-title">{isRevoked ? t('verify.result.revoked') : t('verify.success.title')}</h2>
    <p class="result-subtitle">{isRevoked ? t('verify.result.revoked_subtitle') : t('verify.success.subtitle')}</p>
  </div>

  {#if isRevoked && revocation}
    <div class="revoked-card">
      <div class="revoked-header">
        <span class="revoked-icon">🔴</span>
        <span class="revoked-title">{t('verify.result.revoked')}</span>
      </div>
      <div class="result-row"><span class="result-label">{t('verify.result.revoked_reason')}</span><span class="result-value status-revoked">{revocation.reasonLabel}</span></div>
      <div class="result-row"><span class="result-label">{t('verify.result.revoked_at')}</span><span class="result-value status-revoked">{formatDate(revocation.revokedAt)}</span></div>
      <div class="result-row"><span class="result-label">{t('verify.result.revoked_by')}</span><span class="result-value">{revocation.authority}</span></div>
    </div>
  {/if}

  <div class="result-card">
    <div class="result-row"><span class="result-label">{t('verify.result.credential')}</span><span class="result-value">{data.credentialLabel || '—'}</span></div>
    <div class="result-row"><span class="result-label">{t('verify.result.type')}</span><span class="result-value badge">{data.credentialType || '—'}</span></div>
    <div class="result-row"><span class="result-label">{t('verify.result.issuer')}</span><span class="result-value">{data.issuer || '—'}</span></div>
    <div class="result-row"><span class="result-label">{t('verify.result.issued')}</span><span class="result-value">{formatDate(data.issuedAt)}</span></div>
    <div class="result-row"><span class="result-label">{t('verify.result.presented')}</span><span class="result-value">{formatDate(data.timestamp)}</span></div>
    <div class="result-row"><span class="result-label">{t('verify.result.attributes')}</span><span class="result-value">{t('verify.result.shared', { count: sharedCount, total: totalCount })}</span></div>
  </div>

  <div class="attributes-section">
    <h3 class="attributes-title">{t('verify.result.received')}</h3>
    <div class="attributes-list">
      {#each attributeEntries as [key, value]}
        <div class="attr-row" class:shared={data.sharedAttributes?.includes(key)}>
          <div class="attr-info"><span class="attr-key">{key}</span><span class="attr-value">{String(value)}</span></div>
          {#if data.sharedAttributes?.includes(key)}<span class="shared-badge">✓</span>{/if}
        </div>
      {/each}
    </div>
  </div>

  <button class="reset-btn" onclick={onReset}>← {t('verify.another')}</button>
</div>

<style>
  .result { max-width: 480px; margin: 0 auto; }
  .result-header { text-align: center; padding: 2rem 1rem; border-radius: 16px; margin-bottom: 1rem; }
  .result-success { background: linear-gradient(135deg, #e8f5e9, #c8e6c9); }
  .result-revoked { background: linear-gradient(135deg, #fef2f2, #fecaca); }
  .result-icon { font-size: 3rem; margin-bottom: 0.5rem; }
  .result-title { font-size: 1.3rem; margin-bottom: 0.25rem; }
  .result-success .result-title { color: #2e7d32; }
  .result-revoked .result-title { color: #dc2626; }
  .result-subtitle { font-size: 0.9rem; }
  .result-success .result-subtitle { color: #558b2f; }
  .result-revoked .result-subtitle { color: #b91c1c; }
  .result-card { background: white; border: 1px solid #e8e8e8; border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1rem; }
  .result-row { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid #f5f5f5; }
  .result-row:last-child { border-bottom: none; }
  .result-label { font-size: 0.85rem; color: #888; }
  .result-value { font-size: 0.85rem; color: #333; font-weight: 500; text-align: right; }
  .result-value.badge { background: #e3f2fd; color: #1565c0; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.75rem; text-transform: uppercase; }
  .status-revoked { color: #dc2626; font-weight: 600; }
  .revoked-card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1rem; }
  .revoked-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
  .revoked-icon { font-size: 1.5rem; }
  .revoked-title { font-size: 1rem; font-weight: 700; color: #dc2626; }
  .attributes-section { margin-bottom: 1.5rem; }
  .attributes-title { color: #1a237e; font-size: 0.9rem; margin-bottom: 0.5rem; }
  .attributes-list { display: flex; flex-direction: column; gap: 0.3rem; }
  .attr-row { display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid #eee; border-radius: 8px; padding: 0.5rem 0.75rem; }
  .attr-row.shared { border-color: #c8e6c9; background: #f1f8e9; }
  .attr-info { display: flex; flex-direction: column; gap: 0.05rem; }
  .attr-key { font-size: 0.8rem; color: #888; font-family: monospace; }
  .attr-value { font-size: 0.85rem; color: #333; font-weight: 500; }
  .shared-badge { color: #2e7d32; font-weight: 700; font-size: 1rem; }
  .reset-btn { width: 100%; padding: 0.75rem; background: #f0f0f0; border: none; border-radius: 10px; font-size: 0.95rem; cursor: pointer; color: #555; font-weight: 500; }
  .reset-btn:hover { background: #e0e0e0; }
</style>
