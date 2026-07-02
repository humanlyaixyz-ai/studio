import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';

/**
 * Prepare SKUs — modal (hi-fi build of PrepareSkuWireframe).
 * Fix angle tagging per SKU. Required slots + extras flow. Tags carry meaning via color:
 * required = solid brand pill, optional = light outline, ai = dashed brand. A missing required
 * angle is a dashed danger uploader slot (the loudest element). Auto prepare is a pop-over.
 * Centered modal over a dimmed scrim; ✕/Cancel → /add-sku-stored, Save & Validate → /sku-review.
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

const REQUIRED = ['Front', 'Back', 'Detail'] as const;
const ADDITIONAL = ['Side', 'Close-up', 'Label'];
const UNGROUPED_FILES = ['IMG_4837.jpg', 'IMG_4838.jpg', 'IMG_4901.jpg', 'DSC_0112.jpg', 'DSC_0113.jpg'];

type Img = { tag: string | null; file: string };
type SkuGroup = { id: string; code: string; images: Img[] };

const GROUPS: SkuGroup[] = [
  { id: '001', code: 'SKU-001234-001', images: [{ tag: 'Front', file: 'IMG_1001.jpg' }, { tag: 'Back', file: 'IMG_1002.jpg' }, { tag: 'Detail', file: 'IMG_1003.jpg' }, { tag: null, file: 'IMG_1004.jpg' }, { tag: null, file: 'IMG_1005.jpg' }] },
  { id: '002', code: 'SKU-001234-002', images: [{ tag: 'Front', file: 'IMG_1011.jpg' }, { tag: 'Back', file: 'IMG_1012.jpg' }, { tag: 'Detail', file: 'IMG_1013.jpg' }, { tag: 'Side', file: 'IMG_1014.jpg' }, { tag: null, file: 'IMG_1015.jpg' }] },
  { id: '003', code: 'SKU-001234-003', images: [{ tag: 'Front', file: 'IMG_1021.jpg' }, { tag: 'Detail', file: 'IMG_1022.jpg' }, { tag: null, file: 'IMG_1023.jpg' }] },
  { id: '004', code: 'SKU-001234-004', images: [{ tag: 'Front', file: 'IMG_1031.jpg' }, { tag: null, file: 'IMG_1032.jpg' }] },
];

const missingReq = (g: SkuGroup) => REQUIRED.filter((a) => !g.images.some((im) => im.tag === a));
const TO_PREPARE =
  GROUPS.reduce((n, g) => n + missingReq(g).length, 0) +
  GROUPS.reduce((n, g) => n + g.images.filter((im) => im.tag === null).length, 0);

type TagKind = 'required' | 'optional' | 'ai';
function pillClass(kind: TagKind) {
  return kind === 'required'
    ? 'border-transparent bg-brand text-white'
    : kind === 'ai'
      ? 'border border-dashed border-brand bg-brand-weak text-brand'
      : 'border border-wire-border bg-wire-surface text-wire-muted';
}

/** Hi-fi image tile — checkbox, tag pill (required/optional/ai), dashed "missing" uploader. */
function ImageCard({
  file, tag, tagKind = 'optional', selected = false, onToggle, missing = false, missingLabel,
}: {
  file?: string; tag?: string | null; tagKind?: TagKind; selected?: boolean; onToggle?: () => void; missing?: boolean; missingLabel?: string;
}) {
  if (missing) {
    return (
      <div className="w-28">
        <button type="button" className="flex h-36 w-28 flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-danger bg-danger-weak text-center transition-colors hover:bg-danger-weak">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-danger text-white">{ico('M12 16V4M7 9l5-5 5 5', 15)}</span>
          <span className="text-xs font-semibold text-danger">{missingLabel}</span>
          <span className="text-[10px] text-wire-muted">Click to add</span>
        </button>
        <p className="mt-1 text-center text-[9px] text-transparent">·</p>
      </div>
    );
  }
  return (
    <div className="w-28">
      <button
        type="button"
        onClick={onToggle}
        className={['relative grid h-36 w-28 place-items-center rounded-md border bg-gradient-to-br from-wire-bg-2 to-wire-bg', selected ? 'border-brand ring-2 ring-brand/40' : 'border-wire-border'].join(' ')}
      >
        <span className="text-wire-faint">{ico('M4 16l5-5 4 4 3-3 4 4M4 4h16v16H4z', 22)}</span>
        {onToggle ? (
          <span className={['absolute left-2 top-2 grid h-4 w-4 place-items-center rounded border text-[9px]', selected ? 'border-brand bg-brand text-white' : 'border-wire-border bg-wire-surface text-transparent'].join(' ')}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
          </span>
        ) : null}
        {tag ? (
          <span className={['absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', pillClass(tagKind)].join(' ')}>
            {tagKind === 'ai' ? <>{sparkle(9)} {tag} · AI</> : tag}
          </span>
        ) : null}
      </button>
      {file ? <p className="mt-1 truncate text-center text-[9px] text-wire-muted" title={file}>{file}</p> : null}
    </div>
  );
}

