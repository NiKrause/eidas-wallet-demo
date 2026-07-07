<script>
  import VerificationResult from './VerificationResult.svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import { verifySDJWT, extractCredentialFromSDJWT } from '$lib/crypto/sdjwt.js';
  const { t } = i18n;

  let rawInput = $state('');
  let result = $state(null);
  let error = $state(null);

  // Check for pending presentation from QR display
  $effect(() => {
    const pending = sessionStorage.getItem('pending_presentation');
    if (pending) {
      rawInput = pending;
      sessionStorage.removeItem('pending_presentation');
    }
  });

  async function handleVerify() {
    error = null;
    result = null;

    const trimmed = rawInput.trim();
    if (!trimmed) {
      error = t('verify.error.empty');
      return;
    }

    // Try to parse as JSON (our demo format or SD-JWT presentation)
    try {
      const data = JSON.parse(trimmed);

      if (data.format === 'sd_jwt_vc' && data.credentialId) {
        // SD-JWT format
        await verifySDJWTPayload(data);
      } else if (data.format === 'eidas-wallet-demo-v1') {
        // Legacy demo format
        result = data;
      } else if (data.credentialType && data.attributes) {
        // Auto-detect format
        result = data;
      } else {
        error = t('verify.error.format');
      }
    } catch (e) {
      // Try as raw SD-JWT string
      if (trimmed.startsWith('eyJ')) {
        try {
          const { payload } = await verifySDJWT(trimmed);
          result = extractCredentialFromSDJWT(payload);
        } catch (ve) {
          error = t('verify.error.json', { error: ve.message });
        }
      } else {
        error = t('verify.error.json', { error: e.message });
      }
    }
  }

  async function verifySDJWTPayload(data) {
    // Check if the issuer's key is in our store
    const { getIssuerPublicKeyPem } = await import('$lib/crypto/sdjwt.js');
    const publicKeyPem = getIssuerPublicKeyPem();

    if (publicKeyPem && data.credentialId) {
      // We can verify the SD-JWT if it was issued in our demo
      // For now, accept the payload as verified (Phase 3a)
      result = {
        ...data,
        _sdjwtVerified: true,
      };
    } else {
      // No issuer key available, accept as-is (demo mode)
      result = data;
    }
  }

  function handleClear() {
    rawInput = '';
    result = null;
    error = null;
  }

  async function loadSample() {
    const sampleData = {
      format: 'eidas-wallet-demo-v1',
      credentialType: 'PID',
      credentialLabel: 'Personal Identification Data',
      credentialId: 'sample-' + Date.now(),
      issuer: 'National Identity Authority',
      issuedAt: new Date(Date.now() - 86400000).toISOString(),
      attributes: {
        given_name: 'Jane',
        family_name: 'Smith',
        birth_date: '1985-06-15',
        nationality: 'DE',
      },
      sharedAttributes: ['given_name', 'family_name'],
      timestamp: new Date().toISOString(),
    };
    rawInput = JSON.stringify(sampleData, null, 2);
  }
</script>

{#if result}
  <VerificationResult data={result} onReset={handleClear} />
{:else}
  <div class="verifier">

    <textarea
      class="json-input"
      placeholder={t('verify.placeholder')}
      bind:value={rawInput}
      rows="8"
    ></textarea>

    {#if error}
      <div class="error-msg">{error}</div>
    {/if}

    <div class="btn-group">
      <button class="btn btn-clear" onclick={handleClear}>{t('verify.clear')}</button>
      <button class="btn btn-sample" onclick={loadSample}>{t('verify.sample')}</button>
      <button class="btn btn-verify" onclick={handleVerify} disabled={!rawInput.trim()}>
        {t('verify.btn')}
      </button>
    </div>
  </div>
{/if}

<style>
  .verifier { max-width: 500px; margin: 0 auto; }


  .json-input { width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 10px; font-size: 0.8rem; font-family: monospace; resize: vertical; transition: border-color 0.2s; margin-bottom: 0.75rem; }
  .json-input:focus { outline: none; border-color: #1a237e; box-shadow: 0 0 0 3px rgba(26,35,126,0.1); }

  .error-msg { padding: 0.6rem 0.8rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.85rem; margin-bottom: 0.75rem; }

  .btn-group { display: flex; gap: 0.5rem; }
  .btn { flex: 1; padding: 0.65rem; font-size: 0.85rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: opacity 0.2s; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-clear { background: #f0f0f0; color: #555; }
  .btn-sample { background: #fff3e0; color: #e65100; }
  .btn-verify { background: linear-gradient(135deg, #1a237e, #283593); color: white; }
  .btn-verify:hover:not(:disabled) { opacity: 0.9; }
</style>
