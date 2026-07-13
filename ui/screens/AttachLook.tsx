import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button, Pill } from '../kit';
import { useProjects } from '../data/projects';
import { listLooks, setEditingLook, type Look } from '../data/looks';

/**
 * Attach a Look — REAL modal picker over Service Setup. Loads persisted Looks, lets you
 * pick one and attach it to the selected project (stored in localStorage per project so
 * Service Setup can read it). Create new → Look Editor. Shell rendered as an overlay.
 */

const SWATCHES: Record<string, string[]> = {
  Minimal: ['#f4f4f5', '#d4d4d8', '#a1a1aa', '#71717a'], Warm: ['#fde68a', '#fbbf24', '#d97706', '#92400e'],
  Moody: ['#e4e4e7', '#71717a', '#3f3f46', '#18181b'], Bold: ['#bfdbfe', '#3b82f6', '#1d4ed8', '#1e1b4b'],
  Neutral: ['#fafaf9', '#e7e5e4', '#a8a29e', '#57534e'], Bright: ['#bbf7d0', '#4ade80', '#eab308', '#f97316'],
  Dramatic: ['#e5e7eb', '#6b7280', '#374151', '#030712'],
};
const icon = (d: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

export const attachedLookKey = (projectId: string) => `ovarly.attachedLook.${projectId}`;

export default function AttachLook() {
  const navigate = useNavigate();
  const { selectedId, projects } = useProjects();
  const project = projects.find((p) => p.id === selectedId);
  const serviceType = 'E-Commerce';

  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'type' | 'all'>('type');
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => { listLooks().then(setLooks).finally(() => setLoading(false)); }, []);

  const close = () => navigate(ROUTES.serviceSetup);
  const createNew = () => { setEditingLook(null); navigate(ROUTES.lookEditor); };
  const attach = () => {
    if (selected && selectedId) { try { localStorage.setItem(attachedLookKey(selectedId), selected); } catch { /* ignore */ } }
    navigate(ROUTES.serviceSetup);
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return looks
      .filter((l) => (filter === 'all' ? true : l.serviceType === serviceType))
      .filter((l) => (q ? l.name.toLowerCase().includes(q) : true));
  }, [looks, filter, query]);

  const selectedLook = looks.find((l) => l.id === selected);

  return (
    <div onClick={close} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6">
      <div onClick={(e) => e.stopPropagation()} className="flex h-full max-h-[760px] w-full max-w-[1080px] flex-col overflow-hidden rounded-xl border border-wire-border bg-wire-surface shadow-pop">
        <div className="flex items-start justify-between border-b border-wire-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-wire-text">Attach a Look</h3>
            <p className="mt-1 text-sm text-wire-muted">for {project?.name || 'this project'} · choose a Look from your library, or create a new one.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-wire-muted transition-colors hover:bg-wire-bg hover:text-wire-text">{icon('M18 6L6 18M6 6l12 12', 16)}</button>
        </div>

        <div className="flex items-center justify-between border-b border-wire-border px-6 py-3">
          <label className="flex h-9 w-72 items-center gap-2 rounded-md border border-wire-border bg-wire-bg px-3 text-wire-muted focus-within:border-brand">
            {icon('M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3', 16)}
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted" placeholder="Search Looks…" />
            {query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-wire-faint hover:text-wire-text">✕</button> : null}
          </label>
          <div className="flex items-center gap-2">
            {(['type', 'all'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={['rounded-full border px-3 py-1.5 text-xs font-medium transition-colors', filter === f ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:border-wire-border-strong'].join(' ')}>{f === 'all' ? 'All Service Types' : serviceType}</button>
            ))}
          </div>
        </div>

        <div className="ov-scroll min-h-0 flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-lg bg-wire-bg-2" />)}</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <button type="button" onClick={createNew} className="group flex h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-wire-border bg-wire-surface text-center transition-colors hover:border-brand hover:bg-brand-weak/40">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-weak text-brand transition-colors group-hover:bg-brand group-hover:text-white">{icon('M12 5v14M5 12h14')}</span>
                <span className="text-sm font-semibold text-wire-text">Create new Look</span>
                <span className="text-xs text-wire-muted">Start fresh</span>
              </button>

              {list.map((l) => (
                <div key={l.id} onClick={() => setSelected(l.id)} className={['cursor-pointer overflow-hidden rounded-lg border bg-wire-surface transition-all', selected === l.id ? 'border-brand ring-2 ring-brand-weak shadow-card' : 'border-wire-border hover:border-wire-border-strong hover:shadow-card'].join(' ')}>
                  <div className="relative flex h-28 items-center justify-center border-b border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg">
                    <span className="text-xs text-wire-faint">{l.background} · {l.backgroundValue}</span>
                    <span className={['absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full border transition-colors', selected === l.id ? 'border-brand bg-brand text-white' : 'border-wire-border bg-wire-surface text-transparent'].join(' ')}>{icon('M20 6L9 17l-5-5', 12)}</span>
                    <div className="absolute bottom-2 left-2 flex gap-1">{(SWATCHES[l.mood] || SWATCHES.Minimal).map((c, i) => <span key={i} className="h-3.5 w-3.5 rounded-sm border border-wire-border" style={{ backgroundColor: c }} aria-hidden />)}</div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-wire-text">{l.name || 'Untitled Look'}</p>
                      <span className="shrink-0"><Pill>{l.serviceType}</Pill></span>
                    </div>
                    <p className="mt-1 text-xs text-wire-muted">{l.mood} · {l.lighting}</p>
                  </div>
                </div>
              ))}
              {list.length === 0 ? <p className="col-span-2 self-center text-sm text-wire-muted">No Looks yet — create one to attach.</p> : null}
            </div>
          )}
        </div>

        <div className="border-t border-wire-border px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-wire-muted">{selectedLook ? <>Selected: <span className="font-medium text-wire-text">{selectedLook.name || 'Untitled Look'}</span></> : 'Select a Look to attach'}</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={close}>Cancel</Button>
              <Button onClick={attach} disabled={!selected}>Attach Look</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
