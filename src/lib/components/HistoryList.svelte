<script>
  import { historyStore } from '$lib/stores/history.svelte.js';
  import HistoryDetail from './HistoryDetail.svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  const { t } = i18n;

  let selectedEntry = $state(null);
  let showConfirmClear = $state(false);
  let entries = $derived(historyStore.all);

  function formatDate(iso) {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === today.toDateString()) return `Today at ${timeStr}`;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${timeStr}`;
    return `${dateStr}, ${timeStr}`;
  }

  function handleDetail(entry) { selectedEntry = entry; }
  function handleClose() { selectedEntry = null; }
  function handleClear() { historyStore.clear(); showConfirmClear = false; }

  function handleExport() {
    const json = historyStore.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eidas-wallet-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="history-list">
  {#if entries.length === 0}
    <div class="empty-state"><div class="empty-icon">📋</div><h3>{t('history.empty.title')}</h3><p>{t('history.empty.desc')}</p></div>
  {:else}
    <div class="actions-bar">
      <span class="entry-count">{entries.length} presentation{entries.length !== 1 ? 's' : ''}</span>
      <div class="actions">
        <button class="action-btn" onclick={handleExport} title="Export as JSON">{t('history.export')}</button>
        {#if showConfirmClear}
          <button class="action-btn btn-danger" onclick={handleClear}>{t('history.confirm')}</button>
          <button class="action-btn" onclick={() => showConfirmClear = false}>{t('history.cancel')}</button>
        {:else}
          <button class="action-btn btn-danger-outline" onclick={() => showConfirmClear = true}>{t('history.clear')}</button>
        {/if}
      </div>
    </div>
    <div class="timeline">
      {#each entries as entry, i (entry.id)}
        <button class="timeline-item" onclick={() => handleDetail(entry)}>
          <div class="timeline-dot"><span class="dot-icon">{entry.credentialIcon || '📄'}</span></div>
          <div class="timeline-content">
            <div class="timeline-header"><span class="timeline-label">{entry.credentialLabel}</span><span class="timeline-status">✅</span></div>
            <div class="timeline-meta">
              <span>{t('history.detail.count', { count: entry.sharedAttributes?.length || 0 })} shared</span>
              {#if entry.verifierName && !entry.verifierName.startsWith('Pending')}<span class="verifier-badge">{entry.verifierName}</span>{/if}
            </div>
            <span class="timeline-date">{formatDate(entry.presentedAt)}</span>
          </div>
        </button>
        {#if i < entries.length - 1}<div class="timeline-line"></div>{/if}
      {/each}
    </div>
  {/if}
</div>
{#if selectedEntry}
  <HistoryDetail entry={selectedEntry} onClose={handleClose} />
{/if}

<style>
  .history-list { max-width: 480px; margin: 0 auto; }
  .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 3rem 1rem; background: white; border-radius: 16px; border: 1px dashed #ccc; }
  .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }
  .empty-state h3 { color: #1a237e; margin-bottom: 0.5rem; }
  .empty-state p { color: #888; font-size: 0.9rem; max-width: 280px; }
  .actions-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
  .entry-count { font-size: 0.85rem; color: #888; font-weight: 500; }
  .actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .action-btn { padding: 0.35rem 0.7rem; border-radius: 8px; font-size: 0.75rem; font-weight: 500; cursor: pointer; border: 1px solid #ddd; background: white; color: #555; transition: all 0.2s; }
  .action-btn:hover { background: #f5f5f5; }
  .btn-danger-outline { color: #dc2626; border-color: #fca5a5; }
  .btn-danger-outline:hover { background: #fef2f2; }
  .btn-danger { background: #dc2626; color: white; border-color: #dc2626; }
  .btn-danger:hover { background: #b91c1c; }
  .timeline { display: flex; flex-direction: column; position: relative; }
  .timeline-item { display: flex; gap: 0.75rem; background: white; border: 1px solid #eee; border-radius: 12px; padding: 0.85rem 1rem; cursor: pointer; text-align: left; transition: all 0.2s; width: 100%; font-family: inherit; }
  .timeline-item:hover { border-color: #1a237e; box-shadow: 0 2px 12px rgba(26,35,126,0.08); }
  .timeline-dot { flex-shrink: 0; width: 36px; height: 36px; background: #f0f4ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: 0.1rem; }
  .dot-icon { font-size: 1.1rem; }
  .timeline-content { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
  .timeline-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .timeline-label { font-weight: 600; color: #1a237e; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .timeline-status { flex-shrink: 0; }
  .timeline-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #666; flex-wrap: wrap; }
  .verifier-badge { font-size: 0.7rem; background: #e3f2fd; color: #1565c0; padding: 0.1rem 0.4rem; border-radius: 4px; }
  .timeline-date { font-size: 0.75rem; color: #999; }
  .timeline-line { width: 2px; height: 12px; background: #e0e0e0; margin-left: 18px; }
</style>