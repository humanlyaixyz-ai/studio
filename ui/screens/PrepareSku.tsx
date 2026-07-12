import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';
import { useSkus, ANGLES, ANGLE_LABEL, hasAngle, angleUrl, type Angle } from '../data/skus';
import { useProjects } from '../data/projects';
import type { SkuSummary } from '../../services/dbService';

/**
 * Prepare SKUs — modal (hi-fi build of PrepareSkuWireframe), wired to REAL data.
 * Loads the selected project's SKUs and, per SKU, shows the required angles (Front / Back /
 * Detail): a real thumbnail where present, a dashed "missing" uploader where not. Clicking a
 * missing angle uploads a real image to that angle slot (Supabase Storage) and refreshes.
 * Centered modal over a dimmed scrim; ✕/Cancel + Done → /add-sku-stored.
 */

const ico = (d: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

function readFileAsBase64(file: File): Promise<{ name: string; data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => resolve({ name: file.name, data: (reader.result as string).split(',')[1], mimeType: file.type });
    reader.readAsDataURL(file);
  });
}

const missingAngles = (s: SkuSummary): Angle[] => ANGLES.filter((a) => !hasAngle(s.slotKeys, a));

type TagKind = 'required' | 'optional';
function pillClass(kind: TagKind) {
  return kind === 'required'
    ? 'border-transparent bg-brand text-white'
    : 'border border-wire-border bg-wire-surface text-wire-muted';
}

