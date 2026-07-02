import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';

/**
 * Group SKU — modal (hi-fi build of GroupSkuWireframe).
 * Assign ungrouped images to a SKU. Each image belongs to exactly one SKU.
 * Select images → choose New or Existing SKU → Apply. Selecting an image auto-fills the name.
 * Centered modal over a dimmed scrim; ✕/Cancel → /add-sku-stored, Apply → /add-sku-stored.
 */

const ico = (d: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const sparkle = (size = 14) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2l1.8 4.9L18.7 8l-4.9 1.8L12 14.7l-1.8-4.9L5.3 8l4.9-1.1L12 2z" />
  </svg>
);

const IMAGES = ['IMG_4837.jpg', 'IMG_4838.jpg', 'IMG_4901.jpg', 'DSC_0112.jpg', 'DSC_0113.jpg'];
const EXISTING_SKUS = [
  { code: 'SKU 003', images: 4 },
  { code: 'SKU 004', images: 5 },
  { code: 'SKU 005', images: 3 },
];

const baseName = (f: string) => f.replace(/\.[^.]+$/, '');

/** Hi-fi selectable image tile with checkbox + file caption. */
function ImageCard({ file, selected, onToggle }: { file: string; selected: boolean; onToggle: () => void }) {
  return (
    <div className="w-28">
      <button
        type="button"
        onClick={onToggle}
        className={['relative grid h-36 w-28 place-items-center rounded-md border bg-gradient-to-br from-wire-bg-2 to-wire-bg', selected ? 'border-brand ring-2 ring-brand/40' : 'border-wire-border'].join(' ')}
      >
        <span className="text-wire-faint">{ico('M4 16l5-5 4 4 3-3 4 4M4 4h16v16H4z', 22)}</span>
        <span className={['absolute left-2 top-2 grid h-4 w-4 place-items-center rounded border text-[9px]', selected ? 'border-brand bg-brand text-white' : 'border-wire-border bg-wire-surface text-transparent'].join(' ')}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
        </span>
      </button>
      <p className="mt-1 truncate text-center text-[9px] text-wire-muted" title={file}>{file}</p>
    </div>
  );
}

export default function GroupSku() {
  const navigate = useNavigate();
  const close = () => navigate(ROUTES.addSkuStored);

  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [skuName, setSkuName] = useState('');
  const [existingSel, setExistingSel] = useState(EXISTING_SKUS[0].code);

  const toggle = (i: number) =>
    setSelected((p) => {
      const n = new Set(p);
      if (n.has(i)) {
        n.delete(i);
      } else {
        n.add(i);
        setSkuName(baseName(IMAGES[i]));
      }
      return n;
    });
  const count = selected.size;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6">
      <div className="flex w-full max-w-[720px] flex-col overflow-hidden rounded-xl border border-wire-border bg-wire-surface shadow-pop">
        {/* header */}
        <div className="flex items-start justify-between border-b border-wire-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-wire-text">Group images into a SKU</h3>
            <p className="mt-1 text-sm text-wire-muted">
              Each image belongs to one SKU. Select the images for this SKU, choose where they go, then apply.
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="text-wire-muted hover:text-wire-text">{ico('M18 6L6 18M6 6l12 12', 18)}</button>
        </div>

        {/* body */}
        <div className="flex flex-col gap-5 px-6 py-5">
          {/* AI-first — let AI do the grouping */}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-brand-weak-2 bg-brand-weak p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-brand text-white">{sparkle(18)}</span>
              <div>
                <p className="text-sm font-semibold text-wire-text">Auto-group with AI</p>
                <p className="text-xs text-wire-muted">Let AI sort these {IMAGES.length} images into SKUs automatically.</p>
              </div>
            </div>
            <Button size="sm" onClick={close}>{sparkle(13)} Auto-group · {IMAGES.length} credits</Button>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-wire-muted">
            <span className="h-px flex-1 bg-wire-border" /> or group manually <span className="h-px flex-1 bg-wire-border" />
          </div>

          {/* select images */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-wire-text">
                Ungrouped images <span className="text-wire-muted">· {IMAGES.length}</span>
              </p>
              <div className="flex items-center gap-3 text-sm">
                <button type="button" onClick={() => setSelected(new Set(IMAGES.map((_, i) => i)))} className="font-medium text-brand hover:underline">Select all</button>
                <button type="button" onClick={() => setSelected(new Set())} className="text-wire-muted hover:text-wire-text">Clear</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {IMAGES.map((name, i) => (
                <ImageCard key={i} file={name} selected={selected.has(i)} onToggle={() => toggle(i)} />
              ))}
            </div>
          </div>

          {/* assign to SKU — new or existing */}
          <div>
            <p className="mb-2 text-sm font-medium text-wire-text">Assign to SKU</p>
            <div className="mb-3 inline-flex rounded-md border border-wire-border p-0.5">
              {(['new', 'existing'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={['rounded px-4 py-1.5 text-sm font-medium transition-colors', mode === m ? 'bg-brand text-white' : 'text-wire-muted hover:text-wire-text'].join(' ')}
                >
                  {m === 'new' ? 'New SKU' : 'Existing SKU'}
                </button>
              ))}
            </div>

            {mode === 'new' ? (
              <div>
                <input
                  type="text"
                  value={skuName}
                  onChange={(e) => setSkuName(e.target.value)}
                  placeholder="Select an image to name the SKU, or type a name"
                  className="h-10 w-full rounded-md border border-wire-border bg-wire-bg px-3 text-sm text-wire-text outline-none transition-colors placeholder:text-wire-muted focus:border-brand"
                />
                <p className="mt-1.5 text-[11px] text-wire-muted">Pre-filled from the selected image — edit it to anything you like.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {EXISTING_SKUS.map((s) => {
                  const on = existingSel === s.code;
                  return (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => setExistingSel(s.code)}
                      className={['flex items-center gap-3 rounded-lg border bg-wire-surface p-3 text-left transition-colors', on ? 'border-brand ring-1 ring-brand' : 'border-wire-border hover:border-wire-border-strong'].join(' ')}
                    >
                      <span className={['grid h-4 w-4 shrink-0 place-items-center rounded border text-[9px]', on ? 'border-brand bg-brand text-white' : 'border-wire-border bg-wire-surface text-transparent'].join(' ')}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                      </span>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-wire-border bg-wire-bg text-wire-faint" aria-hidden>{ico('M4 16l5-5 4 4 3-3 4 4M4 4h16v16H4z', 16)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-wire-text">{s.code}</span>
                        <span className="block text-xs text-wire-muted">{s.images} images</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t border-wire-border px-6 py-4">
          <span className="text-xs text-wire-muted">
            {count > 0 ? `${count} image${count > 1 ? 's' : ''} → ${mode === 'new' ? (skuName || 'new SKU') : existingSel}` : 'No images selected'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button disabled={count === 0} onClick={close}>Apply</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
