import { supabase, supabaseStorage } from '../lib/supabase';
import { Project, ProjectAssets, AssetFile, GenerationBatch, GeneratedImage, SKU } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
  const res = await fetch(`data:${mimeType};base64,${base64}`);
  return res.blob();
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downloadAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
  const blob = await response.blob();
  const data = await blobToBase64(blob);
  return { data, mimeType: blob.type || 'image/jpeg' };
}

function publicUrl(bucket: string, path: string): string {
  return supabaseStorage.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function safeExt(mimeType: string): string {
  return (mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace('png', 'png');
}

// ── Projects ──────────────────────────────────────────────────────────────────

function rowToProject(row: Record<string, any>): Project {
  return {
    id:             row.id,
    name:           row.name,
    createdAt:      row.created_at,
    category:       row.category,
    model:          row.model,
    brandName:      row.brand_name,
    shots:          row.shots || [],
    environment:    row.environment  || '',
    lighting:       row.lighting     || '',
    negativePrompt: row.negative_prompt || '',
    seed:           row.seed ?? undefined,
    fashionType:    row.fashion_type || 'Casual',
    mood:           row.mood         || 'Standard Studio',
  };
}

export async function loadProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('[db] loadProjects:', error.message); return []; }
  return (data || []).map(rowToProject);
}

export async function loadSkuCounts(): Promise<Record<string, number>> {
  // Single lightweight query — pull just project_id for every SKU and tally client-side,
  // so the Projects/Dashboard lists can show real SKU counts without N per-project queries.
  const { data, error } = await supabase.from('skus').select('project_id');
  if (error) { console.error('[db] loadSkuCounts:', error.message); return {}; }
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const pid = (row as { project_id: string }).project_id;
    if (pid) counts[pid] = (counts[pid] || 0) + 1;
  }
  return counts;
}

export async function saveProject(project: Project): Promise<void> {
  const { error } = await supabase.from('projects').upsert({
    id:              project.id,
    name:            project.name,
    created_at:      project.createdAt,
    category:        project.category,
    model:           project.model,
    brand_name:      project.brandName || '',
    shots:           project.shots     || [],
    environment:     project.environment     || '',
    lighting:        project.lighting        || '',
    negative_prompt: project.negativePrompt  || '',
    seed:            project.seed ?? null,
    fashion_type:    project.fashionType || 'Casual',
    mood:            project.mood        || 'Standard Studio',
  });
  if (error) throw new Error(`[db] saveProject: ${error.message}`);
}

export async function deleteProject(id: string): Promise<void> {
  // Collect and delete asset storage files
  const { data: assetRows } = await supabase
    .from('project_assets')
    .select('storage_path')
    .eq('project_id', id);

  if (assetRows?.length) {
    await supabaseStorage.storage.from('project-assets').remove(assetRows.map(r => r.storage_path));
  }

  // Collect and delete generated image storage files
  const { data: batches } = await supabase
    .from('generation_batches')
    .select('id')
    .eq('project_id', id);

  if (batches?.length) {
    const { data: imgRows } = await supabase
      .from('generated_images')
      .select('storage_path')
      .in('batch_id', batches.map(b => b.id))
      .not('storage_path', 'is', null);

    if (imgRows?.length) {
      await supabaseStorage.storage
        .from('generated-images')
        .remove(imgRows.map(r => r.storage_path).filter(Boolean));
    }
  }

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(`[db] deleteProject: ${error.message}`);
}

// ── Project Assets ────────────────────────────────────────────────────────────

export async function uploadProjectAssets(
  projectId: string,
  assets: ProjectAssets,
): Promise<void> {
  await Promise.all(
    Object.entries(assets).flatMap(([slotKey, files]) =>
      (files as AssetFile[]).map(file =>
        uploadAndSaveAsset(projectId, slotKey, file.data, file.mimeType, file.id).catch(e =>
          console.warn(`[db] Failed to upload asset ${file.id}:`, e)
        )
      )
    )
  );
}

