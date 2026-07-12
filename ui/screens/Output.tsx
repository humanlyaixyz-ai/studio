import { useEffect, useMemo, useState } from 'react';
import { Pill, Button } from '../kit';
import { useProjects } from '../data/projects';
import * as db from '../../services/dbService';
import type { GenerationBatch } from '../../types';

/**
 * Output — real generated-asset gallery for the selected project.
 * Loads persisted generation batches (db.loadProjectBatches) and renders every
 * successful image with download; failures/pending are shown inline. Batches are
 * grouped newest-first. Shell (tab bar + project menu) is provided by WorkspaceShell.
 */

const relTime = (ts: number) => {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
};

const ico = (d: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

function ImageTile({ url, status, error, prompt }: { url?: string; status: string; error?: string; prompt?: string }) {
  const download = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `ovarly-${Date.now()}.png`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  };
  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-wire-border bg-wire-bg-2">
      {status === 'success' && url ? (
        <>
          <img src={url} alt={prompt || 'Generated image'} loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button type="button" onClick={download} title="Download" className="grid h-8 w-8 place-items-center rounded-md bg-white/90 text-wire-text hover:bg-white">
              {ico('M12 3v12M7 10l5 5 5-5M4 21h16', 16)}
            </button>
          </div>
        </>
      ) : status === 'failed' ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 p-3 text-center">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-danger-weak text-danger">{ico('M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z', 16)}</span>
          <p className="text-[11px] font-medium text-danger">Failed</p>
          {error ? <p className="line-clamp-2 text-[10px] text-wire-muted" title={error}>{error}</p> : null}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-weak-2 border-t-brand" aria-hidden />
        </div>
      )}
    </div>
  );
}

export default function Output() {
  const { selectedId, projects } = useProjects();
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) { setBatches([]); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    db.loadProjectBatches(selectedId)
      .then((rows) => { if (!cancelled) setBatches(rows); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load outputs'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const stats = useMemo(() => {
    const imgs = batches.flatMap((b) => b.images);
    return { batches: batches.length, total: imgs.length, ok: imgs.filter((i) => i.status === 'success').length };
  }, [batches]);

  const projectName = projects.find((p) => p.id === selectedId)?.name;
  const empty = !loading && batches.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-wire-text">Output</h2>
          <p className="mt-1 text-sm text-wire-muted">
            {stats.total > 0
              ? `${stats.ok} image${stats.ok === 1 ? '' : 's'} across ${stats.batches} generation${stats.batches === 1 ? '' : 's'}${projectName ? ` · ${projectName}` : ''}.`
              : 'Everything generated on the canvas lands here.'}
          </p>
        </div>
        {stats.ok > 0 ? <Pill tone="ok">{stats.ok} ready</Pill> : null}
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger-weak px-3 py-2 text-sm text-wire-text">
          <span className="font-semibold text-danger">Couldn’t load outputs:</span> {error}
        </div>
      )}

      {!selectedId ? (
        <div className="rounded-lg border border-wire-border bg-wire-surface p-8 text-center text-sm text-wire-muted">
          Select a project to view its generated outputs.
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-wire-bg-2" />
          ))}
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-24 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-weak text-brand">
            {ico('M3 4h18v14H3zM3 14l4-4 4 4 3-3 4 4', 22)}
          </span>
          <p className="text-lg font-semibold text-wire-text">No outputs yet</p>
          <p className="max-w-md text-sm text-wire-muted">Generate images on the canvas and they’ll collect here so you can review and export them.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {batches.map((b) => (
            <section key={b.id}>
              <div className="mb-3 flex items-center gap-3">
                <p className="text-sm font-semibold text-wire-text">{b.skuName || b.category}</p>
                <span className="text-xs text-wire-muted">{b.model.replace(/_/g, ' ').toLowerCase()}</span>
                <span className="text-xs text-wire-muted">· {relTime(b.timestamp)}</span>
                <span className="text-xs text-wire-muted">· {b.images.filter((i) => i.status === 'success').length}/{b.images.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {b.images.map((img) => (
                  <ImageTile key={img.id} url={img.url} status={img.status} error={img.errorMessage} prompt={img.prompt} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
