import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';
import { useProjects } from '../data/projects';
import * as db from '../../services/dbService';
import type { AssetSummary } from '../../services/dbService';

/**
 * PropsAssets — hi-fi build of PropsAssetsWireframe, now wired to REAL data.
 * Stacked full-width sections (NOT a grid), one per asset group, derived from the SKU type.
 * Reads the selected project's real `project_assets` (read-only) via
 * db.loadProjectAssetSummaries (public thumbnail URLs, no image bytes). Groups with
 * uploaded assets show real thumbnails; empty groups show the upload placeholder.
 * Shell (tab bar + project menu) is provided by WorkspaceShell.
 *
 * NOTE: upload is not wired yet — the anon key can read Storage but cannot write to it
 * (see HANDOFF "STORAGE WRITE BLOCKER"). This screen is display-only for now.
 */

// Friendly per-slot label (mirrors ITEMS_TO_UPLOAD in constants.ts).
const SLOT_LABELS: Record<string, string> = {
  characterFace: 'Character Face',
  topFront: 'Top (Front)', topBack: 'Top (Back)',
  bottomFront: 'Bottom (Front)', bottomBack: 'Bottom (Back)',
  drape: 'Drape', blouse: 'Blouse',
  shoes: 'Shoes',
  accessories: 'Accessories', accessory1: 'Accessory 1', accessory2: 'Accessory 2', sunglasses: 'Sunglasses',
  background: 'Background', productImage: 'Product Image',
};

// Display groups: each maps one or more real slot_keys to a section. Any slot_key not
// listed here falls into a trailing "Other" group so nothing is ever hidden.
const GROUPS: { name: string; slots: string[]; desc: string }[] = [
  { name: 'Character Face', slots: ['characterFace'], desc: 'Model face reference.' },
  { name: 'Garment', slots: ['topFront', 'topBack', 'productImage', 'blouse', 'drape'], desc: 'Primary product images for the selected SKU type.' },
  { name: 'Bottoms', slots: ['bottomFront', 'bottomBack'], desc: 'Trousers, jeans, skirts or shorts to pair with the selected Top.' },
  { name: 'Footwear', slots: ['shoes'], desc: 'Shoes, boots, sandals or heels.' },
  { name: 'Accessories', slots: ['accessories', 'accessory1', 'accessory2', 'sunglasses'], desc: 'Jewellery, bags, belts, watches, sunglasses and styling accessories.' },
  { name: 'Backgrounds', slots: ['background'], desc: 'Studio backgrounds, locations or environmental references.' },
];

function Optional() {
  return (
    <span className="rounded-full border border-wire-border px-2 py-0.5 text-[10px] font-medium text-wire-muted">
      Optional
    </span>
  );
}

/** Empty-state section: header + description + one (display-only) upload placeholder. */
function EmptySection({ name, desc }: { name: string; desc: string }) {
  return (
    <section className="rounded-lg border border-wire-border bg-wire-surface p-5">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-wire-text">{name}</p>
        <Optional />
      </div>
      <p className="mt-0.5 text-xs text-wire-muted">{desc}</p>
      <div className="mt-3 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-wire-border bg-wire-bg px-4 py-7 text-center">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-weak text-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
          </svg>
        </div>
        <p className="text-sm text-wire-muted">No assets in this group yet</p>
        <p className="text-[11px] text-wire-muted">Images or folders</p>
      </div>
    </section>
  );
}

/** Uploaded-state section: header (title · Optional · count) + real thumbnails. */
function UploadedSection({ name, assets }: { name: string; assets: AssetSummary[] }) {
  return (
    <section className="rounded-lg border border-wire-border bg-wire-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-wire-text">{name}</p>
          <Optional />
          <span className="text-xs text-wire-muted">· {assets.length} uploaded</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {assets.map((a) => (
          <div key={a.id} className="group relative h-20 w-20 overflow-hidden rounded-md border border-wire-border bg-wire-bg-2" title={SLOT_LABELS[a.slotKey] || a.slotKey}>
            <img src={a.url} alt={SLOT_LABELS[a.slotKey] || a.slotKey} loading="lazy" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

function ContextNote({ category }: { category: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-wire-border bg-wire-bg px-3 py-2">
      <span className="text-xs text-wire-muted">Asset groups are based on your SKU type:</span>
      <span className="text-sm font-medium text-brand">{category}</span>
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
  const { projects, selectedId } = useProjects();
  const category = projects.find((p) => p.id === selectedId)?.category ?? 'Not set';

  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) { setAssets([]); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    db.loadProjectAssetSummaries(selectedId)
      .then((rows) => { if (!cancelled) setAssets(rows); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load assets'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  // Bucket each real asset into a display group; unknown slots fall into "Other".
  const grouped = useMemo(() => {
    const known = new Set(GROUPS.flatMap((g) => g.slots));
    const sections = GROUPS.map((g) => ({
      name: g.name,
      desc: g.desc,
      assets: assets.filter((a) => g.slots.includes(a.slotKey)),
    }));
    const other = assets.filter((a) => !known.has(a.slotKey));
    if (other.length) {
      sections.push({ name: 'Other', desc: 'Additional uploaded assets.', assets: other });
    }
    return sections;
  }, [assets]);

  const total = assets.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-wire-text">Props &amp; Assets</h2>
        <p className="mt-1 text-sm text-wire-muted">
          {total > 0
            ? `${total} supporting asset${total === 1 ? '' : 's'} uploaded for this project.`
            : 'Optional assets to pair with your SKUs.'}
        </p>
      </div>
      <ContextNote category={category} />

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {!selectedId ? (
        <div className="rounded-lg border border-wire-border bg-wire-surface p-8 text-center text-sm text-wire-muted">
          Select a project to view its assets.
        </div>
      ) : loading ? (
        <div className="rounded-lg border border-wire-border bg-wire-surface p-8 text-center text-sm text-wire-muted">
          Loading assets…
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) =>
            g.assets.length > 0 ? (
              <UploadedSection key={g.name} name={g.name} assets={g.assets} />
            ) : (
              <EmptySection key={g.name} name={g.name} desc={g.desc} />
            ),
          )}
        </div>
      )}

      <ActionBar />
    </div>
  );
}

// The old separate "uploaded" preview route now shows the same real screen.
export function PropsAssetsUploaded() {
  return <PropsAssets />;
}
