import { useMemo, useState } from 'react';
import { Button } from '../kit';

/**
 * Assets Library — hi-fi build of AssetsLibraryWireframe.
 * Global store of reusable media (props, backdrops, brand imagery). Flat grid + type
 * filter + search. Empty + populated, with an Upload modal and an asset preview lightbox.
 * Shell is provided by AppShell.
 */

const sic = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const GRID = 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z';
const LIST = 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01';
const IMAGE = 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5';
const UPLOAD = 'M12 16V4M7 9l5-5 5 5M4 20h16';

type AssetType = 'Prop' | 'Backdrop' | 'Brand';
type Asset = { name: string; type: AssetType; meta: string; used: number };

const SEED: Asset[] = [
  { name: 'Marble tabletop', type: 'Backdrop', meta: '2400×1600', used: 4 },
  { name: 'Wooden stool', type: 'Prop', meta: '1800×1800', used: 2 },
  { name: 'Brand logo — white', type: 'Brand', meta: 'PNG · transparent', used: 9 },
  { name: 'Linen backdrop', type: 'Backdrop', meta: '3000×2000', used: 3 },
  { name: 'Glass vase', type: 'Prop', meta: '1600×1600', used: 1 },
  { name: 'Concrete surface', type: 'Backdrop', meta: '2400×1600', used: 5 },
  { name: 'Brand pattern', type: 'Brand', meta: 'PNG · tiled', used: 2 },
  { name: 'Potted plant', type: 'Prop', meta: '1800×1800', used: 0 },
];

const FILTERS: { label: string; type?: AssetType }[] = [
  { label: 'All' },
  { label: 'Props', type: 'Prop' },
  { label: 'Backdrops', type: 'Backdrop' },
  { label: 'Brand imagery', type: 'Brand' },
];

type SortKey = 'recent' | 'name' | 'used';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'used', label: 'Most used' },
];

