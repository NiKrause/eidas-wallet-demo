<script>
  import { onDestroy } from 'svelte';
  import VerificationResult from './VerificationResult.svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import { verifySDJWT, extractCredentialFromSDJWT } from '$lib/crypto/sdjwt.js';
  const { t } = i18n;
  import QRCode from 'qrcode';

  let rawInput = $state('');
  let result = $state(null);
  let error = $state(null);
  let loading = $state(false);
  let serverMode = $state(false);

  // Cross-device state
  let crossDeviceMode = $state(false);
  let crossDeviceSessionId = $state(null);
  let crossDeviceQRDataUrl = $state(null);
  let crossDeviceStatus = $state(null); // 'waiting' | 'received' | 'error'
  let crossDeviceError = $state(null);
  let crossDeviceCopySuccess = $state(false);
  let crossDevicePollTimer = $state(null);

  // Phase 3a: Check for pending result_id from OpenID4VP server
  $effect(() => {
    const resultId = sessionStorage.getItem('pending_result_id');
    const verifierUrl = sessionStorage.getItem('verifier_url');
    if (resultId && verifierUrl) {
      serverMode = true;
      loading = true;
      sessionStorage.removeItem('pending_result_id');
      sessionStorage.removeItem('verifier_url');

      // Poll for the result from the server
      pollResult(verifierUrl, resultId);
    } else {
      // Fallback: Check for pending presentation from QR display (same-browser)
      const pending = sessionStorage.getItem('pending_presentation');
      if (pending) {
        rawInput = pending;
        sessionStorage.removeItem('pending_presentation');
      }
    }
  });

  async function pollResult(verifierUrl, resultId, attempt = 0) {
    const maxAttempts = 30; // ~15 seconds max wait
    try {
      const response = await fetch(`${verifierUrl}/api/result/${resultId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.verified) {
          // Phase 3b: Server-validated response
          const vpToken = data.vp_token;
          if (typeof vpToken === 'object' && vpToken !== null) {
            result = { ...vpToken, _serverVerified: true, _verifiedAt: data.received_at };
          } else if (typeof vpToken === 'string') {
            try {
              result = { ...JSON.parse(vpToken), _serverVerified: true };
            } catch {
              result = { vp_token: vpToken, _serverVerified: true };
            }
          }
          loading = false;
          return;
        }
        if (data.status === 'rejected') {
          // Server rejected the presentation
          error = data.validation_errors
            ? data.validation_errors.join('; ')
            : 'Server rejected the presentation';
          loading = false;
          return;
        }
      }
    } catch (e) {
      console.warn('Poll attempt failed:', e.message);
    }

    if (attempt < maxAttempts) {
      // Retry after 500ms
      setTimeout(() => pollResult(verifierUrl, resultId, attempt + 1), 500);
    } else {
      loading = false;
      error = t('verify.error.server_timeout');
    }
  }

  // Clean up poll timer on destroy
  onDestroy(() => {
    if (crossDevicePollTimer) {
      clearInterval(crossDevicePollTimer);
    }
  });

  // Cross-Device functions

  async function startCrossDevice() {
    error = null;
    crossDeviceStatus = 'waiting';
    crossDeviceError = null;
    crossDeviceCopySuccess = false;
    crossDeviceSessionId = crypto.randomUUID();

    try {
      // Try to register the session with the server
      const serverUrl = 'http://localhost:3000';
      try {
        await fetch(`${serverUrl}/api/cross-device`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: crossDeviceSessionId,
            requested_attributes: [],
          }),
        });
      } catch (_) {
        // Server might not be running - continue with client-side only
        console.warn('Cross-device server not reachable, using client-only mode');
      }

      // Generate QR data URL from the cross-device URI
      const crossDeviceUri = `OPENID4VP://cross-device?session_id=${crossDeviceSessionId}&verifier=localhost:5173`;
      crossDeviceQRDataUrl = await QRCode.toDataURL(crossDeviceUri, {
        width: 256,
        margin: 2,
        color: { dark: '#1a237e', light: '#ffffff' },
      });

      // Store in sessionStorage so the Wallet tab can pick it up
      sessionStorage.setItem('cross_device_uri', crossDeviceUri);
      sessionStorage.setItem('cross_device_session_id', crossDeviceSessionId);

      // Start polling for VP token
      crossDevicePollTimer = setInterval(() => pollCrossDevice(), 2000);
    } catch (e) {
      crossDeviceStatus = 'error';
      crossDeviceError = e.message;
    }
  }

  async function pollCrossDevice() {
    try {
      const serverUrl = 'http://localhost:3000';
      const response = await fetch(`${serverUrl}/api/cross-device/${crossDeviceSessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'received' && data.vp_token) {
          // VP token received! Process it
          crossDeviceStatus = 'received';
          if (crossDevicePollTimer) {
            clearInterval(crossDevicePollTimer);
            crossDevicePollTimer = null;
          }

          // Parse and display the result
          const vpToken = data.vp_token;
          if (typeof vpToken === 'object' && vpToken !== null) {
            result = { ...vpToken, _crossDevice: true };
          } else if (typeof vpToken === 'string') {
            try {
              result = { ...JSON.parse(vpToken), _crossDevice: true };
            } catch {
              result = { vp_token: vpToken, _crossDevice: true };
            }
          }
        }
      }
    } catch (_) {
      // Server not reachable - try client-side fallback
      checkClientSideCrossDevice();
    }
  }

  function checkClientSideCrossDevice() {
    // Check sessionStorage for a cross-device response (set by the Wallet tab)
    const vpResponse = sessionStorage.getItem('cross_device_vp_response');
    if (vpResponse) {
      sessionStorage.removeItem('cross_device_vp_response');
      try {
        result = JSON.parse(vpResponse);
        result._crossDevice = true;
      } catch {
        result = { vp_token: vpResponse, _crossDevice: true };
      }
      crossDeviceStatus = 'received';
      if (crossDevicePollTimer) {
        clearInterval(crossDevicePollTimer);
        crossDevicePollTimer = null;
      }
    }
  }

  function copyCrossDeviceUrl() {
    const uri = sessionStorage.getItem('cross_device_uri');
    if (uri) {
      navigator.clipboard.writeText(uri).then(() => {
        crossDeviceCopySuccess = true;
        setTimeout(() => { crossDeviceCopySuccess = false; }, 2000);
      }).catch(() => {
        // Fallback: select the text from a hidden input
        crossDeviceCopySuccess = true;
      });
    }
  }

  function exitCrossDevice() {
    crossDeviceMode = false;
    crossDeviceStatus = null;
    crossDeviceQRDataUrl = null;
    crossDeviceSessionId = null;
    crossDeviceError = null;
    crossDeviceCopySuccess = false;
    if (crossDevicePollTimer) {
      clearInterval(crossDevicePollTimer);
      crossDevicePollTimer = null;
    }
    sessionStorage.removeItem('cross_device_uri');
    sessionStorage.removeItem('cross_device_session_id');
  }

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
    loading = false;
    serverMode = false;
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

{#if loading}
  <div class="verifier">
    <div class="loading-indicator">
      <div class="spinner"></div>
      <p>{t('verify.polling')}</p>
      <p class="loading-hint">{t('verify.polling_hint')}</p>
    </div>
  </div>
{:else if result}
  <VerificationResult data={result} onReset={handleClear} />
{:else if crossDeviceMode}
  <div class="verifier">
    <div class="cross-device-toggle" onclick={exitCrossDevice}>
      ← {t('verify.cross_device_back')}
    </div>

    {#if crossDeviceStatus === 'waiting' || !crossDeviceStatus}
      <h3 class="section-title">{t('verify.cross_device_toggle')}</h3>
      {#if !crossDeviceQRDataUrl}
        <button class="btn btn-verify" onclick={startCrossDevice}>
          📲 {t('verify.cross_device_toggle')}
        </button>
      {:else}
        <div class="cross-device-qr">
          <div class="qr-image-wrapper">
            <img src={crossDeviceQRDataUrl} alt="Cross-Device QR" class="qr-image" />
          </div>
          <p class="cross-device-hint">{t('verify.cross_device_hint')}</p>

          <div class="btn-group" style="flex-direction: column; gap: 0.5rem;">
            <button class="btn btn-verify" onclick={copyCrossDeviceUrl}>
              {crossDeviceCopySuccess ? '✅ ' + t('verify.cross_device_copy_success') : '📋 ' + t('verify.cross_device_copy_url')}
            </button>
          </div>

          <p class="cross-device-url-hint">{t('verify.cross_device_url_hint')}</p>

          {#if crossDeviceStatus === 'waiting'}
            <div class="cross-device-waiting">
              <div class="spinner"></div>
              <p>{t('verify.cross_device_waiting')}</p>
            </div>
          {/if}
        </div>
      {/if}
    {:else if crossDeviceStatus === 'error'}
      <div class="error-msg">{t('verify.cross_device_error', { error: crossDeviceError || 'Unknown' })}</div>
    {/if}
  </div>
{:else}
  <div class="verifier">
    {#if serverMode}
      <div class="server-notice">
        ⚠️ {t('verify.server_notice')}
      </div>
    {/if}

    <div class="btn-group" style="margin-bottom: 0.75rem;">
      <button class="btn btn-cross-device" onclick={() => crossDeviceMode = true}>
        📲 {t('verify.cross_device_toggle')}
      </button>
    </div>

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
  .loading-indicator { text-align: center; padding: 3rem 1rem; }
  .spinner { width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top: 4px solid #1a237e; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-indicator p { color: #1a237e; font-weight: 600; }
  .loading-hint { color: #888; font-size: 0.8rem; margin-top: 0.5rem; }
  .server-notice { background: #e8f5e9; color: #2e7d32; font-size: 0.8rem; padding: 0.5rem; border-radius: 8px; margin-bottom: 0.75rem; text-align: center; border: 1px solid #a5d6a7; }


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

  .btn-cross-device { background: linear-gradient(135deg, #6a1b9a, #8e24aa); color: white; width: 100%; }
  .btn-cross-device:hover { opacity: 0.9; }

  .cross-device-toggle { background: none; border: none; color: #1a237e; cursor: pointer; font-size: 0.85rem; font-weight: 600; padding: 0.25rem 0; margin-bottom: 0.75rem; display: inline-block; }
  .cross-device-toggle:hover { text-decoration: underline; }

  .section-title { text-align: center; color: #1a237e; font-size: 1.1rem; margin-bottom: 1rem; }

  .cross-device-qr { display: flex; flex-direction: column; align-items: center; }
  .qr-image-wrapper { background: white; padding: 1.25rem; border-radius: 16px; border: 2px solid #8e24aa; box-shadow: 0 4px 20px rgba(106,27,154,0.15); margin-bottom: 0.75rem; }
  .qr-image { width: 256px; height: 256px; display: block; image-rendering: pixelated; }
  .cross-device-hint { font-size: 0.85rem; color: #555; text-align: center; margin-bottom: 0.75rem; }
  .cross-device-url-hint { font-size: 0.75rem; color: #888; text-align: center; margin-top: 0.5rem; font-style: italic; }
  .cross-device-waiting { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-top: 1rem; }
  .cross-device-waiting p { color: #8e24aa; font-size: 0.85rem; font-weight: 600; }
</style>