export default function PrepareSku() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [menu, setMenu] = useState<string | null>(null);
  const [autoPrepared, setAutoPrepared] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [doTag, setDoTag] = useState(true);
  const [doGroup, setDoGroup] = useState(true);
  const [reviewApplied, setReviewApplied] = useState(false);

  const close = () => navigate(ROUTES.addSkuStored);
  const saveValidate = () => navigate(ROUTES.skuReview);
  const toggle = (key: string) => setSelected((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const count = selected.size;

  const missingOf = (g: SkuGroup) => (autoPrepared ? [] : missingReq(g));
  const readyCount = GROUPS.filter((g) => missingOf(g).length === 0).length;
  const attentionCount = GROUPS.length - readyCount;
  const applyAuto = () => { setAutoPrepared(true); setAutoOpen(false); };

  const Check = ({ on }: { on: boolean }) => (
    <span className={['grid h-4 w-4 shrink-0 place-items-center rounded border', on ? 'border-brand bg-brand text-white' : 'border-wire-border bg-wire-surface text-transparent'].join(' ')}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6" onClick={() => { setMenu(null); setAutoOpen(false); setGroupOpen(false); }}>
      <div className="flex h-full max-h-[940px] w-full max-w-[1340px] flex-col overflow-hidden rounded-xl border border-wire-border bg-wire-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between border-b border-wire-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-wire-text">Prepare SKUs</h3>
            <p className="mt-1 text-sm text-wire-muted">{GROUPS.length} SKUs · {readyCount} ready · {attentionCount} need attention</p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="text-wire-muted hover:text-wire-text">{ico('M18 6L6 18M6 6l12 12', 18)}</button>
        </div>

        {/* top controls — search + filters + Auto prepare */}
        <div className="flex items-center justify-between border-b border-wire-border px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-72 items-center gap-2 rounded-md border border-wire-border bg-wire-bg px-3">
              <span className="text-wire-muted">{ico('M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3')}</span>
              <span className="text-sm text-wire-muted">Search SKU by name or code</span>
            </div>
            <div className="flex items-center gap-2">
              {['All', 'Needs attention'].map((f, i) => (
                <span key={f} className={['cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium', i === 0 ? 'border-brand-weak-2 bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-muted hover:text-wire-text'].join(' ')}>{f}</span>
              ))}
            </div>
          </div>

          {/* Auto prepare pop-over */}
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setAutoOpen((v) => !v); }}>
              <span className="text-brand">{sparkle()}</span> Auto prepare <span className="text-wire-muted">{ico('M6 9l6 6 6-6', 14)}</span>
            </Button>
            {autoOpen ? (
              <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-11 z-30 w-80 rounded-xl border border-wire-border bg-wire-surface p-4 text-left shadow-pop">
                <p className="text-sm font-semibold text-wire-text">Auto prepare</p>
                <p className="mt-0.5 text-xs text-wire-muted">Let AI tag and group your images.</p>

                <div className="mt-3 space-y-2">
                  <button type="button" onClick={() => setDoTag((v) => !v)} className="flex w-full items-center gap-2 text-left text-sm text-wire-text">
                    <Check on={doTag} /> Tag images
                  </button>
                  <button type="button" onClick={() => setDoGroup((v) => !v)} className="flex w-full items-center gap-2 text-left text-sm text-wire-text">
                    <Check on={doGroup} /> Group images
                  </button>
                </div>

                <div className="mt-3 rounded-md border border-brand-weak-2 bg-brand-weak p-2.5">
                  <p className="text-[11px] text-wire-text">We&rsquo;ll auto-prepare <span className="font-semibold">{TO_PREPARE} images</span> in this project.</p>
                </div>

                <button type="button" onClick={() => setReviewApplied((v) => !v)} className="mt-3 flex w-full items-start gap-2 text-left">
                  <Check on={reviewApplied} />
                  <span>
                    <span className="text-sm text-wire-text">Review already-applied tags</span>
                    <span className="block text-[11px] text-wire-muted">AI checks existing tags and flags anything that looks off to confirm.</span>
                  </span>
                </button>

                <div className="mt-4 flex items-center justify-between">
                  <Button variant="secondary" size="sm" onClick={() => setAutoOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={applyAuto}>Apply · {TO_PREPARE} credits</Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* legend — what the tag styles mean */}
        <div className="flex items-center gap-4 border-b border-wire-border px-6 py-2 text-[11px] text-wire-muted">
          <span className="flex items-center gap-1.5"><span className="rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-medium text-white">Front</span> required</span>
          <span className="flex items-center gap-1.5"><span className="rounded-full border border-wire-border bg-wire-surface px-1.5 py-0.5 text-[9px] text-wire-muted">Side</span> optional</span>
          <span className="flex items-center gap-1.5"><span className="flex items-center gap-1 rounded-full border border-dashed border-brand bg-brand-weak px-1.5 py-0.5 text-[9px] text-brand">{sparkle(8)} AI</span> auto-applied</span>
        </div>

        {/* body */}
        <div className="flex min-h-0 flex-1">
          {/* main — SKU cards */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
            {/* Ungrouped images — handle here; Group via AI-first pop-over */}
            <div className="rounded-lg border-2 border-danger bg-danger-weak p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-danger text-sm font-semibold text-white">!</span>
                  <div>
                    <p className="text-sm font-semibold text-wire-text">Ungrouped images · 5</p>
                    <p className="text-xs text-wire-muted">Not yet grouped into a SKU.</p>
                  </div>
                </div>
                <div className="relative">
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); setGroupOpen((v) => !v); }}>Group <span className="text-white/70">{ico('M6 9l6 6 6-6', 14)}</span></Button>
                  {groupOpen ? (
                    <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-11 z-30 w-64 rounded-xl border border-wire-border bg-wire-surface p-2 text-left shadow-pop">
                      <button type="button" className="flex w-full items-start gap-2 rounded-md bg-brand px-3 py-2.5 text-left text-white hover:bg-brand-hover">
                        <span className="mt-0.5">{sparkle(12)}</span>
                        <span><span className="block text-sm font-medium">Auto-group with AI</span><span className="block text-[11px] text-white/70">Sort these into SKUs automatically</span></span>
                      </button>
                      <p className="py-1.5 text-center text-[11px] text-wire-muted">or do it manually</p>
                      <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-wire-text hover:bg-wire-bg">{ico('M12 5v14M5 12h14', 15)} Create new SKU</button>
                      <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-wire-text hover:bg-wire-bg">{ico('M5 12h14M13 6l6 6-6 6', 15)} Move to existing SKU</button>
                      <button type="button" onClick={() => navigate(ROUTES.groupSku)} className="mt-1 flex w-full items-center gap-2 border-t border-wire-border px-3 py-2 text-left text-sm text-wire-muted hover:bg-wire-bg">{ico('M3 6h18M3 12h18M3 18h18', 15)} Group manually…</button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {UNGROUPED_FILES.map((f, i) => (
                  <ImageCard key={i} file={f} selected={selected.has(`ung-${i}`)} onToggle={() => toggle(`ung-${i}`)} />
                ))}
              </div>
            </div>

            {autoPrepared && reviewApplied ? (
              <div className="flex items-center justify-between rounded-lg border border-brand-weak-2 bg-brand-weak p-3">
                <p className="flex items-center gap-1.5 text-xs text-wire-text"><span className="text-brand">{sparkle(12)}</span> Reviewed auto-applied tags · <span className="font-semibold">1 flagged</span> — confirm the suggested change.</p>
                <Button variant="secondary" size="sm">Review</Button>
              </div>
            ) : null}

            {GROUPS.map((g) => {
              const missing = missingOf(g);
              const ready = missing.length === 0;
              return (
                <div key={g.id} className="rounded-lg border border-wire-border bg-wire-surface p-4">
                  {/* card header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-wire-text">{g.code}</p>
                      <span className="text-xs text-wire-muted">{g.images.length} images</span>
                      <span className="text-xs">
                        {ready ? <span className="font-medium text-ok">Ready to use</span> : <span className="font-medium text-danger">Missing: {missing.join(', ')}</span>}
                      </span>
                    </div>
                    <div className="relative">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setMenu(menu === g.id ? null : g.id); }} aria-label="More options" className="px-2 text-wire-muted hover:text-wire-text">
                        {ico('M12 5h.01M12 12h.01M12 19h.01', 18)}
                      </button>
                      {menu === g.id ? (
                        <div className="absolute right-0 top-7 z-10 w-44 rounded-md border border-wire-border bg-wire-surface py-1 shadow-pop">
                          <button type="button" className="block w-full px-3 py-2 text-left text-sm text-wire-text hover:bg-wire-bg">Rename SKU</button>
                          <button type="button" className="block w-full px-3 py-2 text-left text-sm text-wire-text hover:bg-wire-bg">Archive SKU</button>
                          <button type="button" className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-danger-weak">Delete group</button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* one image flow: required angles (thumb / dashed uploader) then extras */}
                  <div className="flex flex-wrap gap-3">
                    {REQUIRED.map((a) => {
                      const img = g.images.find((im) => im.tag === a);
                      const key = `${g.id}-${a}`;
                      if (!img && !autoPrepared) {
                        return <ImageCard key={a} missing missingLabel={`${a} · missing`} />;
                      }
                      return (
                        <ImageCard
                          key={a}
                          file={img ? img.file : `IMG_${g.id}_ai.jpg`}
                          tag={a}
                          tagKind={img ? 'required' : 'ai'}
                          selected={selected.has(key)}
                          onToggle={() => toggle(key)}
                        />
                      );
                    })}

                    {g.images.filter((im) => im.tag === null || !REQUIRED.includes(im.tag as (typeof REQUIRED)[number])).map((im, i) => {
                      const key = `${g.id}-ex-${i}`;
                      return (
                        <ImageCard
                          key={key}
                          file={im.file}
                          tag={im.tag ?? undefined}
                          tagKind="optional"
                          selected={selected.has(key)}
                          onToggle={() => toggle(key)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* right rail */}
          <div className="flex w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-wire-border p-5">
            <p className="text-sm font-semibold text-wire-text">Tag images</p>
            <div className={['flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center', count > 0 ? 'border-brand-weak-2 bg-brand-weak' : 'border-wire-border bg-wire-bg'].join(' ')}>
              <span className={['grid h-8 w-8 place-items-center rounded-md', count > 0 ? 'bg-brand text-white' : 'border border-wire-border bg-wire-surface text-wire-muted'].join(' ')}>{ico('M4 16l5-5 4 4 3-3 4 4M4 4h16v16H4z', 16)}</span>
              <p className="text-sm font-medium text-wire-text">{count > 0 ? `${count} image${count > 1 ? 's' : ''} selected` : 'Select one or more images'}</p>
              <p className="text-xs text-wire-muted">to apply a tag.</p>
            </div>

            <div>
              <p className="text-sm font-medium text-wire-text">Required tags</p>
              <p className="text-xs text-wire-muted">Every SKU needs these.</p>
              <div className="mt-2 flex gap-2">
                {REQUIRED.map((t) => (
                  <button key={t} type="button" disabled={count === 0} className={['rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none', count === 0 ? 'border-wire-border text-wire-muted' : 'border-transparent bg-brand text-white hover:bg-brand-hover'].join(' ')}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-wire-text">Additional tags <span className="text-wire-muted">· optional</span></p>
              <p className="text-xs text-wire-muted">Never blocks a SKU.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ADDITIONAL.map((t) => (
                  <button key={t} type="button" disabled={count === 0} className="rounded-md border border-wire-border bg-wire-surface px-3 py-1.5 text-xs font-medium text-wire-text transition-colors hover:border-wire-border-strong disabled:opacity-50 disabled:pointer-events-none">{t}</button>
                ))}
                <button type="button" disabled={count === 0} className="rounded-md border border-dashed border-wire-border px-3 py-1.5 text-xs font-medium text-wire-text disabled:opacity-50 disabled:pointer-events-none">+ Add</button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-wire-text">Re-organize selected</p>
              <div className="space-y-2">
                {['Move to existing SKU', 'Create new SKU from selected', 'Archive selected'].map((a) => (
                  <button key={a} type="button" disabled={count === 0} className="flex w-full items-center justify-between rounded-md border border-wire-border bg-wire-surface px-3 py-2 text-sm font-medium text-wire-text transition-colors hover:border-wire-border-strong disabled:opacity-50 disabled:pointer-events-none">
                    {a} <span className="text-wire-muted">{ico('M9 6l6 6-6 6', 14)}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-wire-muted">Ungrouped images are handled in the Group SKU step.</p>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end border-t border-wire-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={saveValidate}>Save &amp; Validate</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
