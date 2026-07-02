import { useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';

/**
 * Generation Canvas — hi-fi build of GenerationCanvasWireframe.
 *
 *  - Bottom popover (Select SKUs / Shot / Look / Settings) is FIXED height + internal
 *    scroll, SAME width as the bottom bar, sitting directly above it with a consistent gutter.
 *  - Inputs = add/select cards (no dropdowns); tapping one opens the RIGHT RAIL selection.
 *  - SKU selection = card grid (not a list).
 *  - Shot editor opens as a full-height RIGHT RAIL.
 *
 * Renders inside WorkspaceShell's content region: the root is a relative, full-height
 * container so the popover/rails are absolutely positioned WITHIN it, not fixed to viewport.
 */

const BAR_W = 1080; // wider bar so the controls breathe
const POPOVER_H = 380;
const ASPECTS: [string, string][] = [
  ['Square', '1:1'],
  ['Portrait', '3:4'],
  ['Story', '9:16'],
  ['Landscape', '4:3'],
  ['Widescreen', '16:9'],
];

const SERVICE_TABS = ['E-Commerce', 'Lifestyle', 'Editorial'];
const SKUS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  name: `SKU ${String(i + 1).padStart(3, '0')}`,
  count: 3 + (i % 4),
}));
const SHOTS = [
  { name: 'Front', direction: 'Full-body front-facing shot with clear product visibility.', selected: true },
  { name: 'Back', direction: 'Back view highlighting fit and rear design details.', selected: true },
  { name: 'Detail', direction: 'Close detail on material, construction and key features.', selected: true },
  { name: '45° Front', direction: 'Three-quarter front angle showing form and silhouette.', selected: false },
  { name: '45° Back', direction: 'Three-quarter back angle for depth and drape.', selected: false },
  { name: 'Side', direction: 'Side profile showing fit and length.', selected: false },
  { name: 'Close-up', direction: 'Tight crop on a key design feature.', selected: false },
  { name: 'Top-down', direction: 'Overhead flat-lay framing.', selected: false },
  { name: 'Full length', direction: 'Head-to-toe framing with full context.', selected: false },
  { name: 'Three-quarter', direction: 'Waist-up three-quarter styling shot.', selected: false },
  { name: 'Macro', direction: 'Extreme close-up on fabric texture.', selected: false },
  { name: 'On hanger', direction: 'Product on a hanger, no model.', selected: false },
];
const DIRECTION =
  'Classic e-commerce product shot on a clean studio background. Focus on garment fit, material clarity and front-facing visibility.';
const SETTINGS_TABS = ['Inputs', 'Advanced'] as const;
type Tab = (typeof SETTINGS_TABS)[number];
const RESOLUTIONS = ['1K', '2K', '4K'];
// Image models only — name + cost per single image.
const MODELS = [
  { name: 'Krea 2 Large', cost: '8 credits' },
  { name: 'Krea 2 Medium', cost: '5 credits' },
  { name: 'GPT Image 2', cost: '10 credits' },
  { name: 'Nano Banana 2', cost: '6 credits' },
  { name: 'Seedream 5 Lite', cost: '4 credits' },
];

// Demo credit balance — intentionally low so the cost preview can show the low-credit warning.
const CREDITS_LEFT = 240;
const INPUTS: [string, string][] = [
  ['Model', 'Model A'],
  ['Background', 'Pure White'],
  ['Character Face', 'Face 01'],
  ['Bottoms', 'Denim 01'],
  ['Footwear', 'Sneakers 02'],
  ['Accessories', 'Bag 01'],
];

/* --- icons --- */
const Ico = ({ d, size = 16, sw = 1.7, className = '' }: { d: string; size?: number; sw?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d={d} />
  </svg>
);
const IconX = ({ size = 14 }: { size?: number }) => <Ico d="M18 6 6 18M6 6l12 12" size={size} />;
const IconChevronDown = () => <Ico d="m6 9 6 6 6-6" size={14} />;
const IconCheck = ({ size = 12 }: { size?: number }) => <Ico d="M20 6 9 17l-5-5" size={size} sw={2.4} />;
const IconPlus = ({ size = 16 }: { size?: number }) => <Ico d="M12 5v14M5 12h14" size={size} />;
const IconSparkle = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
  </svg>
);
const IconGear = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconImage = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15l4-4 4 4 3-3 4 4" /><circle cx="8.5" cy="9" r="1.3" />
  </svg>
);

