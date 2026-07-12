import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';
import { useProjects } from '../data/projects';
import * as db from '../../services/dbService';
import type { AssetSummary } from '../../services/dbService';

/**
 * PropsAssets — hi-fi build of PropsAssetsWireframe, wired to REAL data + upload.
 * Stacked full-width sections (NOT a grid), one per asset group, derived from the SKU type.
 * Reads the selected project's real `project_assets` via db.loadProjectAssetSummaries
 * (public thumbnail URLs). Each group can UPLOAD images to its primary slot via
 * db.uploadAndSaveAsset (Supabase Storage), then re-reads. Shell provided by WorkspaceShell.
 */

const SLOT_LABELS: Record<string, string> = {
  characterFace: 'Character Face',
  topFront: 'Top (Front)', topBack: 'Top (Back)',
  bottomFront: 'Bottom (Front)', bottomBack: 'Bottom (Back)',
  drape: 'Drape', blouse: 'Blouse',
  shoes: 'Shoes',
  accessories: 'Accessories', accessory1: 'Accessory 1', accessory2: 'Accessory 2', sunglasses: 'Sunglasses',
  background: 'Background', productImage: 'Product Image',
};

// Display groups: each maps one or more real slot_keys to a section; slots[0] is the
// upload target for that group. Unlisted slot_keys fall into a trailing "Other" group.
const GROUPS: { name: string; slots: string[]; desc: string }[] = [
  { name: 'Character Face', slots: ['characterFace'], desc: 'Model face reference.' },
  { name: 'Garment', slots: ['topFront', 'topBack', 'productImage', 'blouse', 'drape'], desc: 'Primary product images for the selected SKU type.' },
  { name: 'Bottoms', slots: ['bottomFront', 'bottomBack'], desc: 'Trousers, jeans, skirts or shorts to pair with the selected Top.' },
  { name: 'Footwear', slots: ['shoes'], desc: 'Shoes, boots, sandals or heels.' },
  { name: 'Accessories', slots: ['accessories', 'accessory1', 'accessory2', 'sunglasses'], desc: 'Jewellery, bags, belts, watches, sunglasses and styling accessories.' },
  { name: 'Backgrounds', slots: ['background'], desc: 'Studio backgrounds, locations or environmental references.' },
];

function readFileAsBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => resolve({ data: (reader.result as string).split(',')[1], mimeType: file.type });
    reader.readAsDataURL(file);
  });
}

function Optional() {
  return (
    <span className="rounded-full border border-wire-border px-2 py-0.5 text-[10px] font-medium text-wire-muted">
      Optional
    </span>
  );
}

const uploadIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
  </svg>
);

/** One asset group: header + real thumbnails (if any) + a working dropzone/uploader. */
function GroupSection({
  name, desc, assets, busy, onPick,
}: {
  name: string; desc: string; assets: AssetSummary[]; busy: boolean; onPick: () => void;
}) {
  return (
    <section className="rounded-lg border border-wire-border bg-wire-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-wire-text">{name}</p>
          <Optional />
          {assets.length > 0 ? <span className="text-xs text-wire-muted">· {assets.length} uploaded</span> : null}
        </div>
        {assets.length > 0 ? (
          <Button variant="secondary" size="sm" onClick={onPick} disabled={busy}>{busy ? 'Uploading…' : 'Add more'}</Button>
        ) : null}
      </div>
      <p className="mt-0.5 text-xs text-wire-muted">{desc}</p>

      {assets.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {assets.map((a) => (
            <div key={a.id} className="group relative h-20 w-20 overflow-hidden rounded-md border border-wire-border bg-wire-bg-2" title={SLOT_LABELS[a.slotKey] || a.slotKey}>
              <img src={a.url} alt={SLOT_LABELS[a.slotKey] || a.slotKey} loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
          {busy ? (
            <div className="grid h-20 w-20 place-items-center rounded-md border border-dashed border-brand-weak-2 bg-brand-weak">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/40 border-t-brand" aria-hidden />
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (!busy) onPick(); }}
          disabled={busy}
          className="mt-3 flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-wire-border bg-wire-bg px-4 py-7 text-center transition-colors hover:border-brand hover:bg-brand-weak disabled:opacity-70"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-weak text-brand">
            {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand/40 border-t-brand" aria-hidden /> : uploadIcon}
          </span>
          <span className="text-sm text-wire-muted">{busy ? 'Uploading…' : <><span className="font-medium text-brand">Click to upload</span> or drag &amp; drop</>}</span>
          <span className="text-[11px] text-wire-muted">Images · saved to this project</span>
        </button>
      )}
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

export default function PropsAssets() {
  const navigate = useNavigate();
  const { projects, selectedId } = useProjects();
  const category = projects.find((p) => p.id === selectedId)?.category ?? 'Not set';

  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyGroup, setBusyGroup] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingSlot = useRef<{ group: string; slot: string } | null>(null);

  const reload = () => {
    if (!selectedId) { setAssets([]); return; }
    setLoading(true);
    setError(null);
    db.loadProjectAssetSummaries(selectedId)
      .then(setAssets)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load assets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    if (!selectedId) { setAssets([]); return; }
    setLoading(true);
    setError(null);
    db.loadProjectAssetSummaries(selectedId)
      .then((rows) => { if (!cancelled) setAssets(rows); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load assets'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const pickFor = (group: string, slot: string) => {
    pendingSlot.current = { group, slot };
    fileInput.current?.click();
  };

  const onFiles = async (fileList: FileList | null) => {
    const p = pendingSlot.current;
    pendingSlot.current = null;
    if (!p || !selectedId || !fileList || fileList.length === 0) return;
    const images = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    setBusyGroup(p.group);
    setError(null);
    try {
      const files = await Promise.all(images.map(readFileAsBase64));
      await Promise.all(files.map((f) => db.uploadAndSaveAsset(selectedId, p.slot, f.data, f.mimeType)));
      reload();
    } catch (e) {
      console.error('[props] upload:', e);
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusyGroup(null);
    }
  };

  const grouped = useMemo(() => {
    const known = new Set(GROUPS.flatMap((g) => g.slots));
    const sections = GROUPS.map((g) => ({
      name: g.name, desc: g.desc, slot: g.slots[0],
      assets: assets.filter((a) => g.slots.includes(a.slotKey)),
    }));
    const other = assets.filter((a) => !known.has(a.slotKey));
    if (other.length) sections.push({ name: 'Other', desc: 'Additional uploaded assets.', slot: 'other', assets: other });
    return sections;
  }, [assets]);

  const total = assets.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }}
      />

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
        <div className="rounded-md border border-danger/40 bg-danger-weak px-3 py-2 text-sm text-wire-text">
          <span className="font-semibold text-danger">Upload failed:</span> {error}
        </div>
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
          {grouped.map((g) => (
            <GroupSection
              key={g.name}
              name={g.name}
              desc={g.desc}
              assets={g.assets}
              busy={busyGroup === g.name}
              onPick={() => pickFor(g.name, g.slot)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-wire-border pt-4">
        <Button variant="secondary" onClick={() => navigate(ROUTES.serviceSetup)}>Go back</Button>
        <Button onClick={() => navigate(ROUTES.generationCanvas)}>Start Generation</Button>
      </div>
    </div>
  );
}

// The old separate "uploaded" preview route now shows the same real screen.
export function PropsAssetsUploaded() {
  return <PropsAssets />;
}
