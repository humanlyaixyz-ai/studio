import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button, Pill } from '../kit';

/**
 * ServiceSetup — hi-fi build of ServiceSetupWireframe.
 * Choose output types (Service Types), multi-select. Each selected Service Type is an
 * ACCORDION expanding inline to its full setup. Scope: E-Commerce, five nested sections:
 *   Look · SKU Shots · Camera & Composition · Advanced Settings.
 * Shell (tab bar + project menu) is provided by WorkspaceShell.
 */

const SERVICE_TYPES = [
  { name: 'E-Commerce', desc: 'Clean product shots on plain backgrounds.', selected: true },
  { name: 'Lifestyle', desc: 'Products in real-world, styled settings.', selected: false },
  { name: 'Editorial', desc: 'High-fashion, story-driven imagery.', selected: false },
  { name: 'Campaign', desc: 'Hero visuals for marketing campaigns.', selected: false },
  { name: 'Social Media', desc: 'Formats optimised for social feeds.', selected: false },
  { name: 'Marketplace', desc: 'Listing-ready images for marketplaces.', selected: false },
];

// Combined SKU Shots — select the shot AND edit its direction in one card.
const SHOTS = [
  { name: 'Front', selected: true, direction: 'Full-body front-facing shot with clear product visibility.' },
  { name: '45° Front', selected: false, direction: 'Three-quarter angle showing form and silhouette.' },
  { name: 'Side', selected: false, direction: 'Side profile showing fit and drape.' },
  { name: 'Back', selected: true, direction: 'Back view highlighting product fit and rear design details.' },
  { name: 'Detail', selected: true, direction: 'Close detail focusing on material, construction and key design features.' },
  { name: 'Close-up', selected: false, direction: 'Tight crop on a key design feature.' },
];

