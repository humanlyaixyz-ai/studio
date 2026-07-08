import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';

/**
 * Look Library — hi-fi build of LookLibraryWireframe.
 * A Look = a reusable preset (references + background + mood + colour) bound to one Service Type.
 * Two states: populated grid and empty first-run. Shell is provided by AppShell.
 */

const sic = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const GRID = 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z';
const LIST = 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01';
const STAR = 'M12 3l2.6 5.6L20.5 9l-4.2 4 1 6L12 20l-5.3 -1 1-6L3.5 9l5.9-.4z';

const SERVICE_TYPES = ['All', 'E-Commerce', 'Lifestyle', 'Editorial', 'Campaign', 'Social Media', 'Marketplace'];

type Look = {
  name: string;
  type: string;
  refs: number;
  bg: 'Studio' | 'Environment';
  tags: string[];
  used: number;
};

const LOOKS: Look[] = [
  { name: 'Clean Studio — Tops', type: 'E-Commerce', refs: 4, bg: 'Studio', tags: ['Minimal', 'Soft light'], used: 3 },
  { name: 'Sunlit Street', type: 'Lifestyle', refs: 6, bg: 'Environment', tags: ['Warm', 'Golden hour'], used: 1 },
  { name: 'Editorial Noir', type: 'Editorial', refs: 5, bg: 'Studio', tags: ['High contrast', 'Moody'], used: 2 },
  { name: 'Campaign Hero', type: 'Campaign', refs: 8, bg: 'Environment', tags: ['Bold', 'Dramatic'], used: 0 },
  { name: 'Soft Daylight', type: 'E-Commerce', refs: 3, bg: 'Studio', tags: ['Neutral', 'Even'], used: 5 },
  { name: 'Feed Ready', type: 'Social Media', refs: 4, bg: 'Studio', tags: ['Bright', 'Punchy'], used: 1 },
];

type SortKey = 'recent' | 'name' | 'used';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'used', label: 'Most used' },
];

