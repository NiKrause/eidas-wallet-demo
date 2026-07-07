<script>
  import AttributeSelector from '$lib/components/AttributeSelector.svelte';
  import QRDisplay from '$lib/components/QRDisplay.svelte';
  let presentationState = $state(null);
  function handlePresent(data) { presentationState = data; }
  function handleReset() { presentationState = null; }
</script>
<div class="page">
  <div class="page-header">
    <h1>Present Credential</h1>
    <p class="page-desc">Select which attributes to share and generate a QR code for a verifier.</p>
  </div>
  {#if presentationState}
    <QRDisplay credential={presentationState.credential} sharedAttributes={presentationState.sharedAttributes} sharedValues={presentationState.sharedValues} onReset={handleReset} />
  {:else}
    <AttributeSelector onPresent={handlePresent} />
  {/if}
</div>
<style>
  .page { padding: 1.5rem 1rem; }
  .page-header { text-align: center; margin-bottom: 1.5rem; }
  h1 { color: #1a237e; font-size: 1.3rem; margin-bottom: 0.3rem; }
  .page-desc { color: #666; font-size: 0.85rem; max-width: 350px; margin: 0 auto; }
</style>
