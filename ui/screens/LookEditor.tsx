import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button, SectionLabel } from '../kit';

/**
 * Look Editor — hi-fi build of LookEditorWireframe.
 * Build a reusable Look (references + background + mood + colour) bound to one
 * Service Type. Replaces the old Moodboard + Background. No prompt fields.
 * Shell (sidebar + header) is provided by AppShell.
 * Reading order: breadcrumb → title block → References → Style → Background →
 * Mood descriptor, with a sticky Look summary rail on the right.
 */

const FASHION_TYPE = ['Casual', 'Smart casual', 'Formal', 'Streetwear', 'Athleisure', 'Luxury'];
const MOOD = ['Minimal', 'Bold', 'Playful', 'Editorial', 'Premium', 'Relaxed'];
const ATMOSPHERE = ['Warm', 'Cool', 'Bright', 'Moody', 'Airy', 'Dramatic'];
const LIGHTING = ['Soft', 'Natural', 'Studio softbox', 'Golden hour', 'High-key', 'Low-key'];

const STUDIO = [
  { name: 'Pure White', c: '#ffffff' },
  { name: 'Off White', c: '#f1f0ec' },
  { name: 'Studio Grey', c: '#c9c9cd' },
  { name: 'Warm Beige', c: '#e7e1d7' },
  { name: 'Cool Grey', c: '#d2d5da' },
  { name: 'Charcoal', c: '#3f3f46' },
];
const ENV_SUGGESTIONS = ['Sunlit street', 'Minimal studio corner', 'Golden-hour beach', 'Industrial loft', 'Lush garden', 'Marble tabletop'];

const sic = (d: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

/* ---------- small helpers ---------- */

function SelectChip({ children, selected, onClick }: { children: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        selected
          ? 'border-brand-weak-2 bg-brand-weak text-brand'
          : 'border-wire-border bg-wire-surface text-wire-muted hover:border-wire-border-strong hover:text-wire-text',
      ].join(' ')}
    >
      {selected ? <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden /> : null}
      {children}
    </button>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-wire-text">{title}</h3>
        {hint ? <p className="mt-0.5 text-xs text-wire-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Dropzone({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-wire-border bg-wire-bg px-4 py-6 text-center transition-colors hover:border-brand hover:bg-brand-weak/40">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-weak text-brand">
        {sic('M12 16V4M7 9l5-5 5 5', 16)}
      </div>
      <p className="text-xs text-wire-text"><span className="font-medium text-brand">Click to upload</span> or drag and drop</p>
      <p className="text-[11px] text-wire-muted">{label}</p>
    </div>
  );
}

function RefThumb({ tag }: { tag: 'look' | 'background' }) {
  return (
    <div className="relative h-24 w-24 shrink-0 rounded-md border border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg">
      <button className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-wire-border bg-wire-surface/90 text-wire-muted backdrop-blur transition-colors hover:text-danger" aria-label="Remove reference">
        {sic('M18 6L6 18M6 6l12 12', 11)}
      </button>
      {/* tappable tag selector — switch this image between look / background */}
      <button className="absolute inset-x-1 bottom-1 flex cursor-pointer items-center justify-center gap-1 rounded border border-wire-border bg-wire-surface px-1 py-0.5 text-[10px] font-medium text-wire-text">
        {tag} <span className="text-wire-muted">▾</span>
      </button>
    </div>
  );
}

/* ---------- screen ---------- */

