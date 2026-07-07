<script>
  import { credentialStore } from '$lib/stores/credentials.svelte.js';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  const { t } = i18n;
  let { onPresent } = $props();

  let selectedCredentialId = $state(null);
  let selectedAttributes = $state({});
  let credentials = $derived(credentialStore.all);
  let selectedCredential = $derived(credentials.find(c => c.id === selectedCredentialId) || null);

  $effect(() => {
    if (selectedCredential) {
      const attrs = {};
      for (const key of Object.keys(selectedCredential.attributes)) attrs[key] = false;
      selectedAttributes = attrs;
    } else { selectedAttributes = {}; }
  });

  function toggleAttribute(key) { selectedAttributes = { ...selectedAttributes, [key]: !selectedAttributes[key] }; }
  function selectAll() { const a = {}; for (const k of Object.keys(selectedAttributes)) a[k] = true; selectedAttributes = a; }
  function deselectAll() { const a = {}; for (const k of Object.keys(selectedAttributes)) a[k] = false; selectedAttributes = a; }
  let hasSelection = $derived(Object.values(selectedAttributes).some(v => v === true));

  function handlePresent() {
    if (!selectedCredential || !hasSelection) return;
    const sharedValues = {};
    for (const [key, selected] of Object.entries(selectedAttributes)) {
      if (selected) sharedValues[key] = selectedCredential.attributes[key];
    }
    onPresent?.({ credential: selectedCredential, sharedAttributes: Object.keys(sharedValues), sharedValues });
  }
</script>

<div class="attribute-selector">
  {#if credentials.length === 0}
    <div class="empty-state"><div class="empty-icon">📲</div><h3>{t('present.empty.title')}</h3><p>{t('present.empty.desc')}</p></div>
  {:else if !selectedCredential}
    <p class="section-desc">{t('present.select_credential')}</p>
    <div class="credential-list">
      {#each credentials as cred (cred.id)}
        <button class="credential-option" onclick={() => selectedCredentialId = cred.id}>
          <span class="option-icon">{cred.icon}</span>
          <div class="option-info"><span class="option-title">{cred.label}</span><span class="option-issuer">{cred.issuer}</span></div>
          <span class="option-arrow">→</span>
        </button>
      {/each}
    </div>
  {:else}
    <div class="selection-header">
      <button class="back-btn" onclick={() => selectedCredentialId = null}>{t('issuance.back')}</button>
      <div class="selection-info"><span class="sel-icon">{selectedCredential.icon}</span><span class="sel-title">{selectedCredential.label}</span></div>
    </div>
    <div class="selection-actions"><button class="action-btn" onclick={selectAll}>{t('present.select_all')}</button><button class="action-btn" onclick={deselectAll}>{t('present.deselect_all')}</button></div>
    <p class="section-desc">{t('present.select_attrs')}</p>
    <div class="attributes-list">
      {#each Object.entries(selectedCredential.attributes) as [key, value]}
        <label class="attribute-item">
          <input type="checkbox" checked={selectedAttributes[key]} onchange={() => toggleAttribute(key)} />
          <div class="attr-info"><span class="attr-key">{key}</span><span class="attr-value">{String(value)}</span></div>
        </label>
      {/each}
    </div>
    <div class="present-section">
      <div class="selection-summary">{#if hasSelection}<span>✅ {t('present.selected', { count: Object.values(selectedAttributes).filter(v => v).length })}</span>{:else}<span>{t('present.select_hint')}</span>{/if}</div>
      <button class="present-btn" disabled={!hasSelection} onclick={handlePresent}>{t('present.generate')}</button>
    </div>
  {/if}
</div>

<style>
  .attribute-selector { max-width: 480px; margin: 0 auto; }
  .section-desc { color: #666; font-size: 0.9rem; margin-bottom: 0.75rem; text-align: center; }
  .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 3rem 1rem; background: white; border-radius: 16px; border: 1px dashed #ccc; }
  .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }
  .empty-state h3 { color: #1a237e; margin-bottom: 0.5rem; }
  .empty-state p { color: #888; font-size: 0.9rem; }
  .credential-list { display: flex; flex-direction: column; gap: 0.6rem; }
  .credential-option { display: flex; align-items: center; gap: 0.75rem; background: white; border: 1px solid #e8e8e8; border-radius: 12px; padding: 0.85rem 1rem; cursor: pointer; text-align: left; transition: all 0.2s; width: 100%; font-family: inherit; }
  .credential-option:hover { border-color: #1a237e; box-shadow: 0 2px 12px rgba(26,35,126,0.1); }
  .option-icon { font-size: 1.5rem; }
  .option-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
  .option-title { font-weight: 600; color: #1a237e; font-size: 0.95rem; }
  .option-issuer { font-size: 0.8rem; color: #888; }
  .option-arrow { color: #ccc; font-size: 1.1rem; }
  .selection-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
  .back-btn { background: none; border: none; color: #1a237e; cursor: pointer; font-size: 0.9rem; padding: 0.25rem 0; }
  .back-btn:hover { text-decoration: underline; }
  .selection-info { display: flex; align-items: center; gap: 0.5rem; }
  .sel-icon { font-size: 1.3rem; }
  .sel-title { font-weight: 600; color: #1a237e; }
  .selection-actions { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
  .action-btn { flex: 1; padding: 0.4rem; background: #f0f0f0; border: none; border-radius: 8px; font-size: 0.8rem; cursor: pointer; color: #555; transition: background 0.2s; }
  .action-btn:hover { background: #e0e0e0; }
  .attributes-list { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
  .attribute-item { display: flex; align-items: center; gap: 0.75rem; background: white; border: 1px solid #eee; border-radius: 10px; padding: 0.65rem 0.85rem; cursor: pointer; transition: border-color 0.2s; }
  .attribute-item:hover { border-color: #1a237e; }
  .attribute-item input[type="checkbox"] { width: 18px; height: 18px; accent-color: #1a237e; cursor: pointer; }
  .attr-info { display: flex; flex-direction: column; gap: 0.1rem; flex: 1; }
  .attr-key { font-size: 0.85rem; font-weight: 500; color: #333; font-family: monospace; }
  .attr-value { font-size: 0.8rem; color: #888; }
  .present-section { margin-top: 0.5rem; }
  .selection-summary { text-align: center; font-size: 0.85rem; color: #666; margin-bottom: 0.75rem; }
  .present-btn { width: 100%; padding: 0.8rem; background: linear-gradient(135deg, #1a237e, #283593); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
  .present-btn:hover:not(:disabled) { opacity: 0.9; }
  .present-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>