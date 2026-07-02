import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';

/**
 * PropsAssets — hi-fi build of PropsAssetsWireframe.
 * Stacked full-width sections (NOT a grid), one per asset group, derived from the SKU type
 * (Fashion → Top). One upload area per group. Two states: empty + uploaded.
 * Shell (tab bar + project menu) is provided by WorkspaceShell.
 */

// Fashion → Top  ⇒  Character Face, Bottoms, Footwear, Accessories, Backgrounds
const GROUPS = [
  { name: 'Character Face', desc: 'Model face reference.', count: 2 },
  { name: 'Bottoms', desc: 'Trousers, jeans, skirts or shorts to pair with the selected Top.', count: 3 },
  { name: 'Footwear', desc: 'Shoes, boots, sandals or heels.', count: 2 },
  { name: 'Accessories', desc: 'Jewellery, bags, belts, watches, sunglasses and styling accessories.', count: 4 },
  { name: 'Backgrounds', desc: 'Studio backgrounds, locations or environmental references.', count: 2 },
];

function Optional() {
  return (
    <span className="rounded-full border border-wire-border px-2 py-0.5 text-[10px] font-medium text-wire-muted">
      Optional
    </span>
  );
}

/** Empty-state section: header + description + one upload area. */
function EmptySection({ name, desc }: { name: string; desc: string }) {
  const navigate = useNavigate();
  return (
    <section className="rounded-lg border border-wire-border bg-wire-surface p-5">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-wire-text">{name}</p>
        <Optional />
      </div>
      <p className="mt-0.5 text-xs text-wire-muted">{desc}</p>
      <div
        onClick={() => navigate(ROUTES.propsAssetsUploaded)}
        className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-wire-border bg-wire-bg px-4 py-7 text-center transition-colors hover:border-brand hover:bg-brand-weak"
      >
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-weak text-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
          </svg>
        </div>
        <p className="text-sm text-wire-text">
          <span className="font-medium text-brand underline">Click to upload</span> or drag and drop
        </p>
        <p className="text-[11px] text-wire-muted">Images or folders</p>
      </div>
    </section>
  );
}

/** Uploaded-state section: header (title · Optional · Upload more) + thumbnails. */
function UploadedSection({ name, count }: { name: string; count: number }) {
  return (
    <section className="rounded-lg border border-wire-border bg-wire-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-wire-text">{name}</p>
          <Optional />
          <span className="text-xs text-wire-muted">· {count} uploaded</span>
        </div>
        <Button variant="secondary" size="sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Upload more
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-20 w-20 rounded-md border border-wire-border bg-gradient-to-br from-wire-bg-2 to-wire-bg" aria-hidden />
        ))}
      </div>
    </section>
  );
}

function ContextNote() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-wire-border bg-wire-bg px-3 py-2">
      <span className="text-xs text-wire-muted">Asset groups are based on your SKU type:</span>
      <span className="text-sm font-medium text-brand">Fashion → Top</span>
    </div>
  );
}

function ActionBar() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-end gap-3 border-t border-wire-border pt-4">
      <Button variant="secondary" onClick={() => navigate(ROUTES.serviceSetup)}>Go back</Button>
      <Button onClick={() => navigate(ROUTES.generationCanvas)}>Start Generation</Button>
    </div>
  );
}

export default function PropsAssets() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Props &amp; Assets</h2>
        <p className="mt-1 text-sm text-wire-muted">Upload optional assets to pair with your SKUs.</p>
      </div>
      <ContextNote />
      <div className="space-y-4">
        {GROUPS.map((g) => (
          <EmptySection key={g.name} name={g.name} desc={g.desc} />
        ))}
      </div>
      <ActionBar />
    </div>
  );
}

export function PropsAssetsUploaded() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Props &amp; Assets</h2>
        <p className="mt-1 text-sm text-wire-muted">Supporting assets you&rsquo;ve added. Upload more to any group anytime.</p>
      </div>
      <ContextNote />
      <div className="space-y-4">
        {GROUPS.map((g) => (
          <UploadedSection key={g.name} name={g.name} count={g.count} />
        ))}
      </div>
      <ActionBar />
    </div>
  );
}