function AssetCard({ a, onOpen, menuOpen, onMenu, onAction }: {
  a: Asset; onOpen: () => void; menuOpen: boolean; onMenu: (e: MouseEvent) => void; onAction: (x: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-wire-border bg-wire-surface transition-all hover:border-wire-border-strong hover:shadow-card">
      <div onClick={onOpen} className="relative flex h-32 cursor-pointer items-center justify-center border-b border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg">
        <span className="text-xs text-wire-faint">{a.type}</span>
        <div className="absolute right-2 top-2">
          <button type="button" onClick={onMenu} aria-label="More options" className="flex h-7 w-7 items-center justify-center rounded-full border border-wire-border bg-wire-surface/80 text-wire-muted backdrop-blur hover:text-brand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-8 z-10 w-36 rounded-md border border-wire-border bg-wire-surface py-1 shadow-pop" onClick={(e) => e.stopPropagation()}>
              {['Rename', 'Move', 'Delete'].map((x) => (
                <button key={x} type="button" onClick={() => onAction(x)} className={['block w-full px-3 py-2 text-left text-sm hover:bg-wire-bg', x === 'Delete' ? 'text-danger' : 'text-wire-text'].join(' ')}>{x}</button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div onClick={onOpen} className="cursor-pointer p-3">
        <p className="truncate text-sm font-semibold text-wire-text">{a.name}</p>
        <p className="mt-1 text-xs text-wire-muted">{a.type} · {a.meta} · {a.used > 0 ? `Used in ${a.used}` : 'Not used'}</p>
      </div>
    </div>
  );
}

function AssetRow({ a, onOpen, onDelete }: { a: Asset; onOpen: () => void; onDelete: () => void }) {
  return (
    <div onClick={onOpen} className="flex cursor-pointer items-center gap-4 rounded-lg border border-wire-border bg-wire-surface px-4 py-3 transition-all hover:border-wire-border-strong hover:shadow-card">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gradient-to-br from-wire-bg-2 to-wire-bg text-[10px] text-wire-faint">{a.type.slice(0, 3)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-wire-text">{a.name}</p>
        <p className="mt-0.5 text-xs text-wire-muted">{a.type} · {a.meta} · {a.used > 0 ? `Used in ${a.used}` : 'Not used'}</p>
      </div>
      <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded-md border border-wire-border px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger-weak">Delete</button>
    </div>
  );
}

function AssetsLibraryBase({ empty }: { empty: boolean }) {
  const [assets, setAssets] = useState<Asset[]>(SEED);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [menu, setMenu] = useState<string | null>(null);
  const [upload, setUpload] = useState(false);
  const [preview, setPreview] = useState<Asset | null>(null);

  const list = useMemo(() => {
    const active = FILTERS.find((f) => f.label === filter);
    const q = query.trim().toLowerCase();
    let out = assets.filter((a) => (active?.type ? a.type === active.type : true));
    if (q) out = out.filter((a) => a.name.toLowerCase().includes(q));
    out = [...out].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'used') return b.used - a.used;
      return 0;
    });
    return out;
  }, [assets, filter, query, sort]);

  const remove = (name: string) => {
    setAssets((prev) => prev.filter((a) => a.name !== name));
    setMenu(null);
    setPreview((p) => (p?.name === name ? null : p));
  };
  const rename = (name: string) => {
    const next = window.prompt('Rename asset', name);
    if (next && next.trim()) setAssets((prev) => prev.map((a) => (a.name === name ? { ...a, name: next.trim() } : a)));
    setMenu(null);
  };

  const closeMenus = () => { setMenu(null); setSortOpen(false); };

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6" onClick={closeMenus}>
        {/* heading */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-wire-text">Assets Library</h2>
            <p className="mt-1 text-sm text-wire-muted">Reusable media you can pull into any project — props, backdrops and brand imagery.</p>
          </div>
          <Button onClick={() => setUpload(true)}>Upload assets</Button>
        </div>

        {/* next update — canvas outputs will be added into the library */}
        <div className="flex items-center gap-3 rounded-lg border border-brand-weak-2 bg-brand-weak p-3">
          <span className="text-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
          </span>
          <p className="text-xs text-wire-text">Generated assets from the canvas will be added here.</p>
          <span className="ml-auto rounded-full border border-brand-weak-2 bg-wire-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">Coming soon</span>
        </div>

        {empty || assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-20 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-weak text-brand">{sic(IMAGE)}</div>
            <p className="text-base font-semibold text-wire-text">No assets yet</p>
            <p className="max-w-md text-sm text-wire-muted">Upload props, backdrops or brand imagery once and reuse them across any project.</p>
            <div className="mt-2"><Button onClick={() => setUpload(true)}>Upload assets</Button></div>
          </div>
        ) : (
          <>
            {/* toolbar */}
            <div className="flex items-center justify-between">
              <label className="flex h-9 w-80 items-center gap-2 rounded-md border border-wire-border bg-wire-surface px-3 focus-within:border-brand">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-wire-faint" aria-hidden><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted"
                  placeholder="Search assets…"
                />
                {query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-wire-faint hover:text-wire-text">✕</button> : null}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <Button variant="secondary" size="sm" onClick={() => { setSortOpen((v) => !v); setMenu(null); }}>Sort: {SORTS.find((s) => s.key === sort)!.label} ▾</Button>
                  {sortOpen ? (
                    <div className="absolute right-0 top-9 z-20 w-44 rounded-md border border-wire-border bg-wire-surface py-1 shadow-pop">
                      {SORTS.map((s) => (
                        <button key={s.key} type="button" onClick={() => { setSort(s.key); setSortOpen(false); }} className={['block w-full px-3 py-2 text-left text-sm hover:bg-wire-bg', sort === s.key ? 'font-semibold text-brand' : 'text-wire-text'].join(' ')}>{s.label}</button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex overflow-hidden rounded-md border border-wire-border">
                  <button type="button" onClick={() => setView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'} className={['border-r border-wire-border px-2 py-1.5', view === 'grid' ? 'bg-brand-weak text-brand' : 'text-wire-muted hover:bg-wire-bg'].join(' ')}>{sic(GRID)}</button>
                  <button type="button" onClick={() => setView('list')} aria-label="List view" aria-pressed={view === 'list'} className={['px-2 py-1.5', view === 'list' ? 'bg-brand-weak text-brand' : 'text-wire-muted hover:bg-wire-bg'].join(' ')}>{sic(LIST)}</button>
                </div>
              </div>
            </div>

            {/* type filter */}
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFilter(f.label)}
                  className={[
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    filter === f.label ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:border-wire-border-strong hover:text-wire-text',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* grid / list / empty */}
            {list.length > 0 ? (
              view === 'grid' ? (
                <div className="grid grid-cols-4 gap-4">
                  {list.map((a) => (
                    <AssetCard
                      key={a.name}
                      a={a}
                      onOpen={() => setPreview(a)}
                      menuOpen={menu === a.name}
                      onMenu={(e) => { e.stopPropagation(); setMenu(menu === a.name ? null : a.name); setSortOpen(false); }}
                      onAction={(x) => (x === 'Delete' ? remove(a.name) : x === 'Rename' ? rename(a.name) : setMenu(null))}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {list.map((a) => <AssetRow key={a.name} a={a} onOpen={() => setPreview(a)} onDelete={() => remove(a.name)} />)}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-16 text-center">
                <p className="text-base font-semibold text-wire-text">No matching assets</p>
                <p className="text-sm text-wire-muted">Try a different search or type filter.</p>
                <div className="mt-2 flex gap-2">
                  {query ? <Button variant="secondary" size="sm" onClick={() => setQuery('')}>Clear search</Button> : null}
                  {filter !== 'All' ? <Button variant="secondary" size="sm" onClick={() => setFilter('All')}>All types</Button> : null}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload modal */}
      {upload ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(24,24,27,0.45)' }} onClick={() => setUpload(false)}>
          <div className="w-full max-w-lg rounded-xl border border-wire-border bg-wire-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-wire-border px-5 py-4">
              <h3 className="text-lg font-semibold text-wire-text">Upload assets</h3>
              <button type="button" onClick={() => setUpload(false)} aria-label="Close" className="text-wire-muted hover:text-wire-text">✕</button>
            </div>
            <div className="space-y-4 p-5">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-wire-border bg-wire-bg px-6 py-10 text-center hover:border-brand">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-weak text-brand">{sic(UPLOAD)}</div>
                <p className="text-sm text-wire-text"><span className="font-medium text-brand underline">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-wire-muted">Images only · folders supported</p>
                <input type="file" multiple accept="image/*" className="hidden" onChange={() => setUpload(false)} />
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-wire-muted">Type:</span>
                {['Prop', 'Backdrop', 'Brand imagery'].map((t, i) => (
                  <span key={t} className={['rounded-full border px-3 py-1 text-xs font-medium', i === 0 ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border text-wire-muted'].join(' ')}>{t}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-wire-border px-5 py-4">
              <Button variant="secondary" onClick={() => setUpload(false)}>Cancel</Button>
              <Button onClick={() => setUpload(false)}>Upload</Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Asset preview lightbox */}
      {preview ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(24,24,27,0.55)' }} onClick={() => setPreview(null)}>
          <div className="flex w-full max-w-3xl overflow-hidden rounded-xl border border-wire-border bg-wire-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex min-h-[360px] flex-1 items-center justify-center bg-gradient-to-br from-wire-bg-2 to-wire-bg">
              <span className="text-xs text-wire-faint">{preview.type} preview</span>
            </div>
            <div className="flex w-72 shrink-0 flex-col border-l border-wire-border p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-wire-text">{preview.name}</p>
                <button type="button" onClick={() => setPreview(null)} aria-label="Close" className="text-wire-muted hover:text-wire-text">✕</button>
              </div>
              <p className="mt-1 text-xs text-wire-muted">{preview.type} · {preview.meta}</p>
              <p className="mt-3 text-xs text-wire-muted">{preview.used > 0 ? `Used in ${preview.used} project${preview.used > 1 ? 's' : ''}` : 'Not used in any project yet'}</p>
              <div className="mt-auto flex flex-col gap-2 pt-4">
                <Button>Download</Button>
                <Button variant="danger" onClick={() => remove(preview.name)}>Delete</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function AssetsLibrary() {
  return <AssetsLibraryBase empty={false} />;
}

export function AssetsLibraryEmpty() {
  return <AssetsLibraryBase empty />;
}
