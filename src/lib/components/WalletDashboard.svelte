<script>
  import { router } from '$lib/utils/router.svelte.js';
  import { credentialStore } from '$lib/stores/credentials.svelte.js';
  import CredentialCard from './CredentialCard.svelte';
  import CredentialDetail from './CredentialDetail.svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  const { t } = i18n;

  let selectedCredential = $state(null);
  let credentials = $derived(credentialStore.all);
  let pidCount = $derived(credentialStore.pid.length);
  let qeaaCount = $derived(credentialStore.qeaas.length);
  function handleDetail(cred) { selectedCredential = cred; }
  function handleCloseDetail() { selectedCredential = null; }
</script>

<div class="dashboard">
  <div class="stats-row">
    <div class="stat-card"><span class="stat-value">{credentials.length}</span><span class="stat-label">{t('wallet.total')}</span></div>
    <div class="stat-card stat-pid"><span class="stat-value">{pidCount}</span><span class="stat-label">PID</span></div>
    <div class="stat-card stat-qeaa"><span class="stat-value">{qeaaCount}</span><span class="stat-label">QEAA</span></div>
  </div>
  {#if credentials.length === 0}
    <div class="empty-state">
      <div class="empty-icon">👛</div>
      <h3>{t('wallet.empty.title')}</h3>
      <p>{t('wallet.empty.desc')}</p>
      <button class="btn-issue" onclick={() => router.navigate('/issuance')}>{t('wallet.empty.cta')}</button>
    </div>
  {:else}
    <div class="credential-grid">
      {#each credentials as cred (cred.id)}
        <CredentialCard credential={cred} onDetail={handleDetail} />
      {/each}
    </div>
  {/if}
</div>
{#if selectedCredential}
  <CredentialDetail credential={selectedCredential} onClose={handleCloseDetail} />
{/if}

<style>
  .dashboard { padding: 1rem; }
  .stats-row { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
  .stat-card { flex: 1; background: white; border: 1px solid #e8e8e8; border-radius: 12px; padding: 0.75rem; text-align: center; display: flex; flex-direction: column; gap: 0.15rem; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: #1a237e; }
  .stat-label { font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-pid .stat-value { color: #1565c0; }
  .stat-qeaa .stat-value { color: #2e7d32; }
  .credential-grid { display: flex; flex-direction: column; gap: 0.75rem; }
  .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 3rem 1rem; background: white; border-radius: 16px; border: 1px dashed #ccc; }
  .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }
  .empty-state h3 { color: #1a237e; margin-bottom: 0.5rem; }
  .empty-state p { color: #888; font-size: 0.9rem; margin-bottom: 1.5rem; max-width: 280px; }
  .btn-issue { background: linear-gradient(135deg, #1a237e, #283593); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
  .btn-issue:hover { opacity: 0.9; }
</style>