<script>
  import { ALL_TEMPLATES, createCredential } from '$lib/models/credential.js';
  import { credentialStore } from '$lib/stores/credentials.svelte.js';
  import IssuanceSuccess from './IssuanceSuccess.svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  const { t } = i18n;

  let selectedTemplateIndex = $state(0);
  let formValues = $state({});
  let isSubmitting = $state(false);
  let step = $state('select');

  let selectedTemplate = $derived(ALL_TEMPLATES[selectedTemplateIndex]);

  $effect(() => {
    if (step === 'fill') {
      const initial = {};
      for (const attr of selectedTemplate.attributes) { initial[attr.id] = ''; }
      formValues = initial;
    }
  });

  function selectTemplate(index) { selectedTemplateIndex = index; step = 'fill'; }
  function handleInput(attrId, value) { formValues = { ...formValues, [attrId]: value }; }
  function resetForm() { step = 'select'; formValues = {}; }

  function handleSubmit(e) {
    e.preventDefault();
    isSubmitting = true;
    const filled = {};
    for (const [key, value] of Object.entries(formValues)) {
      if (value !== '' && value !== false) filled[key] = value;
    }
    for (const attr of selectedTemplate.attributes) {
      if (attr.type === 'boolean') filled[attr.id] = formValues[attr.id] === 'true' || formValues[attr.id] === true;
    }
    const credential = createCredential(selectedTemplate, filled);
    credentialStore.add(credential);
    isSubmitting = false;
    step = 'success';
  }

  function isFormValid() {
    for (const attr of selectedTemplate.attributes) {
      if (attr.required) {
        const val = formValues[attr.id];
        if (attr.type === 'boolean') { if (val === '' || val === undefined) return false; }
        else if (!val || val.trim() === '') return false;
      }
    }
    return true;
  }
</script>

<div class="issuance-form">
  {#if step === 'select'}
    <p class="section-desc">{t('issuance.select')}</p>
    <div class="template-grid">
      {#each ALL_TEMPLATES as template, i}
        <button class="template-card" onclick={() => selectTemplate(i)}>
          <span class="template-icon">{template.icon}</span>
          <span class="template-name">{template.label}</span>
          <span class="template-desc">{template.description}</span>
          <span class="template-issuer">{template.issuerLabel}</span>
        </button>
      {/each}
    </div>
  {:else if step === 'fill'}
    <div class="form-header">
      <button class="back-btn" onclick={resetForm}>{t('issuance.back')}</button>
      <div><span class="form-icon">{selectedTemplate.icon}</span><span class="form-title">{selectedTemplate.label}</span></div>
      <span class="form-issuer">{selectedTemplate.issuerLabel}</span>
    </div>
    <form onsubmit={handleSubmit}>
      {#each selectedTemplate.attributes as attr}
        <div class="form-group">
          <label for={attr.id}>{attr.label}</label>
          {#if attr.type === 'boolean'}
            <select id={attr.id} value={formValues[attr.id] ?? ''} onchange={(e) => handleInput(attr.id, e.target.value)} class="form-input">
              <option value="">{t('issuance.select_placeholder')}</option>
              <option value="true">{t('issuance.select_yes')}</option>
              <option value="false">{t('issuance.select_no')}</option>
            </select>
          {:else if attr.type === 'select'}
            <select id={attr.id} value={formValues[attr.id] ?? ''} onchange={(e) => handleInput(attr.id, e.target.value)} class="form-input">
              {#each attr.options || [] as opt}<option value={opt}>{opt || t('issuance.select_placeholder')}</option>{/each}
            </select>
          {:else if attr.type === 'date'}
            <input id={attr.id} type="date" value={formValues[attr.id] ?? ''} oninput={(e) => handleInput(attr.id, e.target.value)} class="form-input" />
          {:else}
            <input id={attr.id} type="text" placeholder={attr.placeholder || ''} value={formValues[attr.id] ?? ''} oninput={(e) => handleInput(attr.id, e.target.value)} class="form-input" />
          {/if}
        </div>
      {/each}
      <button type="submit" class="submit-btn" disabled={!isFormValid() || isSubmitting}>{isSubmitting ? t('issuance.submitting') : t('issuance.submit')}</button>
    </form>
  {:else if step === 'success'}
    <IssuanceSuccess {selectedTemplate} onReset={resetForm} />
  {/if}
</div>

<style>
  .issuance-form { max-width: 480px; margin: 0 auto; }
  .section-desc { color: #666; margin-bottom: 1rem; text-align: center; }
  .template-grid { display: flex; flex-direction: column; gap: 0.75rem; }
  .template-card { display: flex; flex-direction: column; gap: 0.2rem; background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1rem 1.2rem; cursor: pointer; text-align: left; transition: all 0.2s; }
  .template-card:hover { border-color: #1a237e; box-shadow: 0 2px 12px rgba(26,35,126,0.1); transform: translateY(-1px); }
  .template-icon { font-size: 1.5rem; }
  .template-name { font-size: 1rem; font-weight: 600; color: #1a237e; }
  .template-desc { font-size: 0.85rem; color: #666; }
  .template-issuer { font-size: 0.75rem; color: #999; font-style: italic; }
  .form-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .back-btn { background: none; border: none; color: #1a237e; cursor: pointer; font-size: 0.9rem; padding: 0.25rem 0; }
  .back-btn:hover { text-decoration: underline; }
  .form-icon { font-size: 1.3rem; }
  .form-title { font-weight: 600; color: #1a237e; }
  .form-issuer { font-size: 0.75rem; color: #999; margin-left: auto; }
  .form-group { margin-bottom: 1rem; }
  .form-group label { display: block; font-size: 0.85rem; font-weight: 500; color: #333; margin-bottom: 0.3rem; }
  .form-input { width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #ccc; border-radius: 8px; font-size: 0.95rem; font-family: inherit; transition: border-color 0.2s; background: white; }
  .form-input:focus { outline: none; border-color: #1a237e; box-shadow: 0 0 0 3px rgba(26,35,126,0.1); }
  .submit-btn { width: 100%; padding: 0.8rem; background: linear-gradient(135deg, #1a237e, #283593); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; margin-top: 0.5rem; }
  .submit-btn:hover:not(:disabled) { opacity: 0.9; }
  .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>