function Check({ on }: { on: boolean }) {
  return (
    <div
      className={[
        'grid h-5 w-5 place-items-center rounded border',
        on ? 'border-brand bg-brand text-white' : 'border-wire-border bg-wire-surface text-transparent',
      ].join(' ')}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      className={['shrink-0 transition-transform', open ? 'rotate-180' : ''].join(' ')}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ServiceCard({ name, desc, selected, onClick }: { name: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'relative w-full cursor-pointer rounded-lg border bg-wire-surface p-4 text-left transition-all',
        selected ? 'border-brand shadow-card' : 'border-wire-border hover:border-wire-border-strong',
      ].join(' ')}
    >
      <div className="absolute right-3 top-3">
        <Check on={selected} />
      </div>
      <div className={['grid h-9 w-9 place-items-center rounded-md', selected ? 'bg-brand-weak text-brand' : 'bg-wire-bg-2 text-wire-muted'].join(' ')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 9l1-5h16l1 5M4 9h16v11H4zM9 13h6" />
        </svg>
      </div>
      <p className="mt-3 text-sm font-medium text-wire-text">{name}</p>
      <p className="mt-0.5 text-xs text-wire-muted">{desc}</p>
    </button>
  );
}

function Accordion({ title, hint, open = false, children }: { title: string; hint?: string; open?: boolean; children?: ReactNode }) {
  const [isOpen, setIsOpen] = useState(open);
  return (
    <div className="rounded-lg border border-wire-border bg-wire-surface">
      <button type="button" onClick={() => setIsOpen((v) => !v)} className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left">
        <div>
          <p className="text-sm font-medium text-wire-text">{title}</p>
          {hint ? <p className="text-xs text-wire-muted">{hint}</p> : null}
        </div>
        <span className={isOpen ? 'text-brand' : 'text-wire-muted'}>
          <Chevron open={isOpen} />
        </span>
      </button>
      {isOpen ? <div className="border-t border-wire-border p-4">{children}</div> : null}
    </div>
  );
}

function Dropdown({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-wire-muted">{label}</p>
      <div className="flex h-10 cursor-pointer items-center justify-between rounded-md border border-wire-border bg-wire-surface px-3 hover:border-wire-border-strong">
        <span className="text-sm text-wire-text">{value}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-wire-muted" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

function EcommerceSetup() {
  const navigate = useNavigate();
  const [shots, setShots] = useState(SHOTS);
  const toggleShot = (name: string) => setShots((prev) => prev.map((s) => (s.name === name ? { ...s, selected: !s.selected } : s)));
  return (
    <div className="space-y-3">
      {/* 1 — Look (owns references + background) */}
      <Accordion title="Look" hint="A Look sets references, background, mood and colour for this service type." open>
        {/* Attached state — a Look copied in from the Library as a snapshot */}
        <div className="rounded-lg border border-wire-border bg-wire-surface p-4">
          <div className="flex gap-4">
            <div className="h-24 w-32 shrink-0 rounded-md border border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-wire-text">Clean Studio — Tops</p>
                <Pill tone="brand">E-Commerce</Pill>
              </div>
              <p className="mt-0.5 text-xs text-wire-muted">From Library: Clean Studio — Tops</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['Background: Studio', 'Mood: Minimal', 'Lighting: Soft', '4 references'].map((c) => (
                  <span key={c} className="rounded-full border border-wire-border px-2 py-0.5 text-[11px] text-wire-muted">{c}</span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                {(['look', 'look', 'background', 'background'] as const).map((t, i) => (
                  <div key={i} className="relative h-12 w-12 rounded-md border border-wire-border bg-wire-bg-2" aria-hidden>
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded border border-wire-border bg-wire-surface px-1 text-[8px] text-wire-muted">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-wire-border pt-3">
            <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.attachLook)}>Change Look</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.lookEditor)}>Edit Look</Button>
            <button type="button" className="ml-auto text-xs font-medium text-wire-muted hover:text-danger">Remove</button>
          </div>
        </div>
        <p className="mt-2 text-xs text-wire-muted">A Look is copied in as a snapshot — editing the library Look won&rsquo;t change this project.</p>
      </Accordion>

      {/* 2 — SKU Shots (angles + directions combined) */}
      <Accordion title="SKU Shots" hint="Select the shots you need and edit the direction for each one." open>
        <div className="grid grid-cols-2 gap-3">
          {shots.map((s) => (
            <div
              key={s.name}
              className={[
                'rounded-lg border bg-wire-surface p-3 transition-colors',
                s.selected ? 'border-brand' : 'border-wire-border',
              ].join(' ')}
            >
              <div className="flex h-20 items-center justify-center rounded-md border border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg">
                <span className="text-[10px] text-wire-faint">preview</span>
              </div>
              <button type="button" onClick={() => toggleShot(s.name)} className="mt-2 flex w-full items-center justify-between text-left">
                <p className="text-sm font-medium text-wire-text">{s.name}</p>
                <Check on={s.selected} />
              </button>
              <div className="mt-2">
                <p className="mb-1 text-[11px] font-medium text-wire-muted">Shot direction</p>
                <div className="rounded-md border border-wire-border bg-wire-bg px-2 py-2 text-xs text-wire-text">{s.direction}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-wire-muted">These directions guide the shot. They are not prompts.</p>
      </Accordion>

      {/* 3 — Camera & Composition */}
      <Accordion title="Camera & Composition" hint="Set framing and lens preferences. Angles are already selected above." open>
        <div className="flex gap-4">
          <Dropdown label="Shot framing" value="Auto" />
          <Dropdown label="Focal length" value="Auto" />
        </div>
      </Accordion>

      {/* 4 — Advanced Settings (collapsed) */}
      <Accordion title="Advanced Settings" hint="Optional controls for consistency and corrections." open={false} />
    </div>
  );
}

function SelectedService({ name, defaultOpen }: { name: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={['overflow-hidden rounded-lg border bg-wire-surface', open ? 'border-brand shadow-card' : 'border-wire-border'].join(' ')}>
      <button type="button" onClick={() => setOpen((v) => !v)} className={['flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left', open ? 'bg-brand-weak' : ''].join(' ')}>
        <div className="flex items-center gap-3">
          <div className={['grid h-8 w-8 place-items-center rounded-md', open ? 'bg-brand text-white' : 'bg-wire-bg-2 text-wire-muted'].join(' ')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 9l1-5h16l1 5M4 9h16v11H4zM9 13h6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-wire-text">{name}</p>
            <p className="text-xs text-wire-muted">Look, shots &amp; settings</p>
          </div>
        </div>
        <span className={open ? 'text-brand' : 'text-wire-muted'}><Chevron open={open} /></span>
      </button>
      {open ? (
        <div className="border-t border-wire-border p-4">
          {name === 'E-Commerce' ? (
            <EcommerceSetup />
          ) : (
            <div className="rounded-lg border border-dashed border-wire-border bg-wire-bg px-4 py-8 text-center text-sm text-wire-muted">
              Look, shots &amp; settings for {name} — configure like E-Commerce.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function ServiceSetup() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(SERVICE_TYPES.filter((s) => s.selected).map((s) => s.name)));
  const toggle = (name: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });
  const selectedTypes = SERVICE_TYPES.filter((s) => selected.has(s.name));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Heading */}
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Service Setup</h2>
        <p className="mt-1 text-sm text-wire-muted">
          Choose the output types you want to create. Each service type has its own Look and settings.
        </p>
      </div>

      {/* Service Type grid (multi-select) */}
      <div className="grid grid-cols-3 gap-4">
        {SERVICE_TYPES.map((s) => (
          <ServiceCard key={s.name} name={s.name} desc={s.desc} selected={selected.has(s.name)} onClick={() => toggle(s.name)} />
        ))}
      </div>

      {/* Selected Service Types — accordion(s) */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-wire-muted">Selected · {selected.size}</p>
        {selectedTypes.length > 0 ? (
          selectedTypes.map((s, i) => <SelectedService key={s.name} name={s.name} defaultOpen={i === 0} />)
        ) : (
          <div className="rounded-lg border border-dashed border-wire-border bg-wire-surface px-6 py-10 text-center text-sm text-wire-muted">
            Select at least one Service Type above to configure it.
          </div>
        )}
      </div>

      {/* Action bar — Go back + primary */}
      <div className="flex items-center justify-end gap-3 border-t border-wire-border pt-4">
        <Button variant="secondary" onClick={() => navigate(ROUTES.addSkuStored)}>Go back</Button>
        <Button onClick={() => navigate(ROUTES.propsAssets)} disabled={selected.size === 0}>Continue to Props &amp; Assets</Button>
      </div>
    </div>
  );
}
