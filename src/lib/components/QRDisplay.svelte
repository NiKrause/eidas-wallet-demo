<script>
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import { historyStore } from '$lib/stores/history.svelte.js';
  import { createPresentation } from '$lib/crypto/sdjwt.js';

  let { credential, sharedAttributes, sharedValues, onBack, onNavigate, onReset } = $props();
  const { t } = i18n;

  let qrDataUrl = $state(null);
  let showRaw = $state(false);
  let error = $state(null);
  let openid4vpData = $state(null);
  let verifierUrl = $state('https://localhost:3000');

  // Build the presentation request for the OpenID4VP server
  let presentationData = $derived({
    format: credential.sdjwt ? 'sd_jwt_vc' : 'eidas-wallet-demo-v1',
    credentialType: credential.type,
    credentialLabel: credential.label,
    credentialId: credential.id,
    status: credential.status,
    issuer: credential.issuer,
    issuedAt: credential.issuedAt,
    attributes: sharedValues,
    sharedAttributes,
    timestamp: new Date().toISOString(),
  });

  let jsonString = $derived(JSON.stringify(presentationData, null, 2));
  let attributeCount = $derived(sharedAttributes?.length || 0);
  let totalAttributes = $derived(Object.keys(credential.attributes || {}).length);

  onMount(async () => {
    // Log to history
    historyStore.add({
      credentialId: credential.id,
      credentialLabel: credential.label,
      credentialIcon: credential.icon,
      sharedAttributes,
      sharedValues,
      status: 'success',
    });

    // Phase 2: Try to call the OpenID4VP Verifier Server
    // to get a proper openid4vp:// URI for the QR code.
    // Fallback to custom JSON if server is unavailable.
    try {
      const response = await fetch(`${verifierUrl}/api/presentation-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialType: credential.type,
          credentialLabel: credential.label,
          credentialId: credential.id,
          attributes: sharedValues,
          sharedAttributes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        openid4vpData = data;
        // QR encodes the OpenID4VP URI
        qrDataUrl = await QRCode.toDataURL(data.openid4vp_uri, {
          width: 256,
          margin: 2,
          color: { dark: '#1a237e', light: '#ffffff' },
        });
        console.log('✅ OpenID4VP URI generated:', data.request_id);
        return; // Success – done
      }
    } catch (e) {
      console.warn('⚠️ OpenID4VP server unavailable, using fallback JSON format:', e.message);
    }

    // Fallback: Encode custom JSON in QR code (same as before)
    try {
      const qrString = JSON.stringify(presentationData);
      qrDataUrl = await QRCode.toDataURL(qrString, {
        width: 256,
        margin: 2,
        color: { dark: '#1a237e', light: '#ffffff' },
      });
      error = 'OpenID4VP server not reachable — QR contains fallback JSON format (not scannable by real wallets)';
    } catch (e) {
      console.error('QR generation failed:', e);
    }
  });

  // Cross-device state
  let showCrossDevice = $state(false);
  let crossDeviceUrl = $state('');
  let crossDeviceSending = $state(false);
  let crossDeviceResult = $state(null); // null | 'success' | 'error'
  let crossDeviceResultMsg = $state('');

  async function pasteFromVerifier() {
    // Read the cross-device URI from sessionStorage (set by VerifierView)
    const uri = sessionStorage.getItem('cross_device_uri');
    const sessionId = sessionStorage.getItem('cross_device_session_id');
    if (uri && sessionId) {
      crossDeviceUrl = uri;
      // Auto-send
      await sendCrossDeviceResponse(sessionId);
    } else {
      crossDeviceResult = 'error';
      crossDeviceResultMsg = t('present.cross_device_no_url');
    }
  }

  async function sendCrossDeviceResponse(sessionId) {
    crossDeviceSending = true;
    crossDeviceResult = null;
    crossDeviceResultMsg = '';

    try {
      // Build the VP token (same as what we'd put in the QR code)
      const vpToken = {
        format: credential.sdjwt ? 'sd_jwt_vc' : 'eidas-wallet-demo-v1',
        credentialType: credential.type,
        credentialLabel: credential.label,
        credentialId: credential.id,
        status: credential.status,
        issuer: credential.issuer,
        issuedAt: credential.issuedAt,
        attributes: sharedValues,
        sharedAttributes,
        timestamp: new Date().toISOString(),
      };

      // Try to POST to the server
      const serverUrl = 'http://localhost:3000';
      try {
        const response = await fetch(`${serverUrl}/api/cross-device/${sessionId}/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vp_token: JSON.stringify(vpToken) }),
        });

        if (response.ok) {
          crossDeviceResult = 'success';
          crossDeviceResultMsg = t('present.cross_device_success');
        } else {
          throw new Error('Server returned ' + response.status);
        }
      } catch (_) {
        // Server not running - use client-side fallback via sessionStorage
        sessionStorage.setItem('cross_device_vp_response', JSON.stringify(vpToken));
        crossDeviceResult = 'success';
        crossDeviceResultMsg = t('present.cross_device_success');
      }
    } catch (e) {
      crossDeviceResult = 'error';
      crossDeviceResultMsg = t('present.cross_device_error', { error: e.message });
    } finally {
      crossDeviceSending = false;
    }
  }

  async function handleManualSend() {
    // Parse the URL to extract the session_id
    const trimmed = crossDeviceUrl.trim();
    if (!trimmed) {
      crossDeviceResult = 'error';
      crossDeviceResultMsg = t('present.cross_device_error', { error: 'Empty URL' });
      return;
    }

    // Extract session_id from OPENID4VP://cross-device?session_id=...
    let sessionId = null;
    try {
      const url = new URL(trimmed.replace('OPENID4VP://', 'https://'));
      sessionId = url.searchParams.get('session_id');
    } catch {
      // Try regex fallback
      const match = trimmed.match(/session_id=([^&]+)/);
      if (match) sessionId = match[1];
    }

    if (!sessionId) {
      crossDeviceResult = 'error';
      crossDeviceResultMsg = t('present.cross_device_error', { error: 'Could not extract session_id from URL' });
      return;
    }

    await sendCrossDeviceResponse(sessionId);
  }

  async function handleOpenVerifier() {
    const raw = JSON.stringify(presentationData, null, 2);

    // Phase 3a: When the server is connected, POST the VP for verification
    if (openid4vpData) {
      try {
        const response = await fetch(`${verifierUrl}/api/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vp_token: raw,
            presentation_submission: {
              definition_id: openid4vpData.request_id,
              descriptor_map: [{
                id: presentationData.credentialType,
                format: 'sd_jwt_vc',
                path: '$'
              }]
            }
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // Store the result_id for the VerifierView to poll
          sessionStorage.setItem('pending_result_id', result.result_id);
          sessionStorage.setItem('pending_presentation', raw); // fallback
          sessionStorage.setItem('verifier_url', verifierUrl);
          onNavigate?.('/verify');
          return;
        }
      } catch (e) {
        console.warn('⚠️ OpenID4VP server POST /api/response failed, using fallback:', e.message);
      }
    }

    // Fallback: same-browser verification via sessionStorage
    sessionStorage.setItem('pending_presentation', raw);
    onNavigate?.('/verify');
  }
</script>

<div class="qr-display">
  <div class="qr-header">
    <h2 class="qr-title">{t('present.qr_title')}</h2>
    <p class="qr-subtitle">{t('present.qr_subtitle')}</p>
  </div>

  {#if qrDataUrl}
    <div class="qr-image-wrapper">
      <img src={qrDataUrl} alt="QR Code" class="qr-image" />
    </div>
  {:else}
    <div class="qr-loading">{t('app.loading')}</div>
  {/if}

  <div class="qr-info">
    <span class="qr-type-badge">{credential.type}</span>
    <span class="qr-shared">{t('present.qr_shared', { count: attributeCount, total: totalAttributes })}</span>
  </div>

  {#if openid4vpData}
    <div class="openid4vp-badge">
      {t('present.openid4vp_badge')}
    </div>
  {:else if error}
    <div class="warning-badge">{t('present.openid4vp_fallback')}</div>
  {/if}

  <p class="qr-hint">{t('present.qr_hint')}</p>

  <div class="qr-actions">
    {#if credential.sdjwt}
      <div class="sdjwt-badge">✅ SD-JWT signiert</div>
    {/if}
    <button class="action-btn" onclick={() => showRaw = !showRaw}>
      {showRaw ? '🔽' : '📄'} {openid4vpData ? t('present.qr_view_uri') : t('present.qr_view')}
    </button>
  </div>

  {#if showRaw}
    <pre class="raw-data"><code>{openid4vpData ? openid4vpData.openid4vp_uri : jsonString}</code></pre>
  {/if}

  <div class="verify-section">
    <p class="verify-hint">{t('present.verify_hint')}</p>
    <button class="verify-btn" onclick={handleOpenVerifier}>
      {t('present.verify_open')}
    </button>
  </div>

  <button class="back-btn" onclick={onBack}>← {t('present.present_another')}</button>
</div>

<style>
  .qr-display { display: flex; flex-direction: column; align-items: center; max-width: 400px; margin: 0 auto; padding: 1rem; }
  .qr-header { text-align: center; margin-bottom: 1rem; }
  .qr-title { font-size: 1.2rem; color: #1a237e; margin-bottom: 0.25rem; }
  .qr-subtitle { font-size: 0.85rem; color: #666; }
  .qr-image-wrapper { background: white; padding: 1.25rem; border-radius: 16px; border: 2px solid #1a237e; box-shadow: 0 4px 20px rgba(26,35,126,0.15); margin-bottom: 0.75rem; }
  .qr-image { width: 256px; height: 256px; display: block; image-rendering: pixelated; }
  .qr-loading { width: 256px; height: 256px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border-radius: 12px; color: #888; }
  .qr-info { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; }
  .qr-type-badge { background: #e3f2fd; color: #1565c0; padding: 0.25rem 0.6rem; border-radius: 8px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
  .qr-shared { font-size: 0.85rem; color: #555; }
  .sdjwt-badge { background: #e8f5e9; color: #2e7d32; font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: 600; }
  .openid4vp-badge { background: #e8f5e9; color: #2e7d32; font-size: 0.75rem; padding: 0.35rem 0.75rem; border-radius: 8px; font-weight: 600; margin-bottom: 0.5rem; text-align: center; width: 100%; border: 1px solid #a5d6a7; }
  .warning-badge { background: #fff3e0; color: #e65100; font-size: 0.7rem; padding: 0.35rem 0.75rem; border-radius: 8px; font-weight: 500; margin-bottom: 0.5rem; text-align: center; width: 100%; border: 1px solid #ffe0b2; }
  .qr-hint { font-size: 0.8rem; color: #888; text-align: center; margin-bottom: 0.75rem; }
  .qr-actions { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; }
  .action-btn { background: #f0f0f0; border: none; border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.8rem; cursor: pointer; color: #555; }
  .action-btn:hover { background: #e0e0e0; }
  .raw-data { width: 100%; max-height: 200px; overflow-y: auto; background: #fafafa; border: 1px solid #eee; border-radius: 10px; padding: 0.75rem; font-size: 0.7rem; margin-bottom: 0.75rem; }
  .raw-data code { font-family: monospace; white-space: pre; color: #333; }
  .verify-section { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
  .verify-hint { font-size: 0.8rem; color: #888; }
  .verify-btn { width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #1a237e, #283593); color: white; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
  .verify-btn:hover { opacity: 0.9; }
  .back-btn { width: 100%; padding: 0.75rem; background: #f0f0f0; border: none; border-radius: 10px; font-size: 0.95rem; cursor: pointer; color: #555; margin-top: 0.5rem; }
  .back-btn:hover { background: #e0e0e0; }
</style>
