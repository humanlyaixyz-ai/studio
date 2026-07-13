import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { Button } from '../kit';
import { useProjects } from '../data/projects';
import { useSkus } from '../data/skus';
import * as db from '../../services/dbService';
import { kieService, setKieApiKey } from '../../services/kieService';
import { MODEL_CONFIGS, CATEGORY_POSES } from '../../constants';
import { ModelType, ProductCategory } from '../../types';
import type { GeneratedImage, GenerationBatch, ShotConfig, UploadedFiles, UploadedFile, SKU } from '../../types';

/**
 * Generation Canvas — REAL end-to-end generation for the selected project.
 * Loads the project's SKUs, assembles each SKU's images (+ project-level face/background)
 * into UploadedFiles, runs geminiService.generateTryOn per selected SKU across the chosen
 * shots, streams progress into the stage, and persists each finished batch via
 * db.saveGenerationBatch (→ visible in Output). Requires a Gemini API key (stored locally).
 */

const KEY_LS = 'kie_api_key';

const Ico = ({ d, size = 16, sw = 1.7 }: { d: string; size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);
const IconX = ({ size = 14 }: { size?: number }) => <Ico d="M18 6 6 18M6 6l12 12" size={size} />;
const IconCheck = ({ size = 12 }: { size?: number }) => <Ico d="M20 6 9 17l-5-5" size={size} sw={2.4} />;
const IconSparkle = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" /></svg>
);
const IconImage = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15l4-4 4 4 3-3 4 4" /><circle cx="8.5" cy="9" r="1.3" />
  </svg>
);

// Which UploadedFiles slots we try to fill, and where they come from.
const SKU_SLOTS = ['topFront', 'topBack', 'bottomFront', 'bottomBack', 'shoes', 'accessories', 'sunglasses', 'productImage', 'drape', 'blouse', 'accessory1', 'accessory2'] as const;
const PROJECT_SLOTS = ['characterFace', 'background'] as const;

// Assemble a SKU's UploadedFiles: SKU-level garment images + project-level face/background.
function assembleFiles(sku: SKU, projectAssets: Record<string, { data: string; mimeType: string }[]>): { face?: UploadedFile; files: UploadedFiles } {
  const files: UploadedFiles = {};
  for (const slot of SKU_SLOTS) {
    const a = sku.productAssets[slot];
    if (a) (files as Record<string, UploadedFile>)[slot] = { data: a.data, mimeType: a.mimeType };
  }
  for (const slot of PROJECT_SLOTS) {
    const first = projectAssets[slot]?.[0];
    if (first) (files as Record<string, UploadedFile>)[slot] = { data: first.data, mimeType: first.mimeType };
  }
  const face = files.characterFace;
  return { face, files };
}

function shotsForProject(shots: ShotConfig[] | undefined, category: ProductCategory): ShotConfig[] {
  if (shots && shots.length > 0) return shots;
  const poses = CATEGORY_POSES[category] || CATEGORY_POSES[ProductCategory.TOP] || [];
  return poses.map((prompt) => ({ prompt }));
}