function LookCard({ look, onOpen }: { look: Look; onOpen?: () => void }) {
  return (
    <div className="group overflow-hidden rounded-lg border border-wire-border bg-wire-surface transition-all hover:border-wire-border-strong hover:shadow-card">
      {/* cover */}
      <div
        onClick={onOpen}
        className="relative flex h-40 cursor-pointer items-center justify-center border-b border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg"
      >
        <span className="text-xs text-wire-faint">Look preview</span>
        <button type="button" aria-label="More options" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-wire-border bg-wire-surface/80 text-wire-muted backdrop-blur hover:text-brand">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
        </button>
        {/* colour palette mini-swatches */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {['#e4e4e7', '#a1a1aa', '#71717a', '#3f3f46'].map((c, i) => (
            <span key={i} className="h-4 w-4 rounded-sm border border-wire-border" style={{ backgroundColor: c }} aria-hidden />
          ))}
        </div>
      </div>
      {/* body */}
      <div onClick={onOpen} className="cursor-pointer p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-wire-text">{look.name}</p>
          <span className="shrink-0 rounded-full border border-brand-weak-2 bg-brand-weak px-2 py-0.5 text-[10px] font-medium text-brand">{look.type}</span>
        </div>
        <p className="mt-1 text-xs text-wire-muted">
          {look.refs} references · {look.bg} · {look.used > 0 ? `Used in ${look.used} project${look.used > 1 ? 's' : ''}` : 'Not used yet'}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {look.tags.map((t) => (
            <span key={t} className="rounded-full border border-wire-border px-2 py-0.5 text-[11px] text-wire-muted">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LookRow({ look, onOpen }: { look: Look; onOpen?: () => void }) {
  return (
    <div onClick={onOpen} className="flex cursor-pointer items-center gap-4 rounded-lg border border-wire-border bg-wire-surface px-4 py-3 transition-all hover:border-wire-border-strong hover:shadow-card">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-gradient-to-br from-wire-bg-2 to-wire-bg text-[10px] text-wire-faint">Look</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-wire-text">{look.name}</p>
        <p className="mt-0.5 text-xs text-wire-muted">{look.refs} references · {look.bg} · {look.used > 0 ? `Used in ${look.used}` : 'Not used yet'}</p>
      </div>
      <span className="shrink-0 rounded-full border border-brand-weak-2 bg-brand-weak px-2 py-0.5 text-[10px] font-medium text-brand">{look.type}</span>
    </div>
  );
}

function PageHeading({ onNew }: { onNew?: () => void }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Looks</h2>
        <p className="mt-1 text-sm text-wire-muted">
          Reusable presets — references, background, mood and colour. Attach a Look to a Service Type.
        </p>
      </div>
      <Button onClick={onNew}>+ New Look</Button>
    </div>
  );
}

function LookLibraryBase({ empty }: { empty: boolean }) {
  const navigate = useNavigate();
  const openEditor = () => navigate(ROUTES.lookEditor);

  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const [sort, setSort] = useState<SortKey>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = LOOKS.filter((l) => type === 'All' || l.type === type);
    if (q) out = out.filter((l) => l.name.toLowerCase().includes(q) || l.tags.some((t) => t.toLowerCase().includes(q)));
    out = [...out].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'used') return b.used - a.used;
      return 0;
    });
    return out;
  }, [query, type, sort]);

  return (
    <div className="mx-auto max-w-6xl space-y-6" onClick={() => setSortOpen(false)}>
      <PageHeading onNew={openEditor} />

      {empty ? (
        /* ---------- empty first-run state ---------- */
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-20 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-weak text-brand">{sic(STAR)}</div>
          <p className="text-base font-semibold text-wire-text">No Looks yet</p>
          <p className="max-w-md text-sm text-wire-muted">
            A Look is a reusable preset — references, background, mood and colour — that you attach to a Service Type.
            Create one here, or build one inside a Service Type and save it to the library.
          </p>
          <div className="mt-2">
            <Button onClick={openEditor}>+ New Look</Button>
          </div>
        </div>
      ) : (
        <>
          {/* toolbar: search + sort */}
          <div className="flex items-center justify-between">
            <label className="flex h-9 w-80 items-center gap-2 rounded-md border border-wire-border bg-wire-surface px-3 focus-within:border-brand">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-wire-faint" aria-hidden><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted"
                placeholder="Search Looks…"
              />
              {query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-wire-faint hover:text-wire-text">✕</button> : null}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" size="sm" onClick={() => setSortOpen((v) => !v)}>Sort: {SORTS.find((s) => s.key === sort)!.label} ▾</Button>
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

          {/* Service Type filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {SERVICE_TYPES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setType(s)}
                className={['rounded-full border px-3 py-1 text-xs font-medium', type === s ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:border-wire-border-strong hover:text-wire-text'].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>

          {/* grid / list / empty */}
          {list.length > 0 ? (
            view === 'grid' ? (
              <div className="grid grid-cols-3 gap-4">
                {list.map((l) => <LookCard key={l.name} look={l} onOpen={openEditor} />)}
              </div>
            ) : (
              <div className="space-y-2">
                {list.map((l) => <LookRow key={l.name} look={l} onOpen={openEditor} />)}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-16 text-center">
              <p className="text-base font-semibold text-wire-text">No matching Looks</p>
              <p className="text-sm text-wire-muted">Try a different search or Service Type filter.</p>
              <div className="mt-2 flex gap-2">
                {query ? <Button variant="secondary" size="sm" onClick={() => setQuery('')}>Clear search</Button> : null}
                {type !== 'All' ? <Button variant="secondary" size="sm" onClick={() => setType('All')}>All types</Button> : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LookLibrary() {
  return <LookLibraryBase empty={false} />;
}

export function LookLibraryEmpty() {
  return <LookLibraryBase empty />;
}
