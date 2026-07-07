<script>
  import { ALL_TEMPLATES, createCredential } from '$lib/models/credential.js';
  import { credentialStore } from '$lib/stores/credentials.svelte.js';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import IssuanceSuccess from './IssuanceSuccess.svelte';
  import { issueSDJWT } from '$lib/crypto/sdjwt.js';
  import { isCryptoAvailable } from '$lib/crypto/crypto-browser.js';

  let { onNavigate } = $props();
  const { t } = i18n;

  let step = $state('select');
  let selectedTemplate = $state(null);
  let formValues = $state({});
  let submitting = $state(false);
  let issuedCredential = $state(null);
  let cryptoReady = $state(isCryptoAvailable());

  let issuerName = $derived(selectedTemplate?.issuerLabel || '');

  function selectTemplate(template) {
    selectedTemplate = template;
    const values = {};
    for (const attr of template.attributes) {
      values[attr.id] = attr.type === 'boolean' ? '' : '';
    }
    formValues = values;
    step = 'fill';
  }

  function goBack() {
    step = 'select';
    selectedTemplate = null;
    formValues = {};
  }

  async function handleSubmit() {
    if (!selectedTemplate) return;
    submitting = true;

    const values = {};
    for (const [key, val] of Object.entries(formValues)) {
      values[key] = val;
    }

    const credential = createCredential(selectedTemplate, values);

    // Attempt to sign as SD-JWT
    let sdjwt = null;
    if (cryptoReady) {
      try {
        sdjwt = await issueSDJWT(credential, {
          selectivelyDisclosable: Object.keys(values),
        });
        credential.sdjwt = sdjwt;
      } catch (e) {
        console.warn('SD-JWT signing failed, using unsigned credential:', e);
      }
    }

    credentialStore.add(credential);
    issuedCredential = credential;
    submitting = false;
    step = 'success';
  }

  function handleSuccessView() {
    onNavigate?.('/wallet');
  }

  function handleSuccessAgain() {
    step = 'select';
    selectedTemplate = null;
    formValues = {};
    issuedCredential = null;
  }

  function validate(values) {
    if (!selectedTemplate) return false;
    for (const attr of selectedTemplate.attributes) {
      if (attr.required) {
        const val = values[attr.id];
        if (!val || val === '' || val === '-- Select --') return false;
      }
    }
    return true;
  }
</script>

{#if step === 'select'}
  <div class="issuance-form">
    <p class="section-desc">{t('issuance.select')}</p>
    {#if !cryptoReady}
      <div class="crypto-notice">⚠️ WebCrypto nicht verfügbar – Credentials werden ohne Signatur ausgestellt</div>
    {/if}
    <div class="template-grid">
      {#each ALL_TEMPLATES as template}
        <button class="template-card" onclick={() => selectTemplate(template)}>
          <span class="template-icon">{template.icon}</span>
          <div class="template-info">
            <strong class="template-label">{template.label}</strong>
            <span class="template-desc">{template.description}</span>
            <span class="template-issuer">{template.issuerLabel}</span>
          </div>
        </button>
      {/each}
    </div>
  </div>
{:else if step === 'fill'}
  <div class="issuance-form">
    <div class="form-header">
      <span class="form-icon">{selectedTemplate.icon}</span>
      <div>
        <h2 class="form-title">{selectedTemplate.label}</h2>
        <p class="form-issuer">{selectedTemplate.issuerLabel}</p>
      </div>
    </div>

    {#each selectedTemplate.attributes as attr}
      <div class="field">
        <label class="field-label" for={attr.id}>
          {attr.label}
          {#if attr.required}<span class="required">*</span>{/if}
        </label>
        {#if attr.type === 'text'}
          <input id={attr.id} type="text" class="field-input" placeholder={attr.placeholder || ''}
            value={formValues[attr.id]} oninput={(e) => formValues[attr.id] = e.target.value} />
        {:else if attr.type === 'date'}
          <input id={attr.id} type="date" class="field-input"
            value={formValues[attr.id]} oninput={(e) => formValues[attr.id] = e.target.value} />
        {:else if attr.type === 'boolean'}
          <select id={attr.id} class="field-input"
            value={formValues[attr.id]} onchange={(e) => formValues[attr.id] = e.target.value}>
            <option value="">{t('issuance.select_placeholder')}</option>
            <option value="true">{t('issuance.select_yes')}</option>
            <option value="false">{t('issuance.select_no')}</option>
          </select>
        {:else if attr.type === 'select'}
          <select id={attr.id} class="field-input"
            value={formValues[attr.id]} onchange={(e) => formValues[attr.id] = e.target.value}>
            {#each (attr.options || ['']) as opt}
              <option value={opt}>{opt || t('issuance.select_placeholder')}</option>
            {/each}
          </select>
        {/if}
      </div>
    {/each}

    <div class="form-actions">
      <button class="btn btn-back" onclick={goBack}>{t('issuance.back')}</button>
      <button class="btn btn-submit" onclick={handleSubmit} disabled={!validate(formValues) || submitting}>
        {submitting ? t('issuance.submitting') : t('issuance.submit')}
      </button>
    </div>
  </div>
{:else if step === 'success'}
  <IssuanceSuccess sdjwt={issuedCredential.sdjwt} credential={issuedCredential} onViewWallet={handleSuccessView} onIssueAnother={handleSuccessAgain} />
{/if}

<style>
  .issuance-form { max-width: 480px; margin: 0 auto; }
  .section-desc { color: #666; font-size: 0.9rem; margin-bottom: 0.75rem; text-align: center; }
  .crypto-notice { background: #fff3e0; border: 1px solid #ffe0b2; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.8rem; color: #e65100; margin-bottom: 1rem; text-align: center; }

  .template-grid { display: flex; flex-direction: column; gap: 0.75rem; }
  .template-card { display: flex; align-items: center; gap: 0.85rem; background: white; border: 1px solid #e8e8e8; border-radius: 14px; padding: 1rem; cursor: pointer; text-align: left; transition: all 0.2s; width: 100%; }
  .template-card:hover { border-color: #1a237e; box-shadow: 0 4px 16px rgba(26,35,126,0.1); transform: translateY(-2px); }
  .template-icon { font-size: 2rem; flex-shrink: 0; }
  .template-info { display: flex; flex-direction: column; gap: 0.2rem; }
  .template-label { font-size: 1rem; color: #1a237e; }
  .template-desc { font-size: 0.8rem; color: #666; }
  .template-issuer { font-size: 0.75rem; color: #999; font-style: italic; }

  .form-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
  .form-icon { font-size: 2rem; }
  .form-title { font-size: 1.1rem; color: #1a237e; margin: 0; }
  .form-issuer { font-size: 0.85rem; color: #888; }

  .field { margin-bottom: 1rem; }
  .field-label { display: block; font-size: 0.9rem; color: #333; margin-bottom: 0.35rem; font-weight: 500; }
  .required { color: #dc2626; margin-left: 0.15rem; }
  .field-input { width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #ddd; border-radius: 10px; font-size: 0.95rem; transition: border-color 0.2s; background: white; font-family: inherit; }
  .field-input:focus { outline: none; border-color: #1a237e; box-shadow: 0 0 0 3px rgba(26,35,126,0.1); }
  select.field-input { appearance: auto; }

  .form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
  .btn { flex: 1; padding: 0.75rem; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.2s; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-back { background: #f0f0f0; color: #555; }
  .btn-submit { background: linear-gradient(135deg, #1a237e, #283593); color: white; }
  .btn-submit:hover:not(:disabled) { opacity: 0.9; }
</style>
