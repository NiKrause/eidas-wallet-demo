<script>
  import VerificationResult from './VerificationResult.svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import { verifySDJWT, extractCredentialFromSDJWT } from '$lib/crypto/sdjwt.js';
  const { t } = i18n;

  let rawInput = $state('');
  let result = $state(null);
  let error = $state(null);
  let loading = $state(false);
  let serverMode = $state(false);

  // Offline Mode (ISO 18013-5 Device Engagement simulation)
  let offlineMode = $state(false);
  let offlineQrDataUrl = $state(null);

  function toggleOfflineMode() {
    offlineMode = !offlineMode;
    if (offlineMode && !offlineQrDataUrl) {
      generateDeviceEngagement();
    }
  }

  async function generateDeviceEngagement() {
    try {
      const QRCode = (await import('qrcode')).default;
      const engagement = {
        version: '1.0',
        protocol: 'iso-18013-5',
        device: 'eidas-wallet-demo',
        presentation: {
          format: ['sd_jwt_vc'],
          responseMode: 'proximity',
          supportedTransports: ['nfc', 'ble'],
        },
        createdAt: new Date().toISOString(),
      };
      offlineQrDataUrl = await QRCode.toDataURL(JSON.stringify(engagement), {
        width: 200, margin: 2,
        color: { dark: '#2e7d32', light: '#ffffff' },
      });
    } catch (e) {
      console.warn('Failed to generate device engagement QR:', e);
    }
  }

  // Check if OpenID4VP Verifier Server is reachable
  let serverReachable = $state(false);
  let serverChecking = $state(true);

  async function checkServer() {
    serverChecking = true;
    try {
      const response = await fetch('https://localhost:3000/api/info');
      if (response.ok) {
        const data = await response.json();
        serverReachable = data.status === 'running';
      }
    } catch {
      serverReachable = false;
    }
    serverChecking = false;
  }

  $effect(() => {
    checkServer();
  });

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
    try {
      let publicKey;

      if (data._issuerPublicKeyPem) {
        // Credential was issued by the PID Issuance Server — use server's public key
        const { importSPKI } = await import('jose');
        publicKey = await importSPKI(data._issuerPublicKeyPem, 'ES256');
      } else {
        // Browser-issued credential — use local key from store
        const { getIssuerKeyPair } = await import('$lib/crypto/sdjwt.js');
        const { publicKey: issuerPublicKey } = await getIssuerKeyPair();
        publicKey = issuerPublicKey;
      }

      // Verify the SD-JWT with the selected public key
      const { verifySDJWT, extractCredentialFromSDJWT } = await import('$lib/crypto/sdjwt.js');
      const { payload } = await verifySDJWT(data.sdjwt, publicKey);
      const credential = extractCredentialFromSDJWT(payload);

      result = {
        ...data,
        ...credential,
        _sdjwtVerified: true,
      };
    } catch (e) {
      // If verification fails but we have credential data, show it with a warning
      if (data._issuerPublicKeyPem) {
        error = `SD-JWT signature verification failed: ${e.message}`;
      } else {
        // Fallback: accept as-is (demo mode for browser-local)
        result = {
          ...data,
          _sdjwtVerified: false,
          _verifyWarning: e.message,
        };
      }
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
{:else}
  <div class="verifier">

    <div class="server-status-bar">
      {#if serverChecking}
        <span class="status-dot checking"></span> Prüfe Server…
      {:else if serverReachable}
        <span class="status-dot online"></span> 🔗 Verifier-Server verbunden (:3000)
      {:else}
        <span class="status-dot offline"></span> ⚡ Browser-local (kein Server)
      {/if}
    </div>

    <div class="mode-toggle">
      <button class="mode-btn" class:active={!offlineMode} onclick={() => offlineMode = false}>
        💻 Online
      </button>
      <button class="mode-btn offline-btn" class:active={offlineMode} onclick={toggleOfflineMode}>
        📵 Offline (Proximity)
      </button>
    </div>

    {#if offlineMode}
      <div class="offline-section">
        <p class="offline-title">📵 ISO 18013-5 Device Engagement</p>
        <p class="offline-desc">
          Simuliert den Nahbereichs-Flow. Im echten Leben würde dieser QR via NFC oder BLE
          übertragen werden. Scanne diesen QR mit dem Present-Tab (Cross-Device) oder
          zeige ihn einem echten Verifier-Gerät.
        </p>
        {#if offlineQrDataUrl}
          <div class="offline-qr-wrapper">
            <img src={offlineQrDataUrl} alt="Device Engagement QR" class="offline-qr" />
          </div>
          <p class="offline-transport">
            🟢 NFC · 🟢 BLE · 🟢 Offline-fähig
          </p>
        {:else}
          <div class="offline-loading">QR wird generiert…</div>
        {/if}
        <p class="offline-note">
          ⚠️ Dies ist eine Simulation. Echte Geräte nutzen BLE/NFC-Hardware.
          Der QR ermöglicht dennoch das Testen des Protokollablaufs im Browser.
        </p>
      </div>
    {:else}
      {#if serverMode}
        <div class="server-notice">
          ⚠️ {t('verify.server_notice')}
        </div>
      {/if}

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
    {/if}
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

  /* Mode Toggle */
  /* Server Status Bar */
  .server-status-bar { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.75rem; background: #f5f5f5; justify-content: center; color: #555; }
  .server-status-bar .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .status-dot.online { background: #22c55e; box-shadow: 0 0 4px #22c55e; }
  .status-dot.offline { background: #9ca3af; }
  .status-dot.checking { background: #f59e0b; animation: pulse 1s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

  .mode-toggle { display: flex; gap: 0.5rem; margin-bottom: 1rem; justify-content: center; }
  .mode-btn { padding: 0.4rem 1rem; border-radius: 20px; border: 1px solid #ddd; background: #f5f5f5; color: #666; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
  .mode-btn.active { background: #1a237e; color: white; border-color: #1a237e; }
  .offline-btn.active { background: #2e7d32; color: white; border-color: #2e7d32; }
  .offline-section { text-align: center; padding: 1rem 0; }
  .offline-title { font-size: 1rem; color: #2e7d32; font-weight: 600; margin-bottom: 0.5rem; }
  .offline-desc { font-size: 0.8rem; color: #666; line-height: 1.4; margin-bottom: 1rem; max-width: 350px; margin-left: auto; margin-right: auto; }
  .offline-qr-wrapper { background: white; padding: 1rem; border-radius: 12px; border: 2px solid #2e7d32; display: inline-block; box-shadow: 0 2px 12px rgba(46,125,50,0.15); }
  .offline-qr { width: 200px; height: 200px; image-rendering: pixelated; }
  .offline-loading { padding: 2rem; color: #888; }
  .offline-transport { margin-top: 0.75rem; font-size: 0.85rem; color: #2e7d32; font-weight: 600; }
  .offline-note { margin-top: 0.75rem; font-size: 0.75rem; color: #999; font-style: italic; max-width: 350px; margin-left: auto; margin-right: auto; }
</style>
