<script>
  import { credentialStore } from '$lib/stores/credentials.svelte.js';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  const { t } = i18n;
  let { credential, onDetail } = $props();

  function formatDate(iso) { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function handleDelete(e) { e.stopPropagation(); if (confirm(t('wallet.delete_confirm', { label: credential.label }))) credentialStore.remove(credential.id); }

  let previewAttrs = $derived(Object.entries(credential.attributes).slice(0, 3));
  let isPID = $derived(credential.type === 'PID');
</script>

<button class="credential-card" onclick={() => onDetail?.(credential)}>
  <div class="card-header">
    <span class="card-icon">{credential.icon}</span>
    <span class="card-badge" class:badge-pid={isPID} class:badge-qeaa={!isPID}>{credential.type}</span>
  </div>
  <div class="card-body">
    <h3 class="card-title">{credential.label}</h3>
    <p class="card-issuer">{credential.issuer}</p>
    <p class="card-date">{formatDate(credential.issuedAt)}</p>
    {#if previewAttrs.length > 0}
      <div class="card-preview">
        {#each previewAttrs as [key, value]}
          <span class="preview-item"><span class="preview-key">{key}:</span> <span class="preview-value">{String(value)}</span></span>
        {/each}
        {#if Object.keys(credential.attributes).length > 3}
          <span class="preview-more">+{Object.keys(credential.attributes).length - 3} more</span>
        {/if}
      </div>
    {/if}
  </div>
  <span class="delete-btn" onclick={handleDelete} role="button" tabindex="0" title="Remove credential" onkeydown={(e) => e.key === 'Enter' && handleDelete(e)}>🗑️</span>
</button>

<style>
  .credential-card { display: flex; flex-direction: column; gap: 0.5rem; background: white; border: 1px solid #e8e8e8; border-radius: 14px; padding: 1rem; cursor: pointer; text-align: left; transition: all 0.2s; position: relative; width: 100%; font-family: inherit; }
  .credential-card:hover { border-color: #1a237e; box-shadow: 0 4px 16px rgba(26,35,126,0.1); transform: translateY(-2px); }
  .card-header { display: flex; align-items: center; justify-content: space-between; }
  .card-icon { font-size: 1.6rem; }
  .card-badge { font-size: 0.65rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.04em; }
  .badge-pid { background: #e3f2fd; color: #1565c0; }
  .badge-qeaa { background: #e8f5e9; color: #2e7d32; }
  .card-body { display: flex; flex-direction: column; gap: 0.15rem; }
  .card-title { font-size: 0.95rem; font-weight: 600; color: #1a237e; margin: 0; }
  .card-issuer { font-size: 0.8rem; color: #666; font-style: italic; }
  .card-date { font-size: 0.75rem; color: #999; }
  .card-preview { display: flex; flex-wrap: wrap; gap: 0.3rem 0.6rem; margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid #f0f0f0; }
  .preview-item { font-size: 0.75rem; }
  .preview-key { color: #888; }
  .preview-value { color: #333; font-weight: 500; }
  .preview-more { font-size: 0.7rem; color: #999; font-style: italic; }
  .delete-btn { position: absolute; top: 0.5rem; right: 0.5rem; background: none; border: none; font-size: 0.9rem; cursor: pointer; opacity: 0; transition: opacity 0.2s; padding: 0.25rem; border-radius: 6px; }
  .credential-card:hover .delete-btn { opacity: 0.6; }
  .delete-btn:hover { opacity: 1 !important; background: #fef2f2; }
</style>