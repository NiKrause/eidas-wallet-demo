<script>
  import { onMount } from 'svelte';
  import { router } from '$lib/utils/router.svelte.js';
  import { historyStore } from '$lib/stores/history.svelte.js';
  let { credential, sharedAttributes, sharedValues, onReset } = $props();

  let qrImageUrl = $state('');
  let qrError = $state(false);
  let presentationData = $derived({
    format: 'eidas-wallet-demo-v1',
    credentialType: credential.type,
    credentialLabel: credential.label,
    issuer: credential.issuer,
    issuedAt: credential.issuedAt,
    attributes: sharedValues,
    sharedAttributes,
    timestamp: new Date().toISOString(),
  });
  let jsonString = $derived(JSON.stringify(presentationData, null, 2));

  onMount(async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      qrImageUrl = await QRCode.toDataURL(jsonString, { width: 280, margin: 2, color: { dark: '#1a237e', light: '#ffffff' } });
    } catch (e) { console.error(e); qrError = true; }
    historyStore.add({ credentialId: credential.id, credentialLabel: credential.label, credentialIcon: credential.icon, sharedAttributes, sharedValues, verifierName: 'Pending verification…' });
  });

  let attributeCount = $derived(sharedAttributes.length);
  let totalCount = $derived(Object.keys(credential.attributes).length);
</script>

<div class="qr-display">
  <div class="qr-header"><button class="back-btn" onclick={onReset}>← Edit Selection</button></div>
  <h2 class="qr-title">Presentation QR Code</h2>
  <p class="qr-subtitle">Show this to the Verifier to share your selected attributes</p>
  <div class="qr-info"><span class="qr-info-icon">{credential.icon}</span><span class="qr-info-text">{credential.label}</span></div>
  <div class="qr-badge">🔍 {attributeCount} of {totalCount} attributes shared</div>
  <div class="qr-code-container">
    {#if qrError}
      <div class="qr-fallback"><p>⚠️ QR generation failed</p><p class="qr-fallback-hint">You can copy the JSON data manually:</p></div>
    {:else if qrImageUrl}
      <img src={qrImageUrl} alt="Presentation QR Code" class="qr-image" />
    {:else}
      <div class="qr-loading">Generating QR code…</div>
    {/if}
  </div>
  {#if !qrError}<p class="qr-hint">The encoded data can be read by any compatible verifier</p>{/if}
  <details class="raw-data"><summary>View raw JSON payload</summary><pre>{jsonString}</pre></details>
  <div class="verify-link-section">
    <p class="verify-hint">Same-browser test:</p>
    <button class="verify-link-btn" onclick={() => router.navigate('/verify')}>✅ Open Verifier</button>
  </div>
  <button class="reset-btn" onclick={onReset}>← Present Another</button>
</div>

<style>
  .qr-display { max-width: 400px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .qr-header { width: 100%; display: flex; margin-bottom: 0.5rem; }
  .back-btn { background: none; border: none; color: #1a237e; cursor: pointer; font-size: 0.9rem; padding: 0.25rem 0; }
  .back-btn:hover { text-decoration: underline; }
  .qr-title { color: #1a237e; font-size: 1.2rem; margin-bottom: 0.25rem; }
  .qr-subtitle { color: #666; font-size: 0.85rem; margin-bottom: 1rem; }
  .qr-info { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
  .qr-info-icon { font-size: 1.5rem; }
  .qr-info-text { font-weight: 600; color: #333; }
  .qr-badge { font-size: 0.8rem; background: #e8f5e9; color: #2e7d32; padding: 0.3rem 0.8rem; border-radius: 20px; margin-bottom: 1.5rem; }
  .qr-code-container { background: white; border: 2px solid #e8e8e8; border-radius: 16px; padding: 1.5rem; margin-bottom: 0.75rem; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
  .qr-image { display: block; width: 280px; height: 280px; image-rendering: pixelated; }
  .qr-loading, .qr-fallback { width: 280px; height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999; font-size: 0.9rem; }
  .qr-fallback-hint { font-size: 0.8rem; margin-top: 0.5rem; color: #888; }
  .qr-hint { font-size: 0.8rem; color: #999; margin-bottom: 1rem; }
  .raw-data { width: 100%; margin-bottom: 1rem; text-align: left; }
  .raw-data summary { font-size: 0.8rem; color: #888; cursor: pointer; margin-bottom: 0.5rem; }
  .raw-data pre { font-size: 0.7rem; background: #f5f5f5; border-radius: 8px; padding: 0.75rem; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; }
  .verify-link-section { width: 100%; margin-bottom: 0.75rem; }
  .verify-hint { font-size: 0.8rem; color: #888; margin-bottom: 0.4rem; }
  .verify-link-btn { width: 100%; padding: 0.7rem; background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
  .verify-link-btn:hover { background: #c8e6c9; }
  .reset-btn { width: 100%; padding: 0.7rem; background: #f0f0f0; border: none; border-radius: 10px; font-size: 0.9rem; cursor: pointer; color: #555; margin-top: 0.25rem; }
  .reset-btn:hover { background: #e0e0e0; }
</style>
