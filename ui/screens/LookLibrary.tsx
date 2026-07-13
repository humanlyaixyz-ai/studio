import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';
import { listLooks, deleteLook, setEditingLook, type Look } from '../data/looks';

/**
 * Look Library — REAL, persisted Looks (JSON docs via dbService). A Look = a reusable preset
 * (service type, background, mood, lighting, tags). Create/open/delete. Shell = AppShell.
 */

const sic = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);
const STAR = 'M12 3l2.6 5.6L20.5 9l-4.2 4 1 6L12 20l-5.3 -1 1-6L3.5 9l5.9-.4z';

const FILTERS = ['All', 'E-Commerce', 'Lifestyle', 'Editorial', 'Campaign', 'Social Media', 'Marketplace'];

const SWATCHES: Record<string, string[]> = {
  Minimal: ['#f4f4f5', '#d4d4d8', '#a1a1aa', '#71717a'],
  Warm: ['#fde68a', '#fbbf24', '#d97706', '#92400e'],
  Moody: ['#e4e4e7', '#71717a', '#3f3f46', '#18181b'],
  Bold: ['#bfdbfe', '#3b82f6', '#1d4ed8', '#1e1b4b'],
  Neutral: ['#fafaf9', '#e7e5e4', '#a8a29e', '#57534e'],
  Bright: ['#bbf7d0', '#4ade80', '#eab308', '#f97316'],
  Dramatic: ['#e5e7eb', '#6b7280', '#374151', '#030712'],
};

export default function LookLibrary() {
  const navigate = useNavigate();
  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');

  const reload = () => { setLoading(true); listLooks().then(setLooks).finally(() => setLoading(false)); };
  useEffect(() => { reload(); }, []);

  const create = () => { setEditingLook(null); navigate(ROUTES.lookEditor); };
  const open = (id: string) => { setEditingLook(id); navigate(ROUTES.lookEditor); };
  const remove = async (l: Look) => {
    if (!window.confirm(`Delete Look “${l.name || 'Untitled'}”?`)) return;
    setLooks((prev) => prev.filter((x) => x.id !== l.id));
    await deleteLook(l.id).catch(() => reload());
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return looks
      .filter((l) => type === 'All' || l.serviceType === type)
      .filter((l) => !q || l.name.toLowerCase().includes(q) || (l.tags || []).some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [looks, query, type]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-wire-text">Looks</h2>
          <p className="mt-1 text-sm text-wire-muted">Reusable presets — background, mood, lighting and colour. Attach a Look to a Service Type.</p>
        </div>
        <Button onClick={create}>+ New Look</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-lg bg-wire-bg-2" />)}</div>
      ) : looks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-20 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-weak text-brand">{sic(STAR)}</div>
          <p className="text-base font-semibold text-wire-text">No Looks yet</p>
          <p className="max-w-md text-sm text-wire-muted">A Look is a reusable preset — background, mood, lighting and colour — that you attach to a Service Type.</p>
          <div className="mt-2"><Button onClick={create}>+ New Look</Button></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <label className="flex h-9 w-80 items-center gap-2 rounded-md border border-wire-border bg-wire-surface px-3 focus-within:border-brand">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-wire-faint" aria-hidden><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted" placeholder="Search Looks…" />
              {query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-wire-faint hover:text-wire-text">✕</button> : null}
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((s) => (
              <button key={s} type="button" onClick={() => setType(s)} className={['rounded-full border px-3 py-1 text-xs font-medium', type === s ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:border-wire-border-strong hover:text-wire-text'].join(' ')}>{s}</button>
            ))}
          </div>

          {list.length === 0 ? (
            <div className="rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-16 text-center text-sm text-wire-muted">No matching Looks.</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {list.map((l) => (
                <div key={l.id} className="group overflow-hidden rounded-lg border border-wire-border bg-wire-surface transition-all hover:border-wire-border-strong hover:shadow-card">
                  <button type="button" onClick={() => open(l.id)} className="relative flex h-40 w-full items-center justify-center border-b border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg">
                    <span className="text-xs text-wire-faint">{l.background} · {l.backgroundValue}</span>
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {(SWATCHES[l.mood] || SWATCHES.Minimal).map((c, i) => (
                        <span key={i} className="h-4 w-4 rounded-sm border border-wire-border" style={{ backgroundColor: c }} aria-hidden />
                      ))}
                    </div>
                  </button>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <button type="button" onClick={() => open(l.id)} className="truncate text-left text-sm font-semibold text-wire-text hover:text-brand">{l.name || 'Untitled Look'}</button>
                      <span className="shrink-0 rounded-full border border-brand-weak-2 bg-brand-weak px-2 py-0.5 text-[10px] font-medium text-brand">{l.serviceType}</span>
                    </div>
                    <p className="mt-1 text-xs text-wire-muted">{l.mood} · {l.lighting}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {(l.tags || []).slice(0, 3).map((t) => <span key={t} className="rounded-full border border-wire-border px-2 py-0.5 text-[11px] text-wire-muted">{t}</span>)}
                      </div>
                      <button type="button" onClick={() => remove(l)} aria-label="Delete Look" className="text-wire-faint hover:text-danger">{sic('M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14')}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function LookLibraryEmpty() {
  return <LookLibrary />;
}
