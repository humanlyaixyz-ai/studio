import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button, Pill } from '../kit';
import { useSkus, hasAngle } from '../data/skus';
import { useProjects } from '../data/projects';

/**
 * Add SKUs — Stored state (hi-fi build of AddSkuStoredWireframe).
 * SKU validation table: confirm each SKU has the project's required angles (Front / Back / Detail).
 * A missing angle is the loudest thing in its row; Status names the gap; Action is targeted.
 * Reading order: header → SKU Type card → ungrouped callout → table → footer actions.
 */

const ico = (d: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const REQUIRED = ['Front', 'Back', 'Detail'] as const;

type Row = { id: string; name: string; images: number; front: boolean; back: boolean; detail: boolean; thumbUrl?: string; archived?: boolean };

const FILTERS = ['All', 'Ready to use', 'Needs attention', 'Archived'] as const;
type Filter = (typeof FILTERS)[number];

function missingAngles(r: Row): string[] {
  const m: string[] = [];
  if (!r.front) m.push('Front');
  if (!r.back) m.push('Back');
  if (!r.detail) m.push('Detail');
  return m;
}

/** One required angle — present is quiet (ok tick), missing is the loudest item (bold danger). */
function Angle({ label, on }: { label: string; on: boolean }) {
  return on ? (
    <span className="flex items-center gap-1.5 text-wire-muted">
      <span className="grid h-4 w-4 place-items-center rounded-full bg-ok-weak text-ok">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
      </span>
      {label}
    </span>
  ) : (
    <span className="flex items-center gap-1.5 font-semibold text-danger">
      <span className="grid h-4 w-4 place-items-center rounded-full bg-danger-weak text-danger text-[10px] font-bold">!</span>
      {label}
    </span>
  );
}

function SkuTypeCard({ onEdit, category }: { onEdit: () => void; category: string }) {
  return (
    <div className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-wire-muted">SKU Type</p>
          <p className="mt-1 text-base font-semibold text-wire-text">{category}</p>
          <p className="mt-1 text-xs text-wire-muted">This project accepts only this SKU type.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          {ico('M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z', 15)} Edit
        </Button>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-wire-border pt-3">
        <span className="text-xs font-medium uppercase tracking-wide text-wire-muted">Required angles</span>
        <div className="flex items-center gap-2">
          {REQUIRED.map((a) => (
            <Pill key={a} tone="brand">{a}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

function StoredScreen({ empty: forceEmpty }: { empty: boolean }) {
  const navigate = useNavigate();
  const { skus, loading, error, remove } = useSkus();
  const { projects, selectedId } = useProjects();
  const category = projects.find((p) => p.id === selectedId)?.category ?? 'Not set';
  const prepare = () => navigate(ROUTES.prepareSku);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const ungrouped = 0; // real uploads land as SKUs directly — no ungrouped bucket yet

  const rows = useMemo<Row[]>(
    () => skus.map((s) => ({
      id: s.id,
      name: s.name,
      images: s.slotKeys.length,
      front: hasAngle(s.slotKeys, 'front'),
      back: hasAngle(s.slotKeys, 'back'),
      detail: hasAngle(s.slotKeys, 'detail'),
      thumbUrl: s.thumbUrl,
      archived: archived.has(s.id),
    })),
    [skus, archived],
  );

  const empty = forceEmpty || (!loading && rows.length === 0);

  const active = rows.filter((r) => !r.archived);
  const readyCount = active.filter((r) => missingAngles(r).length === 0).length;
  const attention = active.length - readyCount;

  const shownRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      const ready = missingAngles(r).length === 0;
      if (filter === 'Ready to use') return !r.archived && ready;
      if (filter === 'Needs attention') return !r.archived && !ready;
      if (filter === 'Archived') return !!r.archived;
      return !r.archived; // All
    });
  }, [rows, query, filter]);

  const count = (f: Filter) =>
    f === 'All' ? active.length
    : f === 'Ready to use' ? readyCount
    : f === 'Needs attention' ? attention
    : rows.filter((r) => r.archived).length;

  const archiveRow = (id: string) => setArchived((prev) => new Set(prev).add(id));
  const restoreRow = (id: string) => setArchived((prev) => { const n = new Set(prev); n.delete(id); return n; });
  const deleteRow = (id: string, name: string) => { if (window.confirm(`Delete “${name}”? This removes its images too.`)) remove(id); };

  return (
    <div className="space-y-6">
      {/* 1 — Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Add SKUs</h2>
        <p className="mt-1 text-sm text-wire-muted">Confirm each SKU has the angles this project needs.</p>
      </div>

      {/* 2 — SKU Type card (with required angles) */}
      <SkuTypeCard onEdit={() => navigate(ROUTES.addSku)} category={category} />

      {error ? (
        <div className="rounded-lg border border-danger/40 bg-danger-weak px-4 py-3 text-sm text-wire-text">
          <span className="font-semibold text-danger">Upload failed:</span> {error}
          <span className="mt-1 block text-xs text-wire-muted">Image uploads to storage were rejected. A Supabase Storage policy must allow the anon key to write to the <code>project-assets</code> bucket.</span>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
          <div className="h-4 w-40 animate-pulse rounded bg-wire-bg-2" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-wire-bg-2" />
            ))}
          </div>
        </div>
      ) : empty ? (
        /* ---------- empty state ---------- */
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-20 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-weak text-brand">
            {ico('M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', 22)}
          </span>
          <p className="text-base font-semibold text-wire-text">No SKUs yet</p>
          <p className="max-w-md text-sm text-wire-muted">Upload your product images and we&rsquo;ll group them into SKUs by name.</p>
          <Button className="mt-2" onClick={() => navigate(ROUTES.addSku)}>
            {ico('M12 16V4M7 9l5-5 5 5M4 20h16', 16)} Upload more
          </Button>
        </div>
      ) : (
        <>
          {/* table card */}
          <div className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
            {/* header + actions */}
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-wire-text">Prepared SKUs</p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">Upload more</Button>
                <Button size="sm" onClick={prepare}>Prepare SKU</Button>
              </div>
            </div>

            {/* 3 — readiness summary */}
            <p className="mt-1 text-xs text-wire-muted">
              {readyCount} of {active.length} ready · <span className="font-medium text-warn">{attention} need attention</span> · {ungrouped} ungrouped images
            </p>

            {/* 4 — controls */}
            <div className="mt-4 flex items-center justify-between">
              <label className="flex h-9 w-80 items-center gap-2 rounded-md border border-wire-border bg-wire-bg px-3 focus-within:border-brand">
                <span className="text-wire-muted">{ico('M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3', 16)}</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted"
                  placeholder="Search SKU by code or name…"
                />
                {query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-wire-faint hover:text-wire-text">✕</button> : null}
              </label>
              <div className="flex items-center gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={['rounded-md border px-3 py-1.5 text-xs font-medium transition-colors', filter === f ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:text-wire-text'].join(' ')}
                  >
                    {f} <span className={filter === f ? 'text-brand/70' : 'text-wire-faint'}>{count(f)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5 — table */}
            <div className="mt-4 overflow-hidden rounded-md border border-wire-border">
              <div className="flex items-center bg-wire-bg px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-wire-muted">
                <div className="flex-1">SKU</div>
                <div className="w-20">Images</div>
                <div className="w-72">Required angles</div>
                <div className="w-44">Status</div>
                <div className="w-48 text-right">Action</div>
              </div>
              {shownRows.length === 0 ? (
                <div className="border-t border-wire-border px-4 py-10 text-center text-sm text-wire-muted">
                  No SKUs match {query ? `“${query}”` : `“${filter}”`}.
                </div>
              ) : null}
              {shownRows.map((r) => {
                const missing = missingAngles(r);
                const ready = missing.length === 0;
                const fixLabel = missing.length === 1 ? `Fix · add ${missing[0]}` : `Fix · ${missing.length} angles`;
                return (
                  <div key={r.id} className={['flex items-center border-t border-wire-border px-4 py-3', r.archived ? 'opacity-60' : ready ? '' : 'bg-danger-weak/40'].join(' ')}>
                    <div className="flex flex-1 items-center gap-3">
                      {r.thumbUrl ? (
                        <img src={r.thumbUrl} alt={r.name} className="h-9 w-9 shrink-0 rounded-md border border-wire-border object-cover" />
                      ) : (
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-wire-border bg-wire-bg text-wire-faint" aria-hidden>
                          {ico('M3 3h18v18H3zM3 15l5-5 4 4 3-3 6 6', 16)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-wire-text">{r.name}</p>
                        <p className="text-xs text-wire-muted">{category}</p>
                      </div>
                    </div>
                    <div className="w-20 text-sm text-wire-text">{r.images}</div>
                    <div className="flex w-72 items-center gap-4 text-sm">
                      <Angle label="Front" on={r.front} />
                      <Angle label="Back" on={r.back} />
                      <Angle label="Detail" on={r.detail} />
                    </div>
                    <div className="w-44 text-sm">
                      {r.archived ? (
                        <Pill tone="neutral">Archived</Pill>
                      ) : ready ? (
                        <Pill tone="ok">Ready to use</Pill>
                      ) : (
                        <span className="font-medium text-danger">Missing: {missing.join(', ')}</span>
                      )}
                    </div>
                    <div className="flex w-48 items-center justify-end gap-2">
                      {r.archived ? (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => restoreRow(r.id)}>Restore</Button>
                          <button type="button" onClick={() => deleteRow(r.id, r.name)} aria-label={`Delete ${r.name}`} title="Delete permanently" className="grid h-8 w-8 place-items-center rounded-md border border-wire-border text-wire-muted hover:text-danger">
                            {ico('M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14', 15)}
                          </button>
                        </>
                      ) : (
                        <>
                          {ready ? (
                            <Button variant="secondary" size="sm" onClick={prepare}>View images</Button>
                          ) : (
                            <Button size="sm" onClick={prepare}>{fixLabel}</Button>
                          )}
                          <button type="button" onClick={() => archiveRow(r.id)} aria-label={`Archive ${r.name}`} title="Archive" className="grid h-8 w-8 place-items-center rounded-md border border-wire-border text-wire-muted hover:text-danger">
                            {ico('M3 7h18v4H3zM5 11v9h14v-9M10 15h4', 15)}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-wire-border pt-5">
        <Button variant="ghost" onClick={() => navigate(ROUTES.addSku)}>
          {ico('M15 18l-6-6 6-6', 16)} Go back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary">Save draft</Button>
          <Button disabled={empty} onClick={() => navigate(ROUTES.serviceSetup)}>Continue to Service Setup</Button>
        </div>
      </div>
    </div>
  );
}

export default function AddSkuStored() {
  return <StoredScreen empty={false} />;
}

export function AddSkuStoredEmpty() {
  return <StoredScreen empty />;
}
