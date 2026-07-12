import { useEffect, useMemo, useState } from 'react';
import { Pill, Button } from '../kit';
import { useProjects } from '../data/projects';
import * as db from '../../services/dbService';
import type { GenerationBatch } from '../../types';

/**
 * Review — curation board over the project's REAL generated outputs.
 * Loads generation batches (db.loadProjectBatches), lets a reviewer approve / reject each
 * successful image, filter by state, and export (download) the approved set. Approval is
 * kept per-project in localStorage (no review column in the schema yet).
 * Shell (tab bar + project menu) is provided by WorkspaceShell.
 */

type Verdict = 'approved' | 'rejected';
const ico = (d: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

const FILTERS = ['All', 'Approved', 'Rejected', 'Undecided'] as const;
type Filter = (typeof FILTERS)[number];

export default function Review() {
  const { selectedId } = useProjects();
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [filter, setFilter] = useState<Filter>('All');

  const lsKey = selectedId ? `ovarly.review.${selectedId}` : null;

  useEffect(() => {
    if (!lsKey) { setVerdicts({}); return; }
    try { setVerdicts(JSON.parse(localStorage.getItem(lsKey) || '{}')); } catch { setVerdicts({}); }
  }, [lsKey]);

  useEffect(() => {
    if (!selectedId) { setBatches([]); return; }
    let cancelled = false;
    setLoading(true);
    db.loadProjectBatches(selectedId)
      .then((rows) => { if (!cancelled) setBatches(rows); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const setVerdict = (id: string, v: Verdict | null) => {
    setVerdicts((prev) => {
      const next = { ...prev };
      if (v === null || prev[id] === v) delete next[id]; else next[id] = v;
      if (lsKey) { try { localStorage.setItem(lsKey, JSON.stringify(next)); } catch { /* ignore */ } }
      return next;
    });
  };

  const items = useMemo(
    () => batches.flatMap((b) => b.images.filter((i) => i.status === 'success' && i.url).map((i) => ({ img: i, skuName: b.skuName || b.category }))),
    [batches],
  );

  const counts = useMemo(() => ({
    All: items.length,
    Approved: items.filter((it) => verdicts[it.img.id] === 'approved').length,
    Rejected: items.filter((it) => verdicts[it.img.id] === 'rejected').length,
    Undecided: items.filter((it) => !verdicts[it.img.id]).length,
  }), [items, verdicts]);

  const shown = items.filter((it) => {
    const v = verdicts[it.img.id];
    if (filter === 'Approved') return v === 'approved';
    if (filter === 'Rejected') return v === 'rejected';
    if (filter === 'Undecided') return !v;
    return true;
  });

  const exportApproved = () => {
    items.filter((it) => verdicts[it.img.id] === 'approved').forEach((it, i) => {
      const a = document.createElement('a');
      a.href = it.img.url!;
      a.download = `approved-${i + 1}.png`;
      a.target = '_blank';
      a.rel = 'noopener';
      setTimeout(() => a.click(), i * 150); // stagger so the browser accepts multiple
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-wire-text">Review</h2>
          <p className="mt-1 text-sm text-wire-muted">Approve or reject generated images, then export the approved set.</p>
        </div>
        {counts.Approved > 0 ? <Button onClick={exportApproved}>{ico('M12 3v12M8 11l4 4 4-4M4 21h16', 16)} Export {counts.Approved} approved</Button> : null}
      </div>

      {!selectedId ? (
        <div className="rounded-lg border border-wire-border bg-wire-surface p-8 text-center text-sm text-wire-muted">Select a project to review its outputs.</div>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-wire-bg-2" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-24 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-weak text-brand">{ico('M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', 22)}</span>
          <Pill tone="brand">Nothing to review yet</Pill>
          <p className="text-lg font-semibold text-wire-text">No generated images</p>
          <p className="max-w-md text-sm text-wire-muted">Generate images on the canvas and they’ll appear here for approval.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {FILTERS.map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={['rounded-md border px-3 py-1.5 text-xs font-medium', filter === f ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:text-wire-text'].join(' ')}>
                {f} <span className={filter === f ? 'text-brand/70' : 'text-wire-faint'}>{counts[f]}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map(({ img, skuName }) => {
              const v = verdicts[img.id];
              return (
                <div key={img.id} className={['overflow-hidden rounded-lg border bg-wire-surface', v === 'approved' ? 'border-ok ring-1 ring-ok' : v === 'rejected' ? 'border-danger ring-1 ring-danger' : 'border-wire-border'].join(' ')}>
                  <div className="relative aspect-[3/4] bg-wire-bg-2">
                    <img src={img.url} alt={img.prompt} loading="lazy" className="h-full w-full object-cover" />
                    {v ? (
                      <span className={['absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white', v === 'approved' ? 'bg-ok' : 'bg-danger'].join(' ')}>{v === 'approved' ? 'Approved' : 'Rejected'}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-wire-border p-2">
                    <span className="truncate text-[11px] text-wire-muted" title={skuName}>{skuName}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setVerdict(img.id, 'rejected')} title="Reject" className={['grid h-7 w-7 place-items-center rounded-md border', v === 'rejected' ? 'border-danger bg-danger text-white' : 'border-wire-border text-wire-muted hover:text-danger'].join(' ')}>{ico('M18 6 6 18M6 6l12 12', 14)}</button>
                      <button type="button" onClick={() => setVerdict(img.id, 'approved')} title="Approve" className={['grid h-7 w-7 place-items-center rounded-md border', v === 'approved' ? 'border-ok bg-ok text-white' : 'border-wire-border text-wire-muted hover:text-ok'].join(' ')}>{ico('M20 6 9 17l-5-5', 14)}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