export default function LookEditor() {
  const navigate = useNavigate();
  const toLibrary = () => navigate(ROUTES.lookLibrary);

  const [bgMode, setBgMode] = useState<'Studio' | 'Environment'>('Studio');
  const [fashion, setFashion] = useState('Smart casual');
  const [mood, setMood] = useState('Minimal');
  const [atmosphere, setAtmosphere] = useState('Warm');
  const [lighting, setLighting] = useState('Soft');
  const [studioColor, setStudioColor] = useState('Pure White');

  const summary: [string, string][] = [
    ['References', '2 look · 2 background'],
    ['Fashion type', fashion],
    ['Mood', mood],
    ['Atmosphere', atmosphere],
    ['Lighting', lighting],
    ['Background', bgMode === 'Studio' ? `Studio · ${studioColor}` : 'Environment · described'],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={toLibrary} className="inline-flex items-center gap-1 text-sm font-medium text-wire-muted transition-colors hover:text-brand">
          {sic('M15 18l-6-6 6-6', 16)} Looks
        </button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={toLibrary}>Cancel</Button>
          <Button onClick={toLibrary}>Save Look</Button>
        </div>
      </div>

      {/* title block: cover + name + service type + tags */}
      <div className="flex gap-4 rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
        <button className="flex h-20 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-wire-border bg-wire-bg text-wire-muted transition-colors hover:border-brand hover:text-brand">
          {sic('M12 5v14M5 12h14', 18)}
          <span className="text-[10px]">Set cover</span>
        </button>
        <div className="min-w-0 flex-1">
          <input
            type="text"
            defaultValue="Clean Studio — Tops"
            aria-label="Look name"
            className="h-10 w-full rounded-md border border-wire-border bg-wire-surface px-3 text-base font-medium text-wire-text outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-weak"
          />
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-wire-muted">Service Type</p>
              <button className="flex h-9 w-48 cursor-pointer items-center justify-between rounded-md border border-wire-border bg-wire-surface px-3 text-sm text-wire-text transition-colors hover:border-wire-border-strong">
                E-Commerce {sic('M6 9l6 6 6-6', 16)}
              </button>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-wire-muted">Tags</p>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-wire-border px-2.5 py-1 text-xs text-wire-muted">Tops</span>
                <span className="rounded-full border border-wire-border px-2.5 py-1 text-xs text-wire-muted">Studio</span>
                <button className="cursor-pointer rounded-full border border-dashed border-wire-border px-2.5 py-1 text-xs text-wire-muted transition-colors hover:border-brand hover:text-brand">+ Add tag</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* body: editor (left) + summary (right) */}
      <div className="flex gap-5">
        <div className="min-w-0 flex-1 space-y-5">
          {/* References — one uploader; tag each image as look or background */}
          <Section title="References" hint="Upload reference images, then tag each as a look or a background reference.">
            <Dropzone label="Styling, mood, backdrop or environment inspiration · folders supported" />
            <p className="mt-4 text-xs text-wire-muted">4 references · 2 look · 2 background</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {(['look', 'look', 'background', 'background'] as const).map((t, i) => (
                <RefThumb key={i} tag={t} />
              ))}
            </div>
          </Section>

          {/* Style presets */}
          <Section title="Style" hint="Options adapt to the selected Service Type. No prompts — just presets.">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-wire-text">Fashion type <span className="text-wire-muted">· pick one</span></p>
                <div className="flex flex-wrap gap-2">
                  {FASHION_TYPE.map((f) => <SelectChip key={f} selected={f === fashion} onClick={() => setFashion(f)}>{f}</SelectChip>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-wire-text">Mood <span className="text-wire-muted">· pick one</span></p>
                <div className="flex flex-wrap gap-2">
                  {MOOD.map((m) => <SelectChip key={m} selected={m === mood} onClick={() => setMood(m)}>{m}</SelectChip>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-wire-text">Atmosphere <span className="text-wire-muted">· pick one</span></p>
                <div className="flex flex-wrap gap-2">
                  {ATMOSPHERE.map((a) => <SelectChip key={a} selected={a === atmosphere} onClick={() => setAtmosphere(a)}>{a}</SelectChip>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-wire-text">Lighting <span className="text-wire-muted">· pick one</span></p>
                <div className="flex flex-wrap gap-2">
                  {LIGHTING.map((l) => <SelectChip key={l} selected={l === lighting} onClick={() => setLighting(l)}>{l}</SelectChip>)}
                </div>
              </div>
            </div>
          </Section>

          {/* Background */}
          <Section title="Background" hint="Choose a studio colour or describe an environment.">
            <div className="mb-4 inline-flex rounded-md border border-wire-border p-0.5">
              {(['Studio', 'Environment'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBgMode(m)}
                  className={[
                    'rounded px-4 py-1.5 text-sm font-medium transition-colors',
                    bgMode === m ? 'bg-brand text-white' : 'text-wire-muted hover:text-wire-text',
                  ].join(' ')}
                >
                  {m}
                </button>
              ))}
            </div>

            {bgMode === 'Studio' ? (
              <div className="flex flex-wrap gap-4">
                {STUDIO.map((b) => {
                  const active = b.name === studioColor;
                  return (
                    <button key={b.name} type="button" onClick={() => setStudioColor(b.name)} className="flex w-20 flex-col items-center gap-1.5 text-center">
                      <span
                        className={['h-12 w-12 rounded-md border-2 transition-colors', active ? 'border-brand ring-2 ring-brand-weak' : 'border-wire-border'].join(' ')}
                        style={{ backgroundColor: b.c }}
                        aria-hidden
                      />
                      <span className={['text-[11px]', active ? 'font-medium text-brand' : 'text-wire-muted'].join(' ')}>{b.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Describe the scene… e.g. sunlit cobblestone street, soft morning haze"
                  className="h-10 w-full rounded-md border border-wire-border bg-wire-surface px-3 text-sm text-wire-text placeholder:text-wire-muted outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-weak"
                />
                <p className="mt-2 mb-1.5 text-[11px] text-wire-muted">Suggestions — tap to use</p>
                <div className="flex flex-wrap gap-2">
                  {ENV_SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="cursor-pointer rounded-full border border-wire-border bg-wire-surface px-3 py-1.5 text-xs text-wire-text transition-colors hover:border-brand hover:bg-brand-weak hover:text-brand">{s}</button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Mood descriptor */}
          <Section title="Mood descriptor" hint="One line that sums up the Look.">
            <input
              type="text"
              defaultValue="Clean, minimal studio shots with soft, even light and a premium feel."
              aria-label="Mood descriptor"
              className="h-10 w-full rounded-md border border-wire-border bg-wire-surface px-3 text-sm text-wire-text outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-weak"
            />
          </Section>
        </div>

        {/* summary rail */}
        <aside className="w-80 shrink-0">
          <div className="sticky top-0 space-y-4 rounded-lg border border-wire-border bg-wire-surface p-5 shadow-card">
            <SectionLabel>Look summary</SectionLabel>
            <div className="h-32 rounded-md border border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-wire-text">Clean Studio — Tops</p>
              <p className="text-xs text-wire-muted">E-Commerce</p>
            </div>
            <dl className="space-y-1.5 text-xs">
              {summary.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-wire-muted">{k}</dt>
                  <dd className="text-right font-medium text-wire-text">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex gap-2 rounded-md border border-brand-weak-2 bg-brand-weak p-3 text-[11px] text-wire-muted">
              <span className="shrink-0 text-brand">{sic('M12 8v4M12 16h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 14)}</span>
              <span>Saved to your Look Library. When attached to a Service Type it’s copied in as a snapshot — later edits here won’t change existing projects.</span>
            </div>
            <Button className="w-full" onClick={toLibrary}>Save Look</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