export async function uploadAndSaveAsset(
  projectId: string,
  slotKey: string,
  base64: string,
  mimeType: string,
  existingId?: string,
): Promise<AssetFile> {
  const assetId     = existingId || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const storagePath = `${projectId}/${slotKey}/${assetId}.${safeExt(mimeType)}`;

  const blob = await base64ToBlob(base64, mimeType);
  const { error: upErr } = await supabaseStorage.storage
    .from('project-assets')
    .upload(storagePath, blob, { contentType: mimeType, upsert: true });
  if (upErr) throw new Error(`[storage] uploadAsset: ${upErr.message}`);

  const { error: dbErr } = await supabase.from('project_assets').upsert({
    id:           assetId,
    project_id:   projectId,
    slot_key:     slotKey,
    storage_path: storagePath,
    mime_type:    mimeType,
  });
  if (dbErr) throw new Error(`[db] saveAssetMeta: ${dbErr.message}`);

  return { id: assetId, data: base64, mimeType };
}

export async function loadProjectAssets(projectId: string): Promise<ProjectAssets> {
  const { data: rows, error } = await supabase
    .from('project_assets')
    .select('*')
    .eq('project_id', projectId);

  if (error) { console.error('[db] loadProjectAssets:', error.message); return {}; }
  if (!rows?.length) return {};

  const assets: ProjectAssets = {};

  await Promise.all(
    rows.map(async row => {
      try {
        const url = publicUrl('project-assets', row.storage_path);
        const { data, mimeType } = await downloadAsBase64(url);
        if (!assets[row.slot_key]) assets[row.slot_key] = [];
        assets[row.slot_key].push({ id: row.id, data, mimeType });
      } catch (e) {
        console.warn(`[db] Failed to download asset ${row.id}:`, e);
      }
    })
  );

  return assets;
}

export interface AssetSummary {
  id: string;
  slotKey: string;
  url: string; // public URL (project-assets bucket is public-read)
}

// Lightweight read-only loader for the Props & Assets gallery — asset rows + a public
// thumbnail URL per asset, WITHOUT downloading the image bytes (unlike loadProjectAssets).
export async function loadProjectAssetSummaries(projectId: string): Promise<AssetSummary[]> {
  const { data: rows, error } = await supabase
    .from('project_assets')
    .select('id, slot_key, storage_path')
    .eq('project_id', projectId);

  if (error) { console.error('[db] loadProjectAssetSummaries:', error.message); return []; }

  return (rows || [])
    .filter((r) => r.storage_path)
    .map((r) => ({
      id: r.id,
      slotKey: r.slot_key,
      url: publicUrl('project-assets', r.storage_path),
    }));
}

// ── Generation Batches ────────────────────────────────────────────────────────

export async function saveGenerationBatch(batch: GenerationBatch): Promise<void> {
  const { error } = await supabase.from('generation_batches').upsert({
    id:         batch.id,
    project_id: batch.projectId || null,
    sku_id:     batch.skuId    || null,
    timestamp:  batch.timestamp,
    model:      batch.model,
    category:   batch.category,
  });
  if (error) throw new Error(`[db] saveBatch: ${error.message}`);

  await Promise.all(batch.images.map(img => saveGeneratedImage(batch.id, img)));
}

