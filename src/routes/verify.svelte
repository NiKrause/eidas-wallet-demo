<script>
  import VerifierView from '$lib/components/VerifierView.svelte';
</script>
<div class="page">
  <div class="page-header">
    <h1>Verifier</h1>
    <p class="page-desc">Enter the JSON data from a presentation QR code to verify the shared attributes.</p>
  </div>
  <VerifierView />
</div>
<style>
  .page { padding: 1.5rem 1rem; }
  .page-header { text-align: center; margin-bottom: 1.5rem; }
  h1 { color: #1a237e; font-size: 1.3rem; margin-bottom: 0.3rem; }
  .page-desc { color: #666; font-size: 0.85rem; max-width: 350px; margin: 0 auto; }
</style>