/** Real image tile — thumbnail + tag pill, or a dashed danger uploader for a missing angle. */
function AngleCard({
  url, tag, tagKind = 'optional', missing = false, missingLabel, busy = false, onUpload,
}: {
  url?: string; tag?: string; tagKind?: TagKind; missing?: boolean; missingLabel?: string; busy?: boolean; onUpload?: () => void;
}) {
  if (missing) {
    return (
      <div className="w-28">
        <button
          type="button"
          onClick={onUpload}
          disabled={busy}
          className="flex h-36 w-28 flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-danger bg-danger-weak text-center transition-colors hover:bg-danger-weak disabled:opacity-70"
        >
          {busy ? (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-danger/40 border-t-danger" aria-hidden />
          ) : (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-danger text-white">{ico('M12 16V4M7 9l5-5 5 5', 15)}</span>
          )}
          <span className="text-xs font-semibold text-danger">{missingLabel}</span>
          <span className="text-[10px] text-wire-muted">{busy ? 'Uploading…' : 'Click to upload'}</span>
        </button>
      </div>
    );
  }
  return (
    <div className="w-28">
      <div className="relative grid h-36 w-28 place-items-center overflow-hidden rounded-md border border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg">
        {url ? (
          <img src={url} alt={tag || 'SKU image'} className="h-full w-full object-cover" />
        ) : (
          <span className="text-wire-faint">{ico('M4 16l5-5 4 4 3-3 4 4M4 4h16v16H4z', 22)}</span>
        )}
        {tag ? (
          <span className={['absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', pillClass(tagKind)].join(' ')}>
            {tag}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function PrepareSku() {
  const navigate = useNavigate();
  const { skus, loading, error, uploading, addAngle } = useSkus();
  const { projects, selectedId } = useProjects();
  const category = projects.find((p) => p.id === selectedId)?.category ?? 'SKU';

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Needs attention'>('All');
  const fileInput = useRef<HTMLInputElement>(null);
  const pending = useRef<{ skuId: string; angle: Angle } | null>(null);
  // Track which (sku,angle) slot is mid-upload so we can spin only that tile.
  const [busySlot, setBusySlot] = useState<string | null>(null);

  const close = () => navigate(ROUTES.addSkuStored);

  const readyCount = skus.filter((s) => missingAngles(s).length === 0).length;
  const attentionCount = skus.length - readyCount;

  const q = query.trim().toLowerCase();
  const shown = useMemo(() => skus.filter((s) => {
    if (q && !(s.name.toLowerCase().includes(q) || (s.skuCode || '').toLowerCase().includes(q))) return false;
    if (filter === 'Needs attention') return missingAngles(s).length > 0;
    return true;
  }), [skus, q, filter]);

  const openPicker = (skuId: string, angle: Angle) => {
    pending.current = { skuId, angle };
    fileInput.current?.click();
  };

  const onFile = async (fileList: FileList | null) => {
    const p = pending.current;
    pending.current = null;
    if (!p || !fileList || fileList.length === 0) return;
    const file = Array.from(fileList).find((f) => f.type.startsWith('image/'));
    if (!file) return;
    const slotBusyKey = `${p.skuId}:${p.angle}`;
    setBusySlot(slotBusyKey);
    try {
      const uf = await readFileAsBase64(file);
      await addAngle(p.skuId, p.angle, uf);
    } finally {
      setBusySlot((cur) => (cur === slotBusyKey ? null : cur));
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6">
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { onFile(e.target.files); e.target.value = ''; }}
      />
      <div className="flex h-full max-h-[940px] w-full max-w-[1100px] flex-col overflow-hidden rounded-xl border border-wire-border bg-wire-surface shadow-pop">
        {/* header */}
        <div className="flex items-start justify-between border-b border-wire-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-wire-text">Prepare SKUs</h3>
            <p className="mt-1 text-sm text-wire-muted">
              {loading ? 'Loading…' : `${skus.length} SKUs · ${readyCount} ready · ${attentionCount} need attention`}
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="text-wire-muted hover:text-wire-text">{ico('M18 6L6 18M6 6l12 12', 18)}</button>
        </div>

        {/* top controls — search + filters */}
        <div className="flex items-center justify-between border-b border-wire-border px-6 py-3">
          <label className="flex h-9 w-72 items-center gap-2 rounded-md border border-wire-border bg-wire-bg px-3 focus-within:border-brand">
            <span className="text-wire-muted">{ico('M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-wire-text outline-none placeholder:text-wire-muted"
              placeholder="Search SKU by name or code"
            />
            {query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-wire-faint hover:text-wire-text">✕</button> : null}
          </label>
          <div className="flex items-center gap-2">
            {(['All', 'Needs attention'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={['rounded-md border px-3 py-1.5 text-xs font-medium', filter === f ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:text-wire-text'].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* legend */}
        <div className="flex items-center gap-4 border-b border-wire-border px-6 py-2 text-[11px] text-wire-muted">
          <span className="flex items-center gap-1.5"><span className="rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-medium text-white">Front</span> required angle</span>
          <span className="flex items-center gap-1.5"><span className="rounded-full border border-dashed border-danger bg-danger-weak px-1.5 py-0.5 text-[9px] text-danger">Detail</span> missing — click to upload</span>
          <span className="flex items-center gap-1.5"><span className="rounded-full border border-wire-border bg-wire-surface px-1.5 py-0.5 text-[9px] text-wire-muted">Side</span> extra</span>
        </div>

        {error ? (
          <div className="border-b border-wire-border bg-danger-weak px-6 py-2 text-xs text-wire-text">
            <span className="font-semibold text-danger">Upload failed:</span> {error}
          </div>
        ) : null}

        {/* body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-lg bg-wire-bg-2" />
              ))}
            </div>
          ) : skus.length === 0 ? (
            <div className="rounded-lg border border-dashed border-wire-border bg-wire-bg px-6 py-16 text-center">
              <p className="text-sm font-semibold text-wire-text">No SKUs to prepare</p>
              <p className="mt-1 text-sm text-wire-muted">Upload product images first, then come back to tag angles.</p>
              <Button className="mt-4" onClick={() => navigate(ROUTES.addSku)}>Go to Add SKUs</Button>
            </div>
          ) : shown.length === 0 ? (
            <div className="rounded-lg border border-dashed border-wire-border bg-wire-bg px-6 py-12 text-center text-sm text-wire-muted">
              No SKUs match {query ? `“${query}”` : `“${filter}”`}.
            </div>
          ) : (
            shown.map((s) => {
              const missing = missingAngles(s);
              const ready = missing.length === 0;
              // extras = stored slots that aren't one of the three required angles
              const extras = s.assets.filter((a) => !ANGLES.some((ang) => a.slotKey.toLowerCase().includes(ang)));
              return (
                <div key={s.id} className="rounded-lg border border-wire-border bg-wire-surface p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-wire-text">{s.name}</p>
                      <span className="text-xs text-wire-muted">{s.skuCode || category}</span>
                      <span className="text-xs text-wire-muted">· {s.assets.length} image{s.assets.length === 1 ? '' : 's'}</span>
                      <span className="text-xs">
                        {ready ? <span className="font-medium text-ok">Ready to use</span> : <span className="font-medium text-danger">Missing: {missing.map((a) => ANGLE_LABEL[a]).join(', ')}</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {ANGLES.map((a) => {
                      const url = angleUrl(s.assets, a);
                      const present = hasAngle(s.slotKeys, a);
                      if (!present) {
                        return (
                          <AngleCard
                            key={a}
                            missing
                            missingLabel={`${ANGLE_LABEL[a]} · missing`}
                            busy={busySlot === `${s.id}:${a}`}
                            onUpload={() => openPicker(s.id, a)}
                          />
                        );
                      }
                      return <AngleCard key={a} url={url} tag={ANGLE_LABEL[a]} tagKind="required" />;
                    })}

                    {extras.map((ex, i) => (
                      <AngleCard key={`ex-${i}`} url={ex.url} tag={ex.slotKey} tagKind="optional" />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t border-wire-border px-6 py-4">
          <p className="text-xs text-wire-muted">
            {uploading > 0 ? 'Uploading…' : `${readyCount} of ${skus.length} ready`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={close} disabled={uploading > 0}>Done</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
