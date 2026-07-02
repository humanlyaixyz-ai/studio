import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button, Pill } from '../kit';

/**
 * Attach a Look — hi-fi build of AttachLookWireframe.
 * Modal picker over Service Setup: bridges the global Look Library back into a
 * project's Service Type. Filtered to the Service Type by default.
 * Cancel / ✕ / scrim → Service Setup. Create new / Attach a copy → Look Editor.
 * Attach (snapshot) → Service Setup.
 */

type Look = {
  name: string;
  type: string;
  refs: number;
  bg: 'Studio' | 'Environment';
  swatches: string[];
};

const SERVICE_TYPE = 'E-Commerce';
const FILTERS = ['E-Commerce', 'All'];

const LOOKS: Look[] = [
  { name: 'Clean Studio — Tops', type: 'E-Commerce', refs: 4, bg: 'Studio', swatches: ['#ffffff', '#f1f0ec', '#c9c9cd', '#3f3f46'] },
  { name: 'Sunlit Street', type: 'Lifestyle', refs: 6, bg: 'Environment', swatches: ['#f4e6cf', '#e0b57d', '#c98a4b', '#7a4e28'] },
  { name: 'Editorial Noir', type: 'Editorial', refs: 5, bg: 'Studio', swatches: ['#e4e4e7', '#a1a1aa', '#52525b', '#18181b'] },
  { name: 'Campaign Hero', type: 'Campaign', refs: 8, bg: 'Environment', swatches: ['#dbe7f0', '#8fb3cc', '#4d7ea8', '#1f3a52'] },
  { name: 'Soft Daylight', type: 'E-Commerce', refs: 3, bg: 'Studio', swatches: ['#ffffff', '#f5f5f4', '#e7e5e4', '#d6d3d1'] },
  { name: 'Feed Ready', type: 'Social Media', refs: 4, bg: 'Studio', swatches: ['#fef3c7', '#fbbf77', '#f472b6', '#a855f7'] },
];

const icon = (d: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

function PickCard({ look, selected, onSelect }: { look: Look; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className={[
        'cursor-pointer overflow-hidden rounded-lg border bg-wire-surface transition-all',
        selected ? 'border-brand ring-2 ring-brand-weak shadow-card' : 'border-wire-border hover:border-wire-border-strong hover:shadow-card',
      ].join(' ')}
    >
      <div className="relative flex h-28 items-center justify-center border-b border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg">
        <span className="text-xs text-wire-faint">Look preview</span>
        <span
          className={[
            'absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full border transition-colors',
            selected ? 'border-brand bg-brand text-white' : 'border-wire-border bg-wire-surface text-transparent',
          ].join(' ')}
        >
          {icon('M20 6L9 17l-5-5', 12)}
        </span>
        <div className="absolute bottom-2 left-2 flex gap-1">
          {look.swatches.map((c, i) => (
            <span key={i} className="h-3.5 w-3.5 rounded-sm border border-wire-border" style={{ backgroundColor: c }} aria-hidden />
          ))}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-wire-text">{look.name}</p>
          <span className="shrink-0"><Pill>{look.type}</Pill></span>
        </div>
        <p className="mt-1 text-xs text-wire-muted">{look.refs} references · {look.bg}</p>
      </div>
    </div>
  );
}

export default function AttachLook() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(SERVICE_TYPE);
  const [selected, setSelected] = useState<string | null>(null);

  const list = filter === 'All' ? LOOKS : LOOKS.filter((l) => l.type === filter);
  const close = () => navigate(ROUTES.serviceSetup);
  const createNew = () => navigate(ROUTES.lookEditor);
  const attach = () => navigate(ROUTES.serviceSetup);
  const attachCopy = () => navigate(ROUTES.lookEditor);

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full max-h-[760px] w-full max-w-[1080px] flex-col overflow-hidden rounded-xl border border-wire-border bg-wire-surface shadow-pop"
      >
        {/* header */}
        <div className="flex items-start justify-between border-b border-wire-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-wire-text">Attach a Look</h3>
            <p className="mt-1 text-sm text-wire-muted">for {SERVICE_TYPE} · choose a Look from your library, or create a new one.</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-wire-muted transition-colors hover:bg-wire-bg hover:text-wire-text"
          >
            {icon('M18 6L6 18M6 6l12 12', 16)}
          </button>
        </div>

        {/* toolbar */}
        <div className="flex items-center justify-between border-b border-wire-border px-6 py-3">
          <div className="flex h-9 w-72 items-center gap-2 rounded-md border border-wire-border bg-wire-bg px-3 text-wire-muted">
            {icon('M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3', 16)}
            <span className="text-sm">Search Looks…</span>
          </div>
          <div className="flex items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={[
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === f ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:border-wire-border-strong',
                ].join(' ')}
              >
                {f === 'All' ? 'All Service Types' : f}
              </button>
            ))}
          </div>
        </div>

        {/* grid */}
        <div className="ov-scroll min-h-0 flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4">
            {/* create-new tile */}
            <button
              type="button"
              onClick={createNew}
              className="group flex h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-wire-border bg-wire-surface text-center transition-colors hover:border-brand hover:bg-brand-weak/40"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-weak text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                {icon('M12 5v14M5 12h14')}
              </span>
              <span className="text-sm font-semibold text-wire-text">Create new Look</span>
              <span className="text-xs text-wire-muted">Start fresh for {SERVICE_TYPE}</span>
            </button>

            {list.map((l) => (
              <PickCard key={l.name} look={l} selected={selected === l.name} onSelect={() => setSelected(l.name)} />
            ))}
          </div>
        </div>

        {/* footer */}
        <div className="border-t border-wire-border px-6 py-4">
          <p className="mb-2 text-[11px] text-wire-muted">
            <span className="font-medium text-wire-text">Attach</span> uses the Look as a snapshot (editable in-project later). <span className="font-medium text-wire-text">Attach a copy to tweak</span> opens it in the editor first.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-wire-muted">
              {selected ? <>Selected: <span className="font-medium text-wire-text">{selected}</span></> : 'Select a Look to attach'}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={close}>Cancel</Button>
              <Button variant="secondary" onClick={attachCopy} disabled={!selected}>Attach a copy to tweak</Button>
              <Button onClick={attach} disabled={!selected}>Attach Look</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
