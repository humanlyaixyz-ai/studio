import { useEffect, useMemo, useState } from 'react';
import { Button } from '../kit';
import { useProjects } from '../data/projects';
import * as db from '../../services/dbService';
import type { AllAsset } from '../../services/dbService';

/**
 * Assets Library — REAL, read-only view of every asset uploaded across all projects
 * (db.loadAllAssets over project_assets, public thumbnails). Type derives from slot_key.
 * Search + type filter + grid/list + preview lightbox with download. Shell = AppShell.
 */

const sic = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);
const GRID = 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z';
const LIST = 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01';
const IMAGE = 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5';

type AssetType = 'Backdrop' | 'Face' | 'Product';
const SLOT_LABELS: Record<string, string> = {
  characterFace: 'Character Face', topFront: 'Top (Front)', topBack: 'Top (Back)',
  bottomFront: 'Bottom (Front)', bottomBack: 'Bottom (Back)', drape: 'Drape', blouse: 'Blouse',
  shoes: 'Shoes', accessories: 'Accessories', sunglasses: 'Sunglasses', background: 'Background', productImage: 'Product Image',
};
const typeOf = (slotKey: string): AssetType => slotKey === 'background' ? 'Backdrop' : slotKey === 'characterFace' ? 'Face' : 'Product';

type Row = AllAsset & { type: AssetType; label: string; project: string };

const FILTERS: { label: string; type?: AssetType }[] = [
  { label: 'All' }, { label: 'Products', type: 'Product' }, { label: 'Backdrops', type: 'Backdrop' }, { label: 'Faces', type: 'Face' },
];

export default function AssetsLibrary() {
  const { projects } = useProjects();
  const [assets, setAssets] = useState<AllAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [preview, setPreview] = useState<Row | null>(null);

  useEffect(() => {
    let cancelled = false;
    db.loadAllAssets().then((rows) => { if (!cancelled) setAssets(rows); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const projName = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const rows = useMemo<Row[]>(
    () => assets.map((a) => ({ ...a, type: typeOf(a.slotKey), label: SLOT_LABELS[a.slotKey] || a.slotKey, project: projName.get(a.projectId) || 'Project' })),
    [assets, projName],
  );

  const list = useMemo(() => {
    const active = FILTERS.find((f) => f.label === filter);
    const q = query.trim().toLowerCase();
    return rows.filter((a) => (active?.type ? a.type === active.type : true) && (q ? (a.label.toLowerCase().includes(q) || a.project.toLowerCase().includes(q)) : true));
  }, [rows, filter, query]);

  const counts = useMemo(() => ({
    All: rows.length, Products: rows.filter((r) => r.type === 'Product').length,
    Backdrops: rows.filter((r) => r.type === 'Backdrop').length, Faces: rows.filter((r) => r.type === 'Face').length,
  }), [rows]);

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-wire-text">Assets Library</h2>
            <p className="mt-1 text-sm text-wire-muted">Every image uploaded across your projects — faces, products and backdrops.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-lg bg-wire-bg-2" />)}</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-20 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-weak text-brand">{sic(IMAGE)}</div>
            <p className="text-base font-semibold text-wire-text">No assets yet</p>
            <p className="max-w-md text-sm text-wire-muted">Upload images in a project’s Props &amp; Assets or SKU steps and they’ll appear here.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <label className="flex h-9 w-80 items-center gap-2 rounded-md border border-wire-border bg-wire-surface px-3 focus-within:border-brand">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-wire-faint" aria-hidden><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted" placeholder="Search by type or project…" />
                {query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-wire-faint hover:text-wire-text">✕</button> : null}
              </label>
              <div className="flex overflow-hidden rounded-md border border-wire-border">
                <button type="button" onClick={() => setView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'} className={['border-r border-wire-border px-2 py-1.5', view === 'grid' ? 'bg-brand-weak text-brand' : 'text-wire-muted hover:bg-wire-bg'].join(' ')}>{sic(GRID)}</button>
                <button type="button" onClick={() => setView('list')} aria-label="List view" aria-pressed={view === 'list'} className={['px-2 py-1.5', view === 'list' ? 'bg-brand-weak text-brand' : 'text-wire-muted hover:bg-wire-bg'].join(' ')}>{sic(LIST)}</button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => (
                <button key={f.label} type="button" onClick={() => setFilter(f.label)} className={['rounded-full border px-3 py-1 text-xs font-medium', filter === f.label ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:border-wire-border-strong hover:text-wire-text'].join(' ')}>
                  {f.label} <span className="text-wire-faint">{counts[f.label as keyof typeof counts]}</span>
                </button>
              ))}
            </div>

            {list.length === 0 ? (
              <div className="rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-16 text-center text-sm text-wire-muted">No matching assets.</div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-4 gap-4">
                {list.map((a) => (
                  <button key={a.id} type="button" onClick={() => setPreview(a)} className="overflow-hidden rounded-lg border border-wire-border bg-wire-surface text-left transition-all hover:border-wire-border-strong hover:shadow-card">
                    <div className="h-32 border-b border-wire-border bg-wire-bg-2"><img src={a.url} alt={a.label} loading="lazy" className="h-full w-full object-cover" /></div>
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold text-wire-text">{a.label}</p>
                      <p className="mt-1 truncate text-xs text-wire-muted">{a.type} · {a.project}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {list.map((a) => (
                  <button key={a.id} type="button" onClick={() => setPreview(a)} className="flex w-full items-center gap-4 rounded-lg border border-wire-border bg-wire-surface px-4 py-3 text-left transition-all hover:border-wire-border-strong hover:shadow-card">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-wire-bg-2"><img src={a.url} alt={a.label} loading="lazy" className="h-full w-full object-cover" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-wire-text">{a.label}</p>
                      <p className="mt-0.5 truncate text-xs text-wire-muted">{a.type} · {a.project}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {preview ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(24,24,27,0.55)' }} onClick={() => setPreview(null)}>
          <div className="flex w-full max-w-3xl overflow-hidden rounded-xl border border-wire-border bg-wire-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex min-h-[360px] flex-1 items-center justify-center bg-wire-bg-2"><img src={preview.url} alt={preview.label} className="max-h-[70vh] w-full object-contain" /></div>
            <div className="flex w-72 shrink-0 flex-col border-l border-wire-border p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-wire-text">{preview.label}</p>
                <button type="button" onClick={() => setPreview(null)} aria-label="Close" className="text-wire-muted hover:text-wire-text">✕</button>
              </div>
              <p className="mt-1 text-xs text-wire-muted">{preview.type}</p>
              <p className="mt-3 text-xs text-wire-muted">Project: {preview.project}</p>
              <div className="mt-auto flex flex-col gap-2 pt-4">
                <a href={preview.url} download target="_blank" rel="noopener" className="rounded-md bg-brand px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-hover">Download</a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AssetsLibraryEmpty() {
  return <AssetsLibrary />;
}