export default function GenerationCanvas() {
  const navigate = useNavigate();
  const { projects, selectedId } = useProjects();
  const { skus } = useSkus();
  const project = projects.find((p) => p.id === selectedId);

  const [panel, setPanel] = useState<'sku' | 'shot' | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [apiKey, setApiKey] = useState<string>(() => (typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_LS) || '' : ''));
  const [keyModal, setKeyModal] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, GeneratedImage[]>>({}); // skuId -> images
  const [lightbox, setLightbox] = useState<{ skuId: string; index: number } | null>(null);

  const category = (project?.category as ProductCategory) || ProductCategory.TOP;
  const model = (project?.model as ModelType) || ModelType.ECOM_SHOOT;
  const modelConfig = MODEL_CONFIGS[model];

  const allShots = useMemo(() => shotsForProject(project?.shots, category), [project?.shots, category]);
  const [shotOn, setShotOn] = useState<Set<number>>(() => new Set(allShots.map((_, i) => i)));
  useEffect(() => { setShotOn(new Set(allShots.map((_, i) => i))); }, [allShots.length]);
  const activeShots = allShots.filter((_, i) => shotOn.has(i));

  const selectedSkus = skus.filter((s) => sel.has(s.id));
  const hasResults = Object.keys(results).length > 0;

  const toggleSku = (id: string) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const saveKey = () => {
    const k = keyDraft.trim();
    setApiKey(k);
    try { localStorage.setItem(KEY_LS, k); } catch { /* ignore */ }
    setKieApiKey(k);
    setKeyModal(false);
  };

  const runGeneration = async () => {
    if (!project || selectedSkus.length === 0 || activeShots.length === 0) return;
    if (!apiKey) { setKeyDraft(''); setKeyModal(true); return; }
    setKieApiKey(apiKey);
    setError(null);
    setGenerating(true);
    setResults({});

    try {
      // Load full SKU data (base64 garment images) + project-level assets (face/background) once.
      const [fullSkus, projectAssets] = await Promise.all([
        db.loadProjectSKUs(project.id),
        db.loadProjectAssets(project.id),
      ]);
      const byId = new Map(fullSkus.map((s) => [s.id, s]));

      for (const summary of selectedSkus) {
        const sku = byId.get(summary.id);
        if (!sku) continue;
        const { face, files } = assembleFiles(sku, projectAssets);

        const batchId = `batch-${Date.now()}-${summary.id.slice(-5)}`;
        const initial: GeneratedImage[] = activeShots.map((shot, i) => ({
          id: `${batchId}-${i}`, status: 'pending', prompt: shot.prompt,
        }));
        setResults((prev) => ({ ...prev, [summary.id]: initial }));

        const settled = { count: 0 };
        const onProgress = (index: number, update: Partial<GeneratedImage>) => {
          setResults((prev) => {
            const arr = [...(prev[summary.id] || initial)];
            arr[index] = { ...arr[index], ...update };
            return { ...prev, [summary.id]: arr };
          });
          if (update.status === 'success' || update.status === 'failed') {
            settled.count += 1;
            if (settled.count === activeShots.length) {
              // Persist the finished batch (uploads successful images to Storage).
              setResults((prev) => {
                const images = prev[summary.id] || initial;
                const batch: GenerationBatch = {
                  id: batchId, projectId: project.id, skuId: summary.id, skuName: summary.name,
                  timestamp: Date.now(), images, model, category,
                };
                db.saveGenerationBatch(batch).catch((e) => console.error('[gen] saveBatch:', e));
                return prev;
              });
            }
          }
        };

        // Fire generation for this SKU across all active shots (progress arrives via callback).
        await kieService.generateTryOn(
          face, files, modelConfig, activeShots,
          project.brandName, category, project.environment, project.lighting,
          undefined, undefined, project.negativePrompt, project.seed,
          project.fashionType, project.mood, onProgress, batchId,
        );
      }
    } catch (e) {
      console.error('[gen] run:', e);
      setError(e instanceof Error ? e.message : 'Generation failed to start');
    } finally {
      // generateTryOn returns once requests are dispatched; keep the spinner briefly, then release.
      setTimeout(() => setGenerating(false), 400);
    }
  };

  const noProject = !selectedId;
  const noSkus = skus.length === 0;

  return (
    <div className="relative h-full min-h-[720px] overflow-hidden rounded-lg border border-wire-border bg-wire-bg">
      {/* ---------- STAGE ---------- */}
      {hasResults ? (
        <div className="absolute inset-0 overflow-y-auto px-8 pb-40 pt-20 ov-scroll">
          <div className="mx-auto max-w-5xl space-y-8">
            {selectedSkus.map((sku) => {
              const imgs = results[sku.id] || [];
              const ok = imgs.filter((i) => i.status === 'success').length;
              return (
                <section key={sku.id}>
                  <div className="mb-3 flex items-center gap-3">
                    <p className="text-sm font-semibold text-wire-text">{sku.name}</p>
                    <span className="text-xs text-wire-muted">{ok}/{imgs.length} images</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                    {imgs.map((img, i) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => img.status === 'success' && setLightbox({ skuId: sku.id, index: i })}
                        className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-wire-border bg-wire-bg-2"
                      >
                        {img.status === 'success' && img.url ? (
                          <img src={img.url} alt={img.prompt} loading="lazy" className="h-full w-full object-cover" />
                        ) : img.status === 'failed' ? (
                          <span className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center text-danger">
                            <Ico d="M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" size={18} />
                            <span className="text-[10px]">Failed</span>
                          </span>
                        ) : (
                          <span className="flex h-full items-center justify-center"><span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-weak-2 border-t-brand" /></span>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-wire-border bg-wire-surface text-brand shadow-card"><IconImage size={30} /></div>
          {noProject ? (
            <><p className="text-xl font-semibold text-wire-text">No project selected</p><p className="text-sm text-wire-muted">Open a project to generate its SKUs.</p></>
          ) : noSkus ? (
            <>
              <p className="text-xl font-semibold text-wire-text">No SKUs to generate</p>
              <p className="text-sm text-wire-muted">Add SKU images first, then come back to generate.</p>
              <Button className="mt-2" onClick={() => navigate(ROUTES.addSku)}>Add SKUs</Button>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-wire-text">{sel.size > 0 ? `${sel.size} SKU${sel.size === 1 ? '' : 's'} ready` : 'Ready to generate'}</p>
              <p className="text-sm text-wire-muted">{sel.size > 0 ? `${activeShots.length} shot${activeShots.length === 1 ? '' : 's'} each · review, then Generate.` : 'Select SKUs, then Generate.'}</p>
              {sel.size === 0 ? <Button className="mt-2" onClick={() => setPanel('sku')}>Select SKUs</Button> : null}
            </>
          )}
        </div>
      )}

      {/* ---------- top bar: project + API key state ---------- */}
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-wire-border bg-wire-surface px-3 py-1.5 shadow-pop">
        <span className="text-sm font-medium text-wire-text">{project?.name || 'Generation'}</span>
        <span className="text-xs text-wire-muted">· {model.replace(/_/g, ' ').toLowerCase()} · {modelConfig.aspectRatio}</span>
        <button type="button" onClick={() => { setKeyDraft(apiKey); setKeyModal(true); }} className={['ml-1 flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium', apiKey ? 'border-ok/40 bg-ok-weak text-ok' : 'border-warn/40 bg-warn-weak text-warn'].join(' ')}>
          <span className={['h-1.5 w-1.5 rounded-full', apiKey ? 'bg-ok' : 'bg-warn'].join(' ')} /> {apiKey ? 'API key set' : 'Add API key'}
        </button>
      </div>

      {error ? (
        <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-md border border-danger/40 bg-danger-weak px-3 py-1.5 text-xs text-wire-text shadow-pop">
          <span className="font-semibold text-danger">Error:</span> {error}
        </div>
      ) : null}

      {/* ---------- bottom column: popover + action bar ---------- */}
      <div className="absolute bottom-5 left-1/2 z-10 flex w-full max-w-[calc(100%-2.5rem)] -translate-x-1/2 flex-col gap-3" style={{ width: 1000 }}>
        {panel ? (
          <div className="flex max-h-[380px] flex-col overflow-hidden rounded-xl border border-wire-border bg-wire-surface shadow-pop">
            {panel === 'sku' ? (
              <>
                <div className="flex items-center justify-between border-b border-wire-border px-4 py-3">
                  <p className="text-sm font-semibold text-wire-text">Select SKUs</p>
                  <div className="flex items-center gap-3 text-xs">
                    <button type="button" onClick={() => setSel(new Set(skus.map((s) => s.id)))} className="font-medium text-brand hover:underline">Select all</button>
                    <button type="button" onClick={() => setSel(new Set())} className="text-wire-muted hover:underline">Clear</button>
                    <button type="button" onClick={() => setPanel(null)} aria-label="Close" className="text-wire-muted hover:text-wire-text"><IconX /></button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3 ov-scroll">
                  {skus.length === 0 ? (
                    <p className="py-8 text-center text-sm text-wire-muted">No SKUs in this project yet.</p>
                  ) : (
                    <div className="grid grid-cols-5 gap-3">
                      {skus.map((s) => {
                        const on = sel.has(s.id);
                        return (
                          <button key={s.id} type="button" onClick={() => toggleSku(s.id)} className={['relative rounded-lg border bg-wire-surface p-2 text-left transition-all', on ? 'border-brand ring-1 ring-brand' : 'border-wire-border hover:border-wire-border-strong'].join(' ')}>
                            <span className={['absolute right-3 top-3 z-10 flex h-4 w-4 items-center justify-center rounded border', on ? 'border-brand bg-brand text-white' : 'border-wire-border-strong bg-wire-surface text-transparent'].join(' ')}><IconCheck size={10} /></span>
                            <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-md border border-wire-border bg-wire-bg text-wire-faint">
                              {s.thumbUrl ? <img src={s.thumbUrl} alt={s.name} className="h-full w-full object-cover" /> : <IconImage size={22} />}
                            </div>
                            <p className="mt-2 truncate text-sm font-medium text-wire-text" title={s.name}>{s.name}</p>
                            <p className="text-[11px] text-wire-muted">{s.slotKeys.length} image{s.slotKeys.length === 1 ? '' : 's'}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="border-t border-wire-border p-3">
                  <Button className="w-full" onClick={() => setPanel(null)}>Done · {sel.size} selected</Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-wire-border px-4 py-3">
                  <p className="text-sm font-semibold text-wire-text">Shots to generate <span className="text-wire-muted">· {activeShots.length}/{allShots.length}</span></p>
                  <button type="button" onClick={() => setPanel(null)} aria-label="Close" className="text-wire-muted hover:text-wire-text"><IconX /></button>
                </div>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 ov-scroll">
                  {allShots.map((shot, i) => (
                    <button key={i} type="button" onClick={() => setShotOn((p) => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; })} className={['flex w-full items-start gap-2 rounded-lg border p-3 text-left', shotOn.has(i) ? 'border-brand bg-brand-weak' : 'border-wire-border bg-wire-surface'].join(' ')}>
                      <span className={['mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border', shotOn.has(i) ? 'border-brand bg-brand text-white' : 'border-wire-border-strong bg-wire-surface text-transparent'].join(' ')}><IconCheck size={10} /></span>
                      <span className="text-xs text-wire-text">{shot.prompt}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* Action bar */}
        <div className="flex items-center justify-between rounded-2xl border border-wire-border bg-wire-surface px-4 py-3 shadow-pop">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPanel((c) => (c === 'sku' ? null : 'sku'))} className={['flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium', panel === 'sku' ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-text hover:border-wire-border-strong'].join(' ')}>
              Select SKUs
              <span className={['flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px]', sel.size ? 'bg-brand text-white' : 'border border-wire-border text-wire-muted'].join(' ')}>{sel.size}</span>
            </button>
            <button type="button" onClick={() => setPanel((c) => (c === 'shot' ? null : 'shot'))} className={['flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium', panel === 'shot' ? 'border-brand bg-brand-weak text-brand' : 'border-wire-border bg-wire-surface text-wire-text hover:border-wire-border-strong'].join(' ')}>
              Shots <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full border border-wire-border px-1 text-[11px] text-wire-muted">{activeShots.length}</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {selectedSkus.length > 0 ? (
              <span className="text-[11px] text-wire-muted">{selectedSkus.length} SKU × {activeShots.length} shots = <span className="font-medium text-wire-text">{selectedSkus.length * activeShots.length}</span> images</span>
            ) : null}
            <Button onClick={runGeneration} disabled={generating || selectedSkus.length === 0 || activeShots.length === 0}>
              {generating ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Generating…</> : <><IconSparkle size={16} /> Generate</>}
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- API key modal ---------- */}
      {keyModal ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(8,8,8,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl border border-wire-border bg-wire-surface p-6 shadow-pop">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-wire-text">Kie API key</p>
                <p className="mt-1 text-sm text-wire-muted">Generation uses Kie.ai (nano-banana-pro). Your key is stored locally in this browser only.</p>
              </div>
              <button type="button" onClick={() => setKeyModal(false)} aria-label="Close" className="text-wire-muted hover:text-wire-text"><IconX /></button>
            </div>
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="Bearer token…"
              className="mt-4 w-full rounded-md border border-wire-border bg-wire-bg px-3 py-2 text-sm text-wire-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setKeyModal(false)}>Cancel</Button>
              <Button onClick={saveKey} disabled={!keyDraft.trim()}>Save key</Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------- lightbox ---------- */}
      {lightbox && results[lightbox.skuId]?.[lightbox.index]?.url ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(8,8,8,0.6)' }} onClick={() => setLightbox(null)}>
          <div className="relative max-h-full max-w-3xl overflow-hidden rounded-2xl border border-wire-border bg-wire-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
            <img src={results[lightbox.skuId][lightbox.index].url} alt="" className="max-h-[80vh] w-full object-contain" />
            <div className="flex items-center justify-between border-t border-wire-border p-3">
              <p className="line-clamp-1 text-xs text-wire-muted">{results[lightbox.skuId][lightbox.index].prompt}</p>
              <div className="flex items-center gap-2">
                <a href={results[lightbox.skuId][lightbox.index].url} download={`ovarly-${lightbox.skuId}-${lightbox.index}.png`} target="_blank" rel="noopener" className="rounded-md border border-wire-border px-3 py-1.5 text-sm text-wire-text hover:border-brand hover:text-brand">Download</a>
                <button type="button" onClick={() => setLightbox(null)} className="rounded-md bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-hover">Close</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
