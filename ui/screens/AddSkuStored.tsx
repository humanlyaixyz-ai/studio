import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button, Pill } from '../kit';

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

type Row = { name: string; images: number; front: boolean; back: boolean; detail: boolean };

const ROWS: Row[] = [
  { name: 'SKU 001', images: 6, front: true, back: true, detail: true },
  { name: 'SKU 002', images: 5, front: true, back: true, detail: true },
  { name: 'SKU 003', images: 4, front: true, back: true, detail: false },
  { name: 'SKU 004', images: 4, front: true, back: false, detail: true },
  { name: 'SKU 005', images: 3, front: true, back: false, detail: false },
  { name: 'SKU 006', images: 6, front: true, back: true, detail: true },
];

const UNGROUPED = 5;

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

function SkuTypeCard({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-wire-muted">SKU Type</p>
          <p className="mt-1 text-base font-semibold text-wire-text">Fashion → Top</p>
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

function StoredScreen({ empty }: { empty: boolean }) {
  const navigate = useNavigate();
  const prepare = () => navigate(ROUTES.prepareSku);
  const group = () => navigate(ROUTES.groupSku);

  const readyCount = ROWS.filter((r) => missingAngles(r).length === 0).length;
  const attention = ROWS.length - readyCount;

  return (
    <div className="space-y-6">
      {/* 1 — Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Add SKUs</h2>
        <p className="mt-1 text-sm text-wire-muted">Confirm each SKU has the angles this project needs.</p>
      </div>

      {/* 2 — SKU Type card (with required angles) */}
      <SkuTypeCard onEdit={() => navigate(ROUTES.addSku)} />

      {empty ? (
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
          {/* critical — ungrouped images (must be resolved before continuing) */}
          {UNGROUPED > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-danger bg-danger-weak p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-danger text-sm font-semibold text-white">!</span>
                <div>
                  <p className="text-sm font-semibold text-wire-text">Action needed · {UNGROUPED} ungrouped images</p>
                  <p className="text-xs text-wire-muted">These images couldn&rsquo;t be grouped into a SKU. Group or archive them before you continue.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={group}>Group images</Button>
                <Button variant="secondary" size="sm">Archive all</Button>
              </div>
            </div>
          ) : null}

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
              {readyCount} of {ROWS.length} ready · <span className="font-medium text-warn">{attention} need attention</span> · {UNGROUPED} ungrouped images
            </p>

            {/* 4 — controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex h-9 w-80 items-center gap-2 rounded-md border border-wire-border bg-wire-bg px-3">
                <span className="text-wire-muted">{ico('M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3', 16)}</span>
                <span className="text-sm text-wire-muted">Search SKU by code or name…</span>
              </div>
              <div className="flex items-center gap-2">
                {['All', 'Ready to use', 'Needs attention', 'Archived'].map((f, i) => (
                  <span key={f} className={['cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors', i === 0 ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:text-wire-text'].join(' ')}>{f}</span>
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
                <div className="w-40 text-right">Action</div>
              </div>
              {ROWS.map((r) => {
                const missing = missingAngles(r);
                const ready = missing.length === 0;
                const fixLabel = missing.length === 1 ? `Fix · add ${missing[0]}` : `Fix · ${missing.length} angles`;
                return (
                  <div key={r.name} className={['flex items-center border-t border-wire-border px-4 py-3', ready ? '' : 'bg-danger-weak/40'].join(' ')}>
                    <div className="flex flex-1 items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-md border border-wire-border bg-wire-bg text-wire-faint" aria-hidden>
                        {ico('M3 3h18v18H3zM3 15l5-5 4 4 3-3 6 6', 16)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-wire-text">{r.name}</p>
                        <p className="text-xs text-wire-muted">Top</p>
                      </div>
                    </div>
                    <div className="w-20 text-sm text-wire-text">{r.images}</div>
                    <div className="flex w-72 items-center gap-4 text-sm">
                      <Angle label="Front" on={r.front} />
                      <Angle label="Back" on={r.back} />
                      <Angle label="Detail" on={r.detail} />
                    </div>
                    <div className="w-44 text-sm">
                      {ready ? (
                        <Pill tone="ok">Ready to use</Pill>
                      ) : (
                        <span className="font-medium text-danger">Missing: {missing.join(', ')}</span>
                      )}
                    </div>
                    <div className="flex w-40 justify-end">
                      {ready ? (
                        <Button variant="secondary" size="sm" onClick={prepare}>View images</Button>
                      ) : (
                        <Button size="sm" onClick={prepare}>{fixLabel}</Button>
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