async function saveGeneratedImage(batchId: string, img: GeneratedImage): Promise<void> {
  let storagePath: string | null = null;

  if (img.status === 'success' && img.url) {
    try {
      let base64: string;
      let mimeType = 'image/jpeg';

      if (img.url.startsWith('http')) {
        const dl = await downloadAsBase64(img.url);
        base64 = dl.data; mimeType = dl.mimeType;
      } else if (img.url.startsWith('data:')) {
        const [meta, b64] = img.url.split(',');
        base64 = b64;
        const m = meta.match(/data:([^;]+)/); if (m) mimeType = m[1];
      } else {
        base64 = img.url;
      }

      storagePath = `${batchId}/${img.id}.${safeExt(mimeType)}`;
      const blob = await base64ToBlob(base64, mimeType);
      await supabaseStorage.storage
        .from('generated-images')
        .upload(storagePath, blob, { contentType: mimeType, upsert: true });
    } catch (e) {
      console.warn(`[storage] Failed to upload generated image ${img.id}:`, e);
      storagePath = null;
    }
  }

  await supabase.from('generated_images').upsert({
    id:              img.id,
    batch_id:        batchId,
    status:          img.status,
    prompt:          img.prompt   || null,
    error_message:   img.errorMessage   || null,
    generation_time: img.generationTime || null,
    storage_path:    storagePath,
  });
}

export async function loadProjectBatches(projectId: string): Promise<GenerationBatch[]> {
  const { data, error } = await supabase
    .from('generation_batches')
    .select('*, generated_images(*)')
    .eq('project_id', projectId)
    .order('timestamp', { ascending: false });

  if (error) { console.error('[db] loadBatches:', error.message); return []; }

  return (data || []).map(row => ({
    id:        row.id,
    projectId: row.project_id,
    skuId:     row.sku_id     || undefined,
    timestamp: row.timestamp,
    model:     row.model,
    category:  row.category,
    images:    (row.generated_images || []).map((ir: Record<string, any>): GeneratedImage => ({
      id:             ir.id,
      status:         ir.status,
      prompt:         ir.prompt || '',
      errorMessage:   ir.error_message   || undefined,
      generationTime: ir.generation_time || undefined,
      // storage_path may be: a bucket path (→ public URL), a full external URL
      // (legacy Kie temp links, use as-is), or null (never persisted → no image).
      url:            !ir.storage_path ? undefined
                        : /^https?:\/\//.test(ir.storage_path) ? ir.storage_path
                        : publicUrl('generated-images', ir.storage_path),
    })),
  }));
}

// ── SKUs ──────────────────────────────────────────────────────────────────────

export interface SkuAsset {
  slotKey: string;
  url?: string; // public URL (project-assets bucket is public-read)
}

export interface SkuSummary {
  id: string;
  name: string;
  skuCode?: string;
  createdAt: number;
  slotKeys: string[];
  assets: SkuAsset[];       // one entry per stored slot, with a public thumbnail URL
  thumbUrl?: string;        // public URL of a representative image (front preferred)
}

