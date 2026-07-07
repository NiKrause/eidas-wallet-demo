<script>
  import VerificationResult from './VerificationResult.svelte';
  let rawInput = $state('');
  let parsedResult = $state(null);
  let parseError = $state('');

  function handleInput(e) { rawInput = e.target.value; parseError = ''; parsedResult = null; }
  function handleClear() { rawInput = ''; parsedResult = null; parseError = ''; }

  function handleVerify() {
    parseError = ''; parsedResult = null;
    if (!rawInput.trim()) { parseError = 'Please enter or paste the JSON data.'; return; }
    try {
      const data = JSON.parse(rawInput.trim());
      if (!data.format || !data.attributes) { parseError = 'Invalid format: missing "format" or "attributes" field.'; return; }
      if (data.format !== 'eidas-wallet-demo-v1') { parseError = `Unknown format: "${data.format}". Expected "eidas-wallet-demo-v1".`; return; }
      parsedResult = data;
    } catch (e) { parseError = 'Invalid JSON: ' + e.message; }
  }

  function handlePasteSample() {
    rawInput = JSON.stringify({
      format: 'eidas-wallet-demo-v1',
      credentialType: 'PID',
      credentialLabel: 'Personal Identification Data',
      issuer: 'National Identity Authority',
      issuedAt: new Date().toISOString(),
      attributes: { given_name: 'Jane', family_name: 'Sample', age_over_18: true },
      sharedAttributes: ['given_name', 'family_name', 'age_over_18'],
      timestamp: new Date().toISOString(),
    }, null, 2);
    parseError = ''; parsedResult = null;
  }
</script>

<div class="verifier-view">
  <h2 class="verifier-title">🔍 Verifier</h2>
  <p class="verifier-subtitle">Paste a presentation QR data to verify the attributes.</p>
  {#if !parsedResult}
    <div class="input-section">
      <textarea class="json-input" placeholder='Paste the JSON data from the QR code here…' value={rawInput} oninput={handleInput} rows="6"></textarea>
      {#if parseError}<div class="error-msg">⚠️ {parseError}</div>{/if}
      <div class="verifier-actions">
        <button class="btn btn-verify" onclick={handleVerify} disabled={!rawInput.trim()}>✅ Verify</button>
        <button class="btn btn-clear" onclick={handleClear}>Clear</button>
      </div>
      <button class="sample-btn" onclick={handlePasteSample}>📋 Load Sample Data</button>
    </div>
  {:else}
    <VerificationResult data={parsedResult} onReset={handleClear} />
  {/if}
</div>

<style>
  .verifier-view { max-width: 480px; margin: 0 auto; padding: 0 0.5rem; }
  .verifier-title { text-align: center; color: #1a237e; font-size: 1.3rem; margin-bottom: 0.25rem; }
  .verifier-subtitle { text-align: center; color: #666; font-size: 0.85rem; margin-bottom: 1.5rem; }
  .input-section { display: flex; flex-direction: column; gap: 0.75rem; }
  .json-input { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 10px; font-family: monospace; font-size: 0.8rem; resize: vertical; min-height: 120px; transition: border-color 0.2s; }
  .json-input:focus { outline: none; border-color: #1a237e; box-shadow: 0 0 0 3px rgba(26,35,126,0.1); }
  .error-msg { background: #fef2f2; color: #dc2626; padding: 0.6rem 0.8rem; border-radius: 8px; font-size: 0.85rem; border: 1px solid #fecaca; }
  .verifier-actions { display: flex; gap: 0.75rem; }
  .btn { flex: 1; padding: 0.75rem; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.2s; }
  .btn:hover:not(:disabled) { opacity: 0.9; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-verify { background: linear-gradient(135deg, #1a237e, #283593); color: white; }
  .btn-clear { background: #f0f0f0; color: #555; }
  .sample-btn { background: none; border: 1px dashed #ccc; padding: 0.6rem; border-radius: 8px; font-size: 0.85rem; cursor: pointer; color: #888; transition: border-color 0.2s; }
  .sample-btn:hover { border-color: #1a237e; color: #1a237e; }
</style>
