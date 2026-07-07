<script>
  import WalletDashboard from '$lib/components/WalletDashboard.svelte';
</script>
<div class="page">
  <div class="page-header">
    <h1>My Wallet</h1>
    <p class="page-desc">Your digital identity credentials — issued and ready to present.</p>
  </div>
  <WalletDashboard />
</div>
<style>
  .page { padding-bottom: 0.5rem; }
  .page-header { text-align: center; padding: 1rem 1rem 0; }
  h1 { color: #1a237e; font-size: 1.3rem; margin-bottom: 0.3rem; }
  .page-desc { color: #666; font-size: 0.85rem; }
</style>
