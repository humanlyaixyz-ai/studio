import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as db from '../../services/dbService';
import type { SkuSummary } from '../../services/dbService';
import type { SKU } from '../../types';
import { useProjects } from './projects';

/**
 * Per-project SKU state for the workspace SKU flow (Add SKU → SKUs list). Loads
 * lightweight summaries (no image bytes) for the selected project, and persists
 * creates (from uploaded files) + deletes to Supabase. Mount <SkusProvider> inside
 * the workspace shell (below <ProjectsProvider>, which provides selectedId).
 */

export interface UploadFile { name: string; data: string; mimeType: string }

interface SkusCtx {
  projectId: string | null;
  skus: SkuSummary[];
  loading: boolean;
  error: string | null;
  uploading: number; // in-flight SKU creations
  reload: () => void;
  addFromFiles: (files: UploadFile[], slotKey: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const Ctx = createContext<SkusCtx | null>(null);

let counter = 0;
function newSkuId(): string {
  counter += 1;
  return `sku-${Date.now()}-${counter}-${(counter * 977).toString(36).slice(-3)}`;
}

export function SkusProvider({ children }: { children: ReactNode }) {
  const { selectedId, reload: reloadProjects } = useProjects();
  const [skus, setSkus] = useState<SkuSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!selectedId) { setSkus([]); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    db.loadSkuSummaries(selectedId)
      .then((rows) => { if (!cancelled) setSkus(rows); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load SKUs'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId, reloadKey]);

  const addFromFiles = useCallback(async (files: UploadFile[], slotKey: string) => {
    if (!selectedId || files.length === 0) return;
    const projectId = selectedId;
    setUploading((n) => n + files.length);

    // Optimistic rows first so the list reflects the new SKUs immediately.
    const created = files.map((f, i) => {
      const base = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim();
      const name = base || `SKU ${skus.length + i + 1}`;
      const sku: SKU = { id: newSkuId(), projectId, name, productAssets: {}, createdAt: Date.now() + i };
      return { sku, file: f };
    });
    setSkus((prev) => [...prev, ...created.map(({ sku }) => ({ id: sku.id, name: sku.name, createdAt: sku.createdAt, slotKeys: [slotKey] }))]);

    setError(null);
    await Promise.all(created.map(async ({ sku, file }) => {
      try {
        await db.saveSKU(sku);
        await db.uploadSKUAsset(sku.id, projectId, slotKey, file.data, file.mimeType);
      } catch (e) {
        console.error('[skus] add:', e);
        setError(e instanceof Error ? e.message : 'Upload failed');
        // Roll back the optimistic row AND the persisted skus row so no orphan is left
        // (storage upload can fail even when the table insert succeeded).
        setSkus((prev) => prev.filter((s) => s.id !== sku.id));
        db.deleteSKU(sku.id).catch(() => { /* best-effort orphan cleanup */ });
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    }));

    reloadProjects(); // refresh SKU counts on Projects/Dashboard
  }, [selectedId, skus.length, reloadProjects]);

  const remove = useCallback(async (id: string) => {
    setSkus((prev) => prev.filter((s) => s.id !== id));
    try { await db.deleteSKU(id); } catch (e) { console.error('[skus] delete:', e); reload(); }
    reloadProjects();
  }, [reload, reloadProjects]);

  const value = useMemo<SkusCtx>(() => ({
    projectId: selectedId, skus, loading, error, uploading, reload, addFromFiles, remove,
  }), [selectedId, skus, loading, error, uploading, reload, addFromFiles, remove]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSkus(): SkusCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSkus must be used within <SkusProvider>');
  return ctx;
}

// ── angle helpers (derive required-angle presence from slot keys) ───────────────
export function hasAngle(slotKeys: string[], angle: 'front' | 'back' | 'detail'): boolean {
  return slotKeys.some((k) => k.toLowerCase().includes(angle));
}