/** Layered "deck" of image cards — stack depth hints at the image count. */
function SkuStack({ count }: { count: number }) {
  const depth = Math.min(count, 3);
  return (
    <div className="relative h-11 w-11 shrink-0">
      {depth >= 3 ? <div className="absolute left-2 top-2 h-9 w-9 rounded-md border border-wire-border bg-wire-bg-2" aria-hidden /> : null}
      {depth >= 2 ? <div className="absolute left-1 top-1 h-9 w-9 rounded-md border border-wire-border bg-wire-bg" aria-hidden /> : null}
      <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-md border border-wire-border bg-wire-surface text-wire-faint">
        <IconImage size={16} />
      </div>
    </div>
  );
}

export default function GenerationCanvas() {
  const navigate = useNavigate();
  const [panel, setPanel] = useState<'sku' | 'settings' | 'shot' | 'look' | null>(null);
  const [tab, setTab] = useState<Tab>('Inputs');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rail, setRail] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<number>>(() => new Set());
  const [generated, setGenerated] = useState(false);
  const [aspect, setAspect] = useState('3:4');
  const [resolution, setResolution] = useState('4K');
  const [model, setModel] = useState('Krea 2 Large');
  const [modelOpen, setModelOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [expandedSku, setExpandedSku] = useState<number | null>(null);
  const [modalSku, setModalSku] = useState<number | null>(null);
  const [modalImg, setModalImg] = useState(0);
  const [picked, setPicked] = useState<Set<number>>(() => new Set());
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const dragMoved = useRef(false);

  const count = sel.size;
  const selectedSkus = SKUS.filter((s) => sel.has(s.id));
  const totalOutputs = selectedSkus.reduce((a, s) => a + s.count, 0);
  const toggle = (id: number) => {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
    setGenerated(false);
  };
  const genLabel = count > 1 ? `Generate ${count} SKUs` : 'Generate';
  const perImage = parseInt(MODELS.find((m) => m.name === model)?.cost ?? '8', 10);
  const estCost = totalOutputs * perImage;
  const lowCredits = count > 0 && estCost > CREDITS_LEFT;
  const openPanel = (p: 'sku' | 'settings' | 'shot' | 'look') => setPanel((cur) => (cur === p ? null : p));
  const openModal = (sku: number, img: number) => { setModalSku(sku); setModalImg(img); };
  const stepModalImg = (d: number) => setModalImg((i) => {
    const max = modalSku !== null && selectedSkus[modalSku] ? selectedSkus[modalSku].count - 1 : 0;
    return Math.min(max, Math.max(0, i + d));
  });
  const allPicked = picked.size > 0 && picked.size === selectedSkus.length;
  const toggleAll = () => setPicked(allPicked ? new Set() : new Set(selectedSkus.map((_, i) => i)));
  const onGridDown = (e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-sku-idx]')) return;
    dragMoved.current = false;
    setDrag({ x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY });
  };
  const onGridMove = (e: ReactMouseEvent) => {
    if (!drag) return;
    dragMoved.current = true;
    setDrag((d) => (d ? { ...d, x1: e.clientX, y1: e.clientY } : d));
  };
  const onGridUp = () => {
    if (!drag) return;
    if (dragMoved.current) {
      const minX = Math.min(drag.x0, drag.x1), maxX = Math.max(drag.x0, drag.x1);
      const minY = Math.min(drag.y0, drag.y1), maxY = Math.max(drag.y0, drag.y1);
      const next = new Set<number>();
      document.querySelectorAll('[data-sku-idx]').forEach((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.left < maxX && r.right > minX && r.top < maxY && r.bottom > minY) next.add(Number((el as HTMLElement).dataset.skuIdx));
      });
      setPicked(next);
    } else {
      setPicked(new Set());
    }
    setDrag(null);
  };

  return (
    <div className="relative h-full min-h-[720px] overflow-hidden rounded-lg border border-wire-border bg-wire-bg">
      {/* ---------- STAGE ---------- */}
      {generated ? (
        <div
          onMouseDown={onGridDown}
          onMouseMove={onGridMove}
          onMouseUp={onGridUp}
          className="absolute inset-0 select-none overflow-y-auto px-8 pb-40 pt-20 ov-scroll"
        >
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-wire-muted">
              E-Commerce · {count} SKUs · {totalOutputs} outputs
            </p>
            <p className="mt-1 text-[11px] text-wire-muted">
              Tap to select · ⌘/Ctrl-tap for multiple · double-tap to view · drag to box-select
            </p>
          </div>
          <div className="mx-auto max-w-4xl space-y-3">
            {Array.from({ length: Math.ceil(selectedSkus.length / 4) }).map((_, r) => {
              const rowSkus = selectedSkus.slice(r * 4, r * 4 + 4);
              const expandedInRow = expandedSku !== null && Math.floor(expandedSku / 4) === r;
              return (
                <div key={r} className="space-y-3">
                  {/* image-stack cards */}
                  <div className="grid grid-cols-4 gap-3">
                    {rowSkus.map((s, c) => {
                      const idx = r * 4 + c;
                      const active = expandedSku === idx;
                      const isPicked = picked.has(idx);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          data-sku-idx={idx}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey) {
                              setPicked((p) => { const n = new Set(p); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
                            } else {
                              setPicked(new Set([idx]));
                            }
                          }}
                          onDoubleClick={() => setExpandedSku(active ? null : idx)}
                          className={['relative flex flex-col items-center gap-2 rounded-lg border bg-wire-surface p-4 transition-all', isPicked ? 'border-brand ring-1 ring-brand' : 'border-wire-border hover:border-wire-border-strong hover:shadow-card'].join(' ')}
                        >
                          {isPicked ? (
                            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded bg-brand text-white">
                              <IconCheck size={10} />
                            </span>
                          ) : null}
                          <SkuStack count={s.count} />
                          <p className="text-sm font-medium text-wire-text">{s.name}</p>
                          <p className="text-xs text-wire-muted">{s.count} images</p>
                        </button>
                      );
                    })}
                  </div>
                  {/* expand-in-place: that SKU's generated images */}
                  {expandedInRow ? (
                    <div className="rounded-lg border border-wire-border bg-wire-surface p-4 shadow-card">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-wire-text">{selectedSkus[expandedSku!].name} · {selectedSkus[expandedSku!].count} images</p>
                        <button type="button" onClick={() => setExpandedSku(null)} className="flex items-center gap-1 text-xs text-wire-muted hover:text-wire-text">Collapse <IconX size={12} /></button>
                      </div>
                      <div className="grid grid-cols-6 gap-3">
                        {Array.from({ length: selectedSkus[expandedSku!].count }).map((_, i) => (
                          <button key={i} type="button" onClick={() => openModal(expandedSku!, i)} className="flex aspect-[3/4] w-full items-center justify-center rounded-md border border-wire-border bg-wire-bg text-wire-faint transition-colors hover:border-brand"><IconImage size={20} /></button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {drag && dragMoved.current ? (
            <div
              className="pointer-events-none fixed z-30 rounded-sm border border-brand"
              style={{ left: Math.min(drag.x0, drag.x1), top: Math.min(drag.y0, drag.y1), width: Math.abs(drag.x1 - drag.x0), height: Math.abs(drag.y1 - drag.y0), backgroundColor: 'rgba(21,110,244,0.10)' }}
            />
          ) : null}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-wire-border bg-wire-surface text-brand shadow-card">
            <IconImage size={30} />
          </div>
          <p className="text-xl font-semibold text-wire-text">
            {count > 0 ? `${count} SKUs ready` : 'Ready to generate'}
          </p>
          <p className="text-sm text-wire-muted">
            {count > 0 ? 'Review settings, then hit Generate.' : 'Select SKUs, review settings, then generate.'}
          </p>
          {count === 0 ? (
            <Button className="mt-2" onClick={() => openPanel('sku')}>Select SKUs</Button>
          ) : null}
        </div>
      )}

      {/* ---------- Service Type switch (top) ---------- */}
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-wire-border bg-wire-surface p-1 shadow-pop">
        {SERVICE_TABS.map((t, i) => (
          <span key={t} className={['rounded-lg px-3 py-1.5 text-sm', i === 0 ? 'bg-brand-weak font-medium text-brand' : 'text-wire-muted'].join(' ')}>{t}</span>
        ))}
        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-wire-muted"><IconPlus size={16} /></span>
      </div>

      {/* ---------- RIGHT RAIL — shot editor (full height) ---------- */}
      {leftOpen ? (
        <div className="absolute bottom-0 right-0 top-0 z-20 flex w-[340px] flex-col border-l border-wire-border bg-wire-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-wire-border px-4 py-3">
            <p className="text-sm font-semibold text-wire-text">Shot editor — E-Commerce</p>
            <button type="button" onClick={() => setLeftOpen(false)} aria-label="Close" className="text-wire-muted hover:text-wire-text"><IconX /></button>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 ov-scroll">
            <p className="text-[11px] font-medium uppercase tracking-wide text-wire-muted">Angles — add or remove</p>
            {SHOTS.map((shot) => (
              <div key={shot.name} className={['rounded-lg border p-3', shot.selected ? 'border-brand bg-brand-weak' : 'border-wire-border bg-wire-surface'].join(' ')}>
                <div className="flex items-center gap-2">
                  <span className={['flex h-4 w-4 items-center justify-center rounded border', shot.selected ? 'border-brand bg-brand text-white' : 'border-wire-border-strong bg-wire-surface text-transparent'].join(' ')}><IconCheck size={10} /></span>
                  <p className="text-sm font-medium text-wire-text">{shot.name}</p>
                </div>
                {shot.selected ? (
                  <div className="mt-2">
                    <p className="mb-1 text-[11px] font-medium text-wire-muted">Shot direction</p>
                    <textarea defaultValue={shot.direction} rows={2} className="w-full resize-none rounded-md border border-wire-border bg-wire-surface p-2 text-xs text-wire-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="border-t border-wire-border p-3">
            <Button className="w-full" onClick={() => setLeftOpen(false)}>Save shots</Button>
          </div>
        </div>
      ) : null}

      {/* ---------- RIGHT RAIL — input selection (full height) ---------- */}
      {rail ? (
        <div className="absolute bottom-0 right-0 top-0 z-20 flex w-[340px] flex-col border-l border-wire-border bg-wire-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-wire-border px-4 py-3">
            <p className="text-sm font-semibold text-wire-text">{rail}</p>
            <button type="button" onClick={() => setRail(null)} aria-label="Close" className="text-wire-muted hover:text-wire-text"><IconX /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 ov-scroll">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-wire-muted">Uploaded</p>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={['flex flex-col items-center gap-1 rounded-lg border bg-wire-surface p-2', i === 0 ? 'border-brand ring-1 ring-brand' : 'border-wire-border'].join(' ')}>
                  <div className="flex h-24 w-full items-center justify-center rounded-md border border-wire-border bg-wire-bg text-wire-faint" aria-hidden><IconImage size={22} /></div>
                  <span className="text-[11px] text-wire-muted">{rail} 0{i + 1}</span>
                </div>
              ))}
              <div className="flex h-[120px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-wire-border bg-wire-bg text-wire-muted">
                <IconPlus size={18} />
                <span className="text-[11px]">Upload new</span>
              </div>
            </div>
          </div>
          <div className="border-t border-wire-border p-3">
            <Button className="w-full" onClick={() => setRail(null)}>Select</Button>
          </div>
        </div>
      ) : null}

      {/* ---------- Bottom column: popover (above) + action bar ---------- */}
      <div className="absolute bottom-5 left-1/2 z-10 flex w-full max-w-[calc(100%-2.5rem)] -translate-x-1/2 flex-col gap-3" style={{ width: BAR_W }}>
        {/* Fixed-height popover */}
        {panel ? (
          <div className="flex flex-col overflow-hidden rounded-xl border border-wire-border bg-wire-surface shadow-pop" style={{ height: POPOVER_H }}>
            {panel === 'sku' ? (
              <>
                <div className="flex items-center justify-between border-b border-wire-border px-4 py-3">
                  <p className="text-sm font-semibold text-wire-text">Select SKUs</p>
                  <div className="flex items-center gap-3 text-xs">
                    <button type="button" onClick={() => setSel(new Set(SKUS.map((s) => s.id)))} className="font-medium text-brand hover:underline">Select all</button>
                    <button type="button" onClick={() => setSel(new Set())} className="text-wire-muted hover:underline">Clear</button>
                    <button type="button" onClick={() => setPanel(null)} aria-label="Close" className="text-wire-muted hover:text-wire-text"><IconX /></button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3 ov-scroll">
                  <div className="grid grid-cols-5 gap-3">
                    {SKUS.map((s) => {
                      const on = sel.has(s.id);
                      return (
                        <button key={s.id} type="button" onClick={() => toggle(s.id)} className={['relative rounded-lg border bg-wire-surface p-2 text-left transition-all', on ? 'border-brand ring-1 ring-brand' : 'border-wire-border hover:border-wire-border-strong'].join(' ')}>
                          <span className={['absolute right-3 top-3 z-10 flex h-4 w-4 items-center justify-center rounded border', on ? 'border-brand bg-brand text-white' : 'border-wire-border-strong bg-wire-surface text-transparent'].join(' ')}><IconCheck size={10} /></span>
                          <div className="flex aspect-[3/4] w-full items-center justify-center rounded-md border border-wire-border bg-wire-bg text-wire-faint" aria-hidden><IconImage size={22} /></div>
                          <p className="mt-2 text-sm font-medium text-wire-text">{s.name}</p>
                          <p className="text-[11px] text-wire-muted">{s.count} images</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="border-t border-wire-border p-3">
                  <Button className="w-full" onClick={() => setPanel(null)}>Done · {count} selected</Button>
                </div>
              </>
            ) : panel === 'shot' ? (
              <>
                <div className="flex items-center justify-between border-b border-wire-border px-4 py-3">
                  <p className="text-sm font-semibold text-wire-text">SKU Shots</p>
                  <button type="button" onClick={() => setPanel(null)} aria-label="Close" className="text-wire-muted hover:text-wire-text"><IconX /></button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 ov-scroll">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-wire-text">Shots to generate <span className="text-wire-muted">· {SHOTS.filter((s) => s.selected).length}</span></p>
                    <Button variant="secondary" size="sm" onClick={() => { setLeftOpen(true); setRail(null); setPanel(null); }}>Open shot editor →</Button>
                  </div>
                  <div className="space-y-3">
                    {SHOTS.filter((s) => s.selected).map((s) => (
                      <div key={s.name} className="rounded-lg border border-wire-border bg-wire-surface p-3">
                        <p className="mb-1.5 text-sm font-medium text-wire-text">{s.name}</p>
                        <textarea defaultValue={s.direction} rows={2} className="w-full resize-none rounded-md border border-wire-border bg-wire-bg p-2 text-xs text-wire-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-wire-muted">Add or remove angles in the shot editor.</p>
                </div>
              </>
            ) : panel === 'look' ? (
              <>
                <div className="flex items-center justify-between border-b border-wire-border px-4 py-3">
                  <p className="text-sm font-semibold text-wire-text">Look</p>
                  <button type="button" onClick={() => setPanel(null)} aria-label="Close" className="text-wire-muted hover:text-wire-text"><IconX /></button>
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 ov-scroll">
                  <div className="rounded-lg border border-wire-border bg-wire-surface p-3">
                    <div className="flex gap-3">
                      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-md border border-wire-border bg-wire-bg text-wire-faint" aria-hidden><IconImage size={20} /></div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-wire-text">Clean Studio — Tops</p>
                          <span className="rounded-full border border-brand-weak-2 bg-brand-weak px-2 py-0.5 text-[10px] font-medium text-brand">E-Commerce</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-wire-muted">From Library</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {['Background: Studio', 'Mood: Minimal', 'Lighting: Soft'].map((c) => (
                            <span key={c} className="rounded-full border border-wire-border px-2 py-0.5 text-[10px] text-wire-muted">{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => navigate(ROUTES.attachLook)}>Change Look</Button>
                    <Button variant="secondary" className="flex-1" onClick={() => navigate(ROUTES.lookEditor)}>Create new Look</Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-wire-border px-4 pt-3">
                  <div className="flex gap-5">
                    {SETTINGS_TABS.map((t) => (
                      <button key={t} type="button" onClick={() => setTab(t)} className={['pb-2 text-sm', tab === t ? 'border-b-2 border-brand font-medium text-brand' : 'border-b-2 border-transparent text-wire-muted hover:text-wire-text'].join(' ')}>{t}</button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setPanel(null)} aria-label="Close" className="pb-2 text-wire-muted hover:text-wire-text"><IconX /></button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 ov-scroll">
                  {tab === 'Inputs' ? (
                    <div className="grid grid-cols-3 gap-3">
                      {INPUTS.map(([label, value]) => (
                        <button key={label} type="button" onClick={() => { setRail(label); setLeftOpen(false); }} className="flex flex-col gap-2 rounded-lg border border-wire-border bg-wire-surface p-3 text-left transition-all hover:border-brand hover:shadow-card">
                          <span className="text-[11px] font-medium uppercase tracking-wide text-wire-muted">{label}</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded border border-wire-border bg-wire-bg text-wire-faint" aria-hidden><IconImage size={14} /></div>
                              <span className="text-sm text-wire-text">{value}</span>
                            </div>
                            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-wire-border text-wire-muted"><IconPlus size={14} /></span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {[['Shot framing', 'Auto'], ['Focal length', 'Auto'], ['Consistency', 'Medium'], ['Seed', '42']].map(([label, value]) => (
                        <div key={label} className="flex flex-col gap-2 rounded-lg border border-wire-border bg-wire-surface p-3">
                          <span className="text-[11px] font-medium uppercase tracking-wide text-wire-muted">{label}</span>
                          <span className="text-sm text-wire-text">{value}</span>
                        </div>
                      ))}
                      <div className="col-span-3 flex flex-col gap-1.5 rounded-lg border border-wire-border bg-wire-surface p-3">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-wire-muted">Negative prompt</span>
                        <span className="text-sm text-wire-muted">blur, text, low quality…</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* Action bar — selection toolbar when SKUs are picked, else default */}
        {generated && picked.size > 0 ? (
          <div className="flex items-center justify-between rounded-2xl border border-wire-border bg-wire-surface px-4 py-3 shadow-pop">
            <div className="flex items-center gap-3">
              <button type="button" onClick={toggleAll} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-brand bg-brand text-white">{allPicked ? <IconCheck size={12} /> : <span className="h-0.5 w-2.5 rounded-full bg-white" />}</span>
                <span className="text-sm font-medium text-wire-text">{picked.size} selected</span>
              </button>
              <button type="button" onClick={() => setPicked(new Set())} className="text-xs text-wire-muted hover:underline">Clear</button>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" title="Share" className="flex h-9 w-9 items-center justify-center rounded-md border border-wire-border bg-wire-surface text-wire-muted hover:text-brand">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3v13M8 7l4-4 4 4M20 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5" /></svg>
              </button>
              <Button>Download {picked.size}</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-wire-border bg-wire-surface px-4 py-3 shadow-pop">
            {/* LEFT — Select SKUs · Shot · Look · Settings */}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => openPanel('sku')} className={['flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium', panel === 'sku' ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-text hover:border-wire-border-strong'].join(' ')}>
                Select SKUs
                <span className={['flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px]', panel === 'sku' ? 'bg-brand text-white' : 'border border-wire-border text-wire-muted'].join(' ')}>{count}</span>
              </button>
              <button type="button" onClick={() => openPanel('shot')} className={['flex h-10 items-center rounded-md border px-3 text-sm font-medium', panel === 'shot' ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-text hover:border-wire-border-strong'].join(' ')}>Shot</button>
              {/* Look — overview / change / create new via the panel */}
              <button type="button" onClick={() => openPanel('look')} className={['flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium', panel === 'look' ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-text hover:border-wire-border-strong'].join(' ')}>
                <span className="flex h-5 w-5 items-center justify-center rounded border border-wire-border bg-wire-bg text-wire-faint" aria-hidden><IconImage size={12} /></span>
                Look
                <span className="text-wire-muted"><IconChevronDown /></span>
              </button>
              <button type="button" onClick={() => openPanel('settings')} aria-label="Settings" title="Settings" className={['flex h-10 w-10 items-center justify-center rounded-md border', panel === 'settings' ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-text hover:border-wire-border-strong'].join(' ')}>
                <IconGear />
              </button>
            </div>
            {/* RIGHT — Output (aspect · resolution) · Model · Generate (icon) */}
            <div className="flex items-center gap-2">
              {/* Output: aspect ratio + resolution together in one button */}
              <div className="relative">
                <button type="button" onClick={() => setOutputOpen((v) => !v)} className={['flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-medium', outputOpen ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-text hover:border-wire-border-strong'].join(' ')}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-wire-muted"><rect x="4" y="5" width="16" height="14" rx="2" /></svg>
                  {aspect} · {resolution} <span className="text-wire-muted"><IconChevronDown /></span>
                </button>
                {outputOpen ? (
                  <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-wire-border bg-wire-surface p-3 shadow-pop">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-wire-muted">Aspect ratio</p>
                    <div className="flex flex-wrap gap-2">
                      {ASPECTS.map(([name, ratio]) => (
                        <button key={ratio} type="button" onClick={() => setAspect(ratio)} className={['rounded-md border px-2.5 py-1 text-xs', aspect === ratio ? 'border-brand bg-brand-weak font-medium text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:border-wire-border-strong'].join(' ')}>{name} {ratio}</button>
                      ))}
                    </div>
                    <p className="mb-2 mt-3 text-[11px] font-medium uppercase tracking-wide text-wire-muted">Resolution</p>
                    <div className="flex gap-2">
                      {RESOLUTIONS.map((r) => (
                        <button key={r} type="button" onClick={() => setResolution(r)} className={['rounded-md border px-4 py-1 text-xs', resolution === r ? 'border-brand bg-brand-weak font-medium text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:border-wire-border-strong'].join(' ')}>{r}</button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              {/* Model — image models only: name + cost per image */}
              <div className="relative">
                <button type="button" onClick={() => setModelOpen((v) => !v)} className={['flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium', modelOpen ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-text hover:border-wire-border-strong'].join(' ')}>
                  <span className="flex h-5 w-5 items-center justify-center rounded border border-wire-border bg-wire-bg text-wire-faint" aria-hidden><IconImage size={12} /></span> {model} <span className="text-wire-muted"><IconChevronDown /></span>
                </button>
                {modelOpen ? (
                  <div className="absolute bottom-full right-0 mb-2 w-72 rounded-xl border border-wire-border bg-wire-surface p-2 shadow-pop">
                    <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-wire-muted">Image models</p>
                    <div className="max-h-72 space-y-0.5 overflow-y-auto ov-scroll">
                      {MODELS.map((m) => {
                        const on = model === m.name;
                        return (
                          <button key={m.name} type="button" onClick={() => { setModel(m.name); setModelOpen(false); }} className={['flex w-full items-center justify-between rounded-md px-2 py-2 text-left', on ? 'bg-brand-weak' : 'hover:bg-wire-bg'].join(' ')}>
                            <span className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-wire-border bg-wire-bg text-wire-faint" aria-hidden><IconImage size={14} /></span>
                              <span className={['text-sm font-medium', on ? 'text-brand' : 'text-wire-text'].join(' ')}>{m.name}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-wire-muted">{m.cost} / image</span>
                              {on ? <span className="text-brand"><IconCheck size={14} /></span> : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              {/* cost preview + non-blocking low-credit warning (warn, don't block) */}
              {count > 0 ? (
                <div className="flex flex-col items-end pr-1 text-right leading-tight">
                  {lowCredits ? (
                    <>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-warn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
                        Needs {estCost} cr · {CREDITS_LEFT} left
                      </span>
                      <button type="button" onClick={() => navigate(ROUTES.billing)} className="text-[10px] text-brand hover:underline">Top up credits</button>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-medium text-wire-text">≈ {estCost} credits</span>
                      <span className="text-[10px] text-wire-muted">{CREDITS_LEFT} left</span>
                    </>
                  )}
                </div>
              ) : null}
              <button type="button" disabled={count === 0} onClick={() => { setGenerated(true); setPanel(null); }} title={genLabel} className={['flex h-10 w-10 items-center justify-center rounded-md border transition-colors', count === 0 ? 'cursor-not-allowed border-wire-border bg-wire-bg-2 text-wire-faint' : 'border-brand bg-brand text-white hover:bg-brand-hover'].join(' ')}><IconSparkle /></button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- IMAGE APPROVAL MODAL (image-first lightbox) ---------- */}
      {modalSku !== null && selectedSkus[modalSku] ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(8,8,8,0.5)' }}>
          <div className="flex h-full max-h-[760px] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-wire-border bg-wire-surface shadow-pop">
            {/* header — SKU · service · image count · download ZIP · close */}
            <div className="flex items-center justify-between border-b border-wire-border px-4 py-3">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-wire-text">{selectedSkus[modalSku].name}</span>
                <span className="text-xs text-wire-muted">E-Commerce · {selectedSkus[modalSku].count} images</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3v12M8 11l4 4 4-4M4 21h16" /></svg>
                  Download ZIP
                </Button>
                <button type="button" onClick={() => setModalSku(null)} aria-label="Close" className="flex h-7 w-7 items-center justify-center text-wire-muted hover:text-wire-text"><IconX /></button>
              </div>
            </div>
            {/* body */}
            <div className="flex min-h-0 flex-1">
              {/* image edge-to-edge + chevrons, position below */}
              <div className="flex min-w-0 flex-1 flex-col bg-wire-bg">
                <div className="relative flex min-h-0 flex-1 items-center justify-center">
                  <button type="button" onClick={() => stepModalImg(-1)} disabled={modalImg === 0} className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full border border-wire-border bg-wire-surface text-wire-muted shadow-card hover:text-brand disabled:opacity-40"><Ico d="m15 18-6-6 6-6" size={18} /></button>
                  <span className="flex flex-col items-center gap-2 text-wire-faint"><IconImage size={40} /><span className="text-xs text-wire-muted">{selectedSkus[modalSku].name} · Image {modalImg + 1}</span></span>
                  <button type="button" onClick={() => stepModalImg(1)} disabled={modalImg === selectedSkus[modalSku].count - 1} className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full border border-wire-border bg-wire-surface text-wire-muted shadow-card hover:text-brand disabled:opacity-40"><Ico d="m9 18 6-6-6-6" size={18} /></button>
                </div>
                <p className="pb-3 text-center text-xs text-wire-muted">Image {modalImg + 1} of {selectedSkus[modalSku].count}</p>
              </div>
              {/* right — generation direction with Regenerate, then primary Download */}
              <div className="flex w-[340px] flex-col border-l border-wire-border">
                <div className="min-h-0 flex-1 overflow-y-auto p-4 ov-scroll">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-wire-muted">Generation Direction</p>
                  <div className="overflow-hidden rounded-lg border border-wire-border">
                    <div className="p-3 text-sm text-wire-text">{DIRECTION}</div>
                    <div className="flex items-center justify-between border-t border-wire-border bg-wire-bg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-4 w-7 items-center rounded-full bg-brand px-0.5"><span className="ml-auto h-3 w-3 rounded-full bg-white" /></span>
                        <span className="text-xs text-wire-muted">AI prompt</span>
                      </div>
                      <span className="text-brand"><IconSparkle size={14} /></span>
                    </div>
                  </div>
                  <Button variant="secondary" className="mt-2 w-full">Regenerate</Button>
                </div>
                <div className="space-y-2 border-t border-wire-border p-4">
                  <Button className="w-full">Download</Button>
                  <Button variant="secondary" className="w-full">Mark for review</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
