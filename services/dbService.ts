import { supabase } from '../lib/supabase';
import { Project, ProjectAssets, AssetFile, GenerationBatch, GeneratedImage } from '../types';

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
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
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
    .from('click_projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('[db] loadProjects:', error.message); return []; }
  return (data || []).map(rowToProject);
}

export async function saveProject(project: Project): Promise<void> {
  const { error } = await supabase.from('click_projects').upsert({
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
    .from('click_project_assets')
    .select('storage_path')
    .eq('project_id', id);

  if (assetRows?.length) {
    await supabase.storage.from('project-assets').remove(assetRows.map(r => r.storage_path));
  }

  // Collect and delete generated image storage files
  const { data: batches } = await supabase
    .from('click_generation_batches')
    .select('id')
    .eq('project_id', id);

  if (batches?.length) {
    const { data: imgRows } = await supabase
      .from('click_generated_images')
      .select('storage_path')
      .in('batch_id', batches.map(b => b.id))
      .not('storage_path', 'is', null);

    if (imgRows?.length) {
      await supabase.storage
        .from('generated-images')
        .remove(imgRows.map(r => r.storage_path).filter(Boolean));
    }
  }

  const { error } = await supabase.from('click_projects').delete().eq('id', id);
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
  const { error: upErr } = await supabase.storage
    .from('project-assets')
    .upload(storagePath, blob, { contentType: mimeType, upsert: true });
  if (upErr) throw new Error(`[storage] uploadAsset: ${upErr.message}`);

  const { error: dbErr } = await supabase.from('click_project_assets').upsert({
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
    .from('click_project_assets')
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

// ── Generation Batches ────────────────────────────────────────────────────────

export async function saveGenerationBatch(batch: GenerationBatch): Promise<void> {
  const { error } = await supabase.from('click_generation_batches').upsert({
    id:         batch.id,
    project_id: batch.projectId || null,
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
      await supabase.storage
        .from('generated-images')
        .upload(storagePath, blob, { contentType: mimeType, upsert: true });
    } catch (e) {
      console.warn(`[storage] Failed to upload generated image ${img.id}:`, e);
      storagePath = null;
    }
  }

  await supabase.from('click_generated_images').upsert({
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
    .from('click_generation_batches')
    .select('*, generated_images(*)')
    .eq('project_id', projectId)
    .order('timestamp', { ascending: false });

  if (error) { console.error('[db] loadBatches:', error.message); return []; }

  return (data || []).map(row => ({
    id:        row.id,
    projectId: row.project_id,
    timestamp: row.timestamp,
    model:     row.model,
    category:  row.category,
    images:    (row.generated_images || []).map((ir: Record<string, any>): GeneratedImage => ({
      id:             ir.id,
      status:         ir.status,
      prompt:         ir.prompt || '',
      errorMessage:   ir.error_message   || undefined,
      generationTime: ir.generation_time || undefined,
      url:            ir.storage_path ? publicUrl('generated-images', ir.storage_path) : undefined,
    })),
  }));
}

export async function deleteGenerationBatch(batchId: string): Promise<void> {
  const { data: imgRows } = await supabase
    .from('click_generated_images')
    .select('storage_path')
    .eq('batch_id', batchId)
    .not('storage_path', 'is', null);

  if (imgRows?.length) {
    await supabase.storage
      .from('generated-images')
      .remove(imgRows.map(r => r.storage_path).filter(Boolean));
  }

  await supabase.from('click_generation_batches').delete().eq('id', batchId);
}