// Lightweight list loader — SKU rows + their asset slot_keys and a thumbnail URL,
// WITHOUT downloading the image bytes (unlike loadProjectSKUs). SKU assets live in the
// public-read "project-assets" bucket, so a public URL renders directly.
export async function loadSkuSummaries(projectId: string): Promise<SkuSummary[]> {
  const { data: skuRows, error } = await supabase
    .from('skus')
    .select('id, name, sku_code, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) { console.error('[db] loadSkuSummaries:', error.message); return []; }
  if (!skuRows?.length) return [];

  const ids = skuRows.map((r) => r.id);
  const { data: assetRows, error: aErr } = await supabase
    .from('sku_assets')
    .select('sku_id, slot_key, storage_path')
    .in('sku_id', ids);
  if (aErr) console.error('[db] loadSkuSummaries assets:', aErr.message);

  const bySku: Record<string, { slotKeys: string[]; assets: SkuAsset[]; front?: string; any?: string }> = {};
  for (const a of assetRows || []) {
    const row = a as { sku_id: string; slot_key: string; storage_path: string };
    const entry = (bySku[row.sku_id] ||= { slotKeys: [], assets: [] });
    entry.slotKeys.push(row.slot_key);
    entry.assets.push({
      slotKey: row.slot_key,
      url: row.storage_path ? publicUrl('project-assets', row.storage_path) : undefined,
    });
    if (row.storage_path) {
      entry.any ??= row.storage_path;
      if (/front/i.test(row.slot_key)) entry.front ??= row.storage_path;
    }
  }

  return skuRows.map((r) => {
    const entry = bySku[r.id];
    const thumbPath = entry?.front || entry?.any;
    return {
      id: r.id,
      name: r.name,
      skuCode: r.sku_code || undefined,
      createdAt: r.created_at,
      slotKeys: entry?.slotKeys || [],
      assets: entry?.assets || [],
      thumbUrl: thumbPath ? publicUrl('project-assets', thumbPath) : undefined,
    };
  });
}

export async function loadProjectSKUs(projectId: string): Promise<SKU[]> {
  const { data: skuRows, error } = await supabase
    .from('skus')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) { console.error('[db] loadProjectSKUs:', error.message); return []; }
  if (!skuRows?.length) return [];

  const skus: SKU[] = [];
  await Promise.all(
    skuRows.map(async row => {
      const { data: assetRows } = await supabase
        .from('sku_assets')
        .select('*')
        .eq('sku_id', row.id);

      const productAssets: { [slotKey: string]: AssetFile } = {};
      await Promise.all(
        (assetRows || []).map(async (ar: Record<string, any>) => {
          try {
            const url = publicUrl('project-assets', ar.storage_path);
            const { data, mimeType } = await downloadAsBase64(url);
            productAssets[ar.slot_key] = { id: ar.sku_id + '-' + ar.slot_key, data, mimeType };
          } catch (e) {
            console.warn(`[db] Failed to load sku asset ${ar.sku_id}/${ar.slot_key}:`, e);
          }
        })
      );

      skus.push({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        skuCode: row.sku_code || undefined,
        productAssets,
        createdAt: row.created_at,
      });
    })
  );

  return skus.sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveSKU(sku: SKU): Promise<void> {
  const { error } = await supabase.from('skus').upsert({
    id:         sku.id,
    project_id: sku.projectId,
    name:       sku.name,
    sku_code:   sku.skuCode || null,
    created_at: sku.createdAt,
  });
  if (error) throw new Error(`[db] saveSKU: ${error.message}`);
}

export async function uploadSKUAsset(
  skuId: string,
  projectId: string,
  slotKey: string,
  base64: string,
  mimeType: string,
): Promise<AssetFile> {
  const storagePath = `skus/${projectId}/${skuId}/${slotKey}.${safeExt(mimeType)}`;
  const blob = await base64ToBlob(base64, mimeType);

  const { error: upErr } = await supabaseStorage.storage
    .from('project-assets')
    .upload(storagePath, blob, { contentType: mimeType, upsert: true });
  if (upErr) throw new Error(`[storage] uploadSKUAsset: ${upErr.message}`);

  const { error: dbErr } = await supabase.from('sku_assets').upsert({
    sku_id:       skuId,
    slot_key:     slotKey,
    storage_path: storagePath,
    mime_type:    mimeType,
  });
  if (dbErr) throw new Error(`[db] saveSKUAsset: ${dbErr.message}`);

  return { id: `${skuId}-${slotKey}`, data: base64, mimeType };
}

export async function deleteSKU(skuId: string): Promise<void> {
  const { data: assetRows } = await supabase
    .from('sku_assets')
    .select('storage_path')
    .eq('sku_id', skuId);

  if (assetRows?.length) {
    await supabaseStorage.storage.from('project-assets').remove(assetRows.map(r => r.storage_path));
  }

  await supabase.from('skus').delete().eq('id', skuId);
}

export async function deleteGenerationBatch(batchId: string): Promise<void> {
  const { data: imgRows } = await supabase
    .from('generated_images')
    .select('storage_path')
    .eq('batch_id', batchId)
    .not('storage_path', 'is', null);

  if (imgRows?.length) {
    await supabaseStorage.storage
      .from('generated-images')
      .remove(imgRows.map(r => r.storage_path).filter(Boolean));
  }

  await supabase.from('generation_batches').delete().eq('id', batchId);
}
