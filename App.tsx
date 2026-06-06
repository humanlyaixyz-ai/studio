import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ImageUploadCard from './components/ImageUploadCard';
import ModelSelection from './components/ModelSelection';
import CategorySelection from './components/CategorySelection';
import PoseEditor from './components/PoseEditor';
import CameraSettings from './components/CameraSettings';
import { Dashboard } from './pages/Dashboard';
import { CreateProject } from './pages/CreateProject';
import { BulkConfirmOverlay } from './components/BulkConfirmOverlay';
import { BulkResultsCanvas } from './components/BulkResultsCanvas';
import { ImageEditPanel } from './components/ImageEditPanel';
import { ModelType, UploadedFiles, GeneratedImage, ProductCategory, GenerationBatch, ActiveGenerationMeta, Project, StylingConfig, CameraConfig, ShotConfig, ApiProvider, AssetFile, SKU } from './types';
import { geminiService, refineImageDetails, setGeminiApiKey } from './services/geminiService';
import { kieService, setKieApiKey } from './services/kieService';
import * as db from './services/dbService';
import { createSolidColorBase64, applyColorGrading, ColorAdjustments, urlToBase64 } from './utils/imageUtils';
import {
  ITEMS_TO_UPLOAD,
  IMAGES_PER_GENERATION,
  MODEL_CONFIGS,
  CATEGORY_POSES,
  LIFESTYLE_POSES,
  CREATIVE_POSES,
  EDITORIAL_HIGH_FASHION_POSES,
  PRESET_BACKGROUNDS,
  NON_FASHION_CATEGORIES,
  FASHION_TYPES,
  MOODS
} from './constants';

const PRODUCT_SLOT_KEYS: Partial<Record<ProductCategory, string[]>> = {
  [ProductCategory.TOP]:     ['topFront', 'topBack'],
  [ProductCategory.JACKET]:  ['topFront', 'topBack'],
  [ProductCategory.COAT]:    ['topFront', 'topBack'],
  [ProductCategory.SWEATER]: ['topFront', 'topBack'],
  [ProductCategory.ETHNIC]:  ['topFront', 'topBack'],
  [ProductCategory.BOTTOM]:  ['bottomFront', 'bottomBack'],
  [ProductCategory.DRESS]:   ['topFront', 'topBack', 'bottomFront', 'bottomBack'],
  [ProductCategory.SAREE]:   ['drape', 'blouse', 'accessory1', 'accessory2'],
  [ProductCategory.SHOES]:       ['shoes'],
  [ProductCategory.ACCESSORIES]: ['accessories'],
};

const ITEM_LABELS: Record<string, string> = Object.fromEntries(
  ITEMS_TO_UPLOAD.map(i => [i.key, i.label])
);

function getAllSlotsForCategory(category: ProductCategory) {
  const isNonFashion = NON_FASHION_CATEGORIES.includes(category);
  const isSaree = category === ProductCategory.SAREE;
  const productKeys = new Set(PRODUCT_SLOT_KEYS[category] || []);
  const sareeFields = ['drape', 'blouse', 'accessory1', 'accessory2'];
  return ITEMS_TO_UPLOAD.filter(item => {
    if (!isSaree && sareeFields.includes(item.key)) return false;
    if (isSaree && ['topFront', 'topBack', 'bottomBack', 'accessories', 'sunglasses', 'shoes'].includes(item.key)) return false;
    if (isNonFashion) return item.key === 'productImage' || item.key === 'background';
    if (item.key === 'productImage') return false;
    return true;
  }).map(item => ({ key: item.key, label: item.label, required: isNonFashion ? item.key === 'productImage' : productKeys.has(item.key) }));
}

interface SKUAddFormProps {
  productKeys: string[];
  itemLabels: Record<string, string>;
  ws: { border: string; gold: string; bg: string; surfHi: string; txtPri: string; txtSec: string };
  onAdd: (name: string, code: string, assets: { [k: string]: { data: string; mimeType: string } }) => void;
}
function SKUAddForm({ productKeys, itemLabels, ws: WS, onAdd }: SKUAddFormProps) {
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newAssets, setNewAssets] = useState<{ [k: string]: { data: string; mimeType: string } }>({});
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="SKU name (e.g. Navy Blue M)" style={{ flex: 2, background: 'transparent', border: `1px solid ${WS.border}`, borderRadius: 4, color: WS.txtPri, fontSize: 11, fontFamily: 'inherit', padding: '7px 10px', outline: 'none' }} onFocus={e => (e.target.style.borderColor = WS.gold)} onBlur={e => (e.target.style.borderColor = WS.border)} />
        <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Code (opt.)" style={{ flex: 1, background: 'transparent', border: `1px solid ${WS.border}`, borderRadius: 4, color: WS.txtPri, fontSize: 11, fontFamily: 'inherit', padding: '7px 10px', outline: 'none' }} onFocus={e => (e.target.style.borderColor = WS.gold)} onBlur={e => (e.target.style.borderColor = WS.border)} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {productKeys.map(slotKey => {
          const existing = newAssets[slotKey];
          return (
            <label key={slotKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <div style={{ width: 52, height: 52, borderRadius: 4, border: `1px dashed ${existing ? WS.gold : WS.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: existing ? 'transparent' : WS.bg }}>
                {existing ? (
                  <img src={`data:${existing.mimeType};base64,${existing.data}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={slotKey} />
                ) : (
                  <svg viewBox="0 0 12 12" fill="none" stroke={WS.txtSec} strokeWidth="1.2" style={{ width: 14, height: 14 }}><path d="M6 2v8M2.5 5.5L6 2l3.5 3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </div>
              <span style={{ fontSize: 8, color: WS.txtSec }}>{itemLabels[slotKey] || slotKey}</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => setNewAssets(prev => ({ ...prev, [slotKey]: { data: (reader.result as string).split(',')[1], mimeType: file.type } }));
                reader.readAsDataURL(file);
              }} />
            </label>
          );
        })}
      </div>
      <button
        onClick={() => {
          if (!newName.trim() && Object.keys(newAssets).length === 0) return;
          onAdd(newName, newCode, newAssets);
          setNewName(''); setNewCode(''); setNewAssets({});
        }}
        style={{ padding: '8px 18px', background: WS.gold, color: WS.bg, border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start', transition: 'opacity 0.12s' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >Add SKU</button>
    </div>
  );
}

function App() {
  // --- Project State ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
  const [view, setView] = useState<'dashboard' | 'create' | 'workspace'>('dashboard');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'inputs' | 'settings' | 'camera' | 'shots' | 'skus' | null>(null);

  // --- SKU State ---
  const [skus, setSkus] = useState<SKU[]>([]);
  const [activeSKUId, setActiveSKUId] = useState<string | null>(null);
  const [bulkSelectedSKUIds, setBulkSelectedSKUIds] = useState<Set<string>>(new Set());
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; skuName: string } | null>(null);
  const [bulkRunId, setBulkRunId] = useState<string | null>(null);
  const [bulkRunSKUs, setBulkRunSKUs] = useState<SKU[]>([]);
  const [bulkCurrentSKUId, setBulkCurrentSKUId] = useState<string | null>(null);
  const [showBulkOverlay, setShowBulkOverlay] = useState(false);

  // --- Configuration State (Used for both Creation Form & Active Workspace) ---
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.ECOM_SHOOT);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(ProductCategory.TOP);
  const [brandName, setBrandName] = useState<string>('');

  // Replaced simple string array with ShotConfig array
  const [currentShots, setCurrentShots] = useState<ShotConfig[]>([]);

  // New Configs
  const [projectEnvironment, setProjectEnvironment] = useState<string>('');
  const [projectLighting, setProjectLighting] = useState<string>('');
  const [projectNegativePrompt, setProjectNegativePrompt] = useState<string>('');
  const [projectSeed, setProjectSeed] = useState<number | undefined>(undefined);
  const [projectFashionType, setProjectFashionType] = useState<string>('Casual');
  const [projectMood, setProjectMood] = useState<string>('Standard Studio');

  const [stylingConfig, setStylingConfig] = useState<StylingConfig>({
    materialDescription: '', // Consolidated
  });

  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    framing: '',
    angle: '',
    focalLength: ''
  });

  // --- Global Settings ---
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [kieApiKey, setKieApiKeyState] = useState<string>(() => localStorage.getItem('kie_api_key') || '');
  const [apiProvider, setApiProvider] = useState<ApiProvider>('google');

  // --- Generation & UI State ---
  const [activeGenerationMeta, setActiveGenerationMeta] = useState<ActiveGenerationMeta | null>(null);
  const [liveGenerationImages, setLiveGenerationImages] = useState<GeneratedImage[]>([]);

  const [generationHistory, setGenerationHistory] = useState<GenerationBatch[]>([]);
  const [viewingHistoryBatchId, setViewingHistoryBatchId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Edit panel state
  const [selectedImageForEditIndex, setSelectedImageForEditIndex] = useState<number | null>(null);

  const [isZipping, setIsZipping] = useState(false);

  const outputPreviewRef = useRef<HTMLDivElement>(null);
  const errorContainerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Load projects from Supabase on mount
  useEffect(() => {
    db.loadProjects()
      .then(setProjects)
      .catch(e => console.error('[app] Failed to load projects:', e))
      .finally(() => setIsLoadingProjects(false));
  }, []);

  // When active SKU changes, load its product assets into uploadedFiles (product slots only)
  useEffect(() => {
    if (!activeSKUId || !activeProject) return;
    const sku = skus.find(s => s.id === activeSKUId);
    if (!sku) return;
    const productKeys = new Set<string>(PRODUCT_SLOT_KEYS[activeProject.category] || []);
    setUploadedFiles(prev => {
      const updated = { ...prev };
      // Clear existing product slots, then fill from SKU
      productKeys.forEach(k => delete updated[k as keyof UploadedFiles]);
      Object.entries(sku.productAssets).forEach(([k, f]: [string, AssetFile]) => {
        if (productKeys.has(k)) updated[k as keyof UploadedFiles] = { data: f.data, mimeType: f.mimeType };
      });
      return updated;
    });
  }, [activeSKUId, skus, activeProject]);

  // Update API Key
  useEffect(() => {
    setGeminiApiKey(apiKey);
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  // Update Kie API Key
  useEffect(() => {
    setKieApiKey(kieApiKey);
    localStorage.setItem('kie_api_key', kieApiKey);
  }, [kieApiKey]);

  // Set Default Poses ONLY when Creating a Project
  useEffect(() => {
    if (!isCreatingProject && activeProject) return;

    let posesToUse: string[] = [];
    switch (selectedModel) {
      case ModelType.LIFESTYLE_SHOOT:
        posesToUse = LIFESTYLE_POSES[selectedCategory];
        break;
      case ModelType.CREATIVE_SHOOT:
        posesToUse = CREATIVE_POSES[selectedCategory];
        break;
      case ModelType.EDITORIAL_HIGH_FASHION:
        posesToUse = EDITORIAL_HIGH_FASHION_POSES[selectedCategory];
        break;
      case ModelType.ECOM_SHOOT:
      default:
        posesToUse = CATEGORY_POSES[selectedCategory];
        break;
    }

    if (!posesToUse || posesToUse.length === 0) {
      posesToUse = CATEGORY_POSES[selectedCategory] || [];
    }

    const initialPrompts = Array.from({ length: IMAGES_PER_GENERATION }, (_, i) => posesToUse[i % posesToUse.length]);

    // Map string prompts to ShotConfig objects
    setCurrentShots(initialPrompts.map(prompt => ({ prompt })));
  }, [selectedModel, selectedCategory, isCreatingProject, activeProject]);

  // Auto-Save Prompts when editing in Workspace
  useEffect(() => {
    if (activeProject && !isCreatingProject) {
      // Only update if there's a meaningful change to prevent loops
      const isDifferent = JSON.stringify(activeProject.shots) !== JSON.stringify(currentShots);

      if (isDifferent) {
        const updatedProject = { ...activeProject, shots: currentShots };
        setActiveProject(updatedProject);
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      }
    }
  }, [currentShots, activeProject, isCreatingProject]);

  // (History is persisted to Supabase on generation complete — see effect below)

  useEffect(() => {
    if (error && errorContainerRef.current) {
      errorContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  // Process Completed Generations
  useEffect(() => {
    if (activeGenerationMeta && liveGenerationImages.length > 0) {
      const allImagesFinalized = liveGenerationImages.every(
        (img) => img.status === 'success' || img.status === 'failed'
      );

      if (allImagesFinalized) {
        const isBatchAlreadyInHistory = generationHistory.some(batch => batch.id === activeGenerationMeta.id);

        if (!isBatchAlreadyInHistory) {
          const newBatch: GenerationBatch = {
            id: activeGenerationMeta.id,
            projectId: activeGenerationMeta.projectId,
            timestamp: Date.now(),
            images: liveGenerationImages,
            model: activeGenerationMeta.model,
            category: activeGenerationMeta.category,
          };
          setGenerationHistory(prev => [newBatch, ...prev]);
          setViewingHistoryBatchId(activeGenerationMeta.id);
          // Persist to Supabase (upload images to Storage + save metadata)
          db.saveGenerationBatch(newBatch).catch(e =>
            console.error('[app] Failed to save generation batch:', e)
          );
        }
        setActiveGenerationMeta(null);
        setLiveGenerationImages([]);
      }
    }
  }, [liveGenerationImages, activeGenerationMeta, generationHistory]);


  // --- Logic & Handlers ---

  const handleStartCreateProject = () => {
    setActiveProject(null);
    setIsCreatingProject(true);
    setView('create');
    // Reset form to defaults
    setSelectedCategory(ProductCategory.TOP);
    setSelectedModel(ModelType.ECOM_SHOOT);
    setBrandName('');
    setProjectEnvironment('');
    setProjectLighting('');
    setProjectNegativePrompt('');
    setProjectSeed(undefined);
    setProjectFashionType('Casual');
    setProjectMood('Standard Studio');
    // Poses will auto-reset via effect
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setView('create');
  };

  const handleDeleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    db.deleteProject(id).catch(e => console.error('[app] deleteProject:', e));
  }, []);

  const handleSaveProject = () => {
    if (!selectedCategory || !selectedModel) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: `${brandName ? brandName : 'Untitled'} - ${selectedCategory}`,
      createdAt: Date.now(),
      category: selectedCategory,
      model: selectedModel,
      brandName: brandName,
      shots: currentShots, // Save full shot configs
      environment: projectEnvironment,
      lighting: projectLighting,
      negativePrompt: projectNegativePrompt,
      seed: projectSeed,
      fashionType: projectFashionType,
      mood: projectMood
    };

    setProjects(prev => [newProject, ...prev]);
    handleLoadProject(newProject);
    setIsCreatingProject(false);
    setView('workspace');
  };

  const handleLoadProject = async (project: Project) => {
    setIsCreatingProject(false);
    setActiveProject(project);
    setView('workspace');
    setGenerationHistory([]);
    setSkus([]);
    setActiveSKUId(null);

    // Sync config immediately
    setSelectedCategory(project.category);
    setSelectedModel(project.model);
    setBrandName(project.brandName);

    if (project.shots) {
      setCurrentShots(project.shots);
    } else if (project.posePrompts) {
      setCurrentShots(project.posePrompts.map(p => ({ prompt: p })));
    } else {
      setCurrentShots([]);
    }

    setProjectEnvironment(project.environment || '');
    setProjectLighting(project.lighting || '');
    setProjectNegativePrompt(project.negativePrompt || '');
    setProjectSeed(project.seed);
    setProjectFashionType(project.fashionType || 'Casual');
    setProjectMood(project.mood || 'Standard Studio');
    setStylingConfig({ materialDescription: '' });
    setCameraConfig({ framing: '', angle: '', focalLength: '' });
    setLiveGenerationImages([]);
    setViewingHistoryBatchId(null);
    setError(null);
    setUploadedFiles({});

    // Load assets + history + SKUs from Supabase in parallel
    setIsLoadingProject(true);
    try {
      const [assets, history, loadedSkus] = await Promise.all([
        db.loadProjectAssets(project.id),
        db.loadProjectBatches(project.id),
        db.loadProjectSKUs(project.id),
      ]);
      setSkus(loadedSkus);

      setActiveProject(prev => prev ? { ...prev, assets } : prev);
      setGenerationHistory(history);

      // Pre-populate uploadedFiles from supporting assets (non-product slots)
      if (Object.keys(assets).length > 0) {
        const productKeys = new Set<string>(PRODUCT_SLOT_KEYS[project.category] || []);
        const preloaded: UploadedFiles = {};
        Object.entries(assets).forEach(([key, files]) => {
          if (!productKeys.has(key) && files.length > 0) {
            preloaded[key as keyof UploadedFiles] = { data: files[0].data, mimeType: files[0].mimeType };
          }
        });
        setUploadedFiles(preloaded);
      }
    } catch (e) {
      console.error('[app] Failed to load project data from Supabase:', e);
    } finally {
      setIsLoadingProject(false);
    }
  };

  // --- SKU Handlers ---

  const handleSelectSKU = useCallback((skuId: string) => {
    setActiveSKUId(prev => prev === skuId ? null : skuId);
  }, []);

  const handleAddSKU = useCallback(async (name: string, skuCode: string, productAssets: { [k: string]: { data: string; mimeType: string } }) => {
    if (!activeProject) return;
    const newSKU: SKU = {
      id: `sku-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: activeProject.id,
      name: name || `SKU ${skus.length + 1}`,
      skuCode: skuCode || undefined,
      productAssets: {},
      createdAt: Date.now(),
    };
    setSkus(prev => [...prev, newSKU]);
    setActiveSKUId(newSKU.id);
    try {
      await db.saveSKU(newSKU);
      const uploadedAssets: { [k: string]: AssetFile } = {};
      await Promise.all(
        Object.entries(productAssets).map(async ([slotKey, f]) => {
          const asset = await db.uploadSKUAsset(newSKU.id, activeProject.id, slotKey, f.data, f.mimeType);
          uploadedAssets[slotKey] = asset;
        })
      );
      setSkus(prev => prev.map(s => s.id === newSKU.id ? { ...s, productAssets: uploadedAssets } : s));
    } catch (e) {
      console.error('[app] handleAddSKU:', e);
    }
  }, [activeProject, skus]);

  const handleBulkAddSKUs = useCallback(async (files: { name: string; data: string; mimeType: string }[], primarySlot: string) => {
    if (!activeProject) return;
    for (const file of files) {
      const skuName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      await handleAddSKU(skuName, '', { [primarySlot]: { data: file.data, mimeType: file.mimeType } });
    }
  }, [activeProject, handleAddSKU]);

  const handleDeleteSKU = useCallback((skuId: string) => {
    setSkus(prev => prev.filter(s => s.id !== skuId));
    if (activeSKUId === skuId) setActiveSKUId(null);
    setBulkSelectedSKUIds(prev => { const n = new Set(prev); n.delete(skuId); return n; });
    db.deleteSKU(skuId).catch(e => console.error('[app] deleteSKU:', e));
  }, [activeSKUId]);

  const handleBulkGenerate = useCallback(async () => {
    if (!activeProject || bulkSelectedSKUIds.size < 2) return;
    if (apiProvider === 'google' && !apiKey) { setError('Gemini API Key required.'); return; }
    if (apiProvider === 'kie' && !kieApiKey) { setError('Kie.ai API Key required.'); return; }

    const selectedSKUs = skus.filter(s => bulkSelectedSKUIds.has(s.id));
    const runId = `bulk-${Date.now()}`;
    const productKeys = new Set<string>(PRODUCT_SLOT_KEYS[selectedCategory] || []);

    const supportingAssets: UploadedFiles = {};
    Object.entries(uploadedFiles).forEach(([k, v]) => {
      if (!productKeys.has(k)) supportingAssets[k as keyof UploadedFiles] = v as UploadedFiles[keyof UploadedFiles];
    });

    setShowBulkOverlay(false);
    setBulkRunId(runId);
    setBulkRunSKUs(selectedSKUs);
    setIsBulkGenerating(true);
    setError(null);
    setWorkspaceTab(null);
    setViewingHistoryBatchId(null);

    for (let i = 0; i < selectedSKUs.length; i++) {
      const sku = selectedSKUs[i];
      setBulkProgress({ current: i + 1, total: selectedSKUs.length, skuName: sku.name });
      setBulkCurrentSKUId(sku.id);

      const skuFiles: UploadedFiles = { ...supportingAssets };
      Object.entries(sku.productAssets).forEach(([k, f]: [string, AssetFile]) => {
        if (productKeys.has(k)) skuFiles[k as keyof UploadedFiles] = { data: f.data, mimeType: f.mimeType };
      });

      const batchId = `${runId}-${i}`;
      const tracker: GeneratedImage[] = currentShots.map((shot, idx) => ({
        id: `${batchId}-${idx}`, prompt: shot.prompt, status: 'pending' as const,
      }));

      setLiveGenerationImages([...tracker]);

      const localProgress = (index: number, update: Partial<GeneratedImage>) => {
        tracker[index] = { ...tracker[index], ...update };
        setLiveGenerationImages([...tracker]);
      };

      try {
        const modelConfig = MODEL_CONFIGS[selectedModel];
        if (apiProvider === 'kie') {
          await kieService.generateTryOn(skuFiles.characterFace, skuFiles, modelConfig, currentShots, brandName, selectedCategory, activeProject.environment, activeProject.lighting, stylingConfig, cameraConfig, activeProject.negativePrompt, activeProject.seed, activeProject.fashionType, activeProject.mood, localProgress, batchId);
        } else {
          await geminiService.generateTryOn(skuFiles.characterFace, skuFiles, modelConfig, currentShots, brandName, selectedCategory, activeProject.environment, activeProject.lighting, stylingConfig, cameraConfig, activeProject.negativePrompt, activeProject.seed, activeProject.fashionType, activeProject.mood, localProgress);
        }
      } catch (e: any) {
        tracker.forEach((img, idx) => {
          if (img.status === 'pending' || img.status === 'generating') {
            tracker[idx] = { ...img, status: 'failed', errorMessage: e.message || 'Generation failed' };
          }
        });
        setLiveGenerationImages([...tracker]);
      }

      const completedBatch: GenerationBatch = {
        id: batchId,
        projectId: activeProject.id,
        skuId: sku.id,
        skuName: sku.name,
        bulkRunId: runId,
        timestamp: Date.now(),
        images: [...tracker],
        model: selectedModel,
        category: selectedCategory,
      };
      setGenerationHistory(prev => [completedBatch, ...prev]);
      db.saveGenerationBatch(completedBatch).catch(e => console.error('[app] bulk saveGenerationBatch:', e));
    }

    setBulkCurrentSKUId(null);
    setLiveGenerationImages([]);
    setIsBulkGenerating(false);
    setBulkProgress(null);
  }, [activeProject, bulkSelectedSKUIds, skus, selectedCategory, uploadedFiles, currentShots, selectedModel, brandName, stylingConfig, cameraConfig, apiProvider, apiKey, kieApiKey]);

  const handleBackToProjects = () => {
    setActiveProject(null);
    setIsCreatingProject(false);
    setView('dashboard');
    setBulkRunId(null);
    setBulkRunSKUs([]);
    setBulkCurrentSKUId(null);
    setShowBulkOverlay(false);
  };

  const bulkBatches = useMemo(() =>
    bulkRunId ? generationHistory.filter(b => b.bulkRunId === bulkRunId) : [],
    [generationHistory, bulkRunId]
  );

  const handleRetryBulkShot = useCallback(async (batchId: string, imageIndex: number) => {
    const batch = generationHistory.find(b => b.id === batchId);
    if (!batch || !activeProject) return;

    const productKeys = new Set<string>(PRODUCT_SLOT_KEYS[selectedCategory] || []);
    const sku = batch.skuId ? skus.find(s => s.id === batch.skuId) : null;

    const supportingAssets: UploadedFiles = {};
    Object.entries(uploadedFiles).forEach(([k, v]) => {
      if (!productKeys.has(k)) supportingAssets[k as keyof UploadedFiles] = v as UploadedFiles[keyof UploadedFiles];
    });

    const skuFiles: UploadedFiles = { ...supportingAssets };
    if (sku) {
      Object.entries(sku.productAssets).forEach(([k, f]: [string, AssetFile]) => {
        if (productKeys.has(k)) skuFiles[k as keyof UploadedFiles] = { data: f.data, mimeType: f.mimeType };
      });
    }

    const patchHistory = (update: Partial<GeneratedImage>) => {
      setGenerationHistory(prev => prev.map(b => b.id !== batchId ? b : {
        ...b,
        images: b.images.map((img, i) => i === imageIndex ? { ...img, ...update } : img),
      }));
    };

    patchHistory({ status: 'generating', errorMessage: undefined });

    const shot = currentShots[imageIndex] || { prompt: batch.images[imageIndex]?.prompt || '' };

    try {
      const modelConfig = MODEL_CONFIGS[selectedModel];
      if (apiProvider === 'kie') {
        await kieService.generateSingleTryOnImage(skuFiles.characterFace, skuFiles, modelConfig, shot, brandName, selectedCategory, activeProject.environment, activeProject.lighting, stylingConfig, cameraConfig, activeProject.negativePrompt, activeProject.seed, activeProject.fashionType, activeProject.mood, imageIndex, (_i, update) => patchHistory(update), batchId);
      } else {
        await geminiService.generateSingleTryOnImage(skuFiles.characterFace, skuFiles, modelConfig, shot, brandName, selectedCategory, activeProject.environment, activeProject.lighting, stylingConfig, cameraConfig, activeProject.negativePrompt, activeProject.seed, activeProject.fashionType, activeProject.mood, imageIndex, (_i, update) => patchHistory(update));
      }
    } catch (e: any) {
      patchHistory({ status: 'failed', errorMessage: e.message || 'Retry failed' });
    }
  }, [generationHistory, activeProject, selectedCategory, skus, uploadedFiles, currentShots, selectedModel, brandName, stylingConfig, cameraConfig, apiProvider, apiKey, kieApiKey]);

  const handleDownloadSKU = useCallback(async (batchId: string, skuName: string) => {
    const batch = generationHistory.find(b => b.id === batchId);
    if (!batch) return;
    const successImages = batch.images.filter(img => img.status === 'success' && img.url);
    if (!successImages.length) return;
    // @ts-ignore
    const zip = new window.JSZip();
    await Promise.all(successImages.map(async (img, i) => {
      try {
        const blob = await (await fetch(img.url!)).blob();
        zip.file(`${skuName}_Shot_${String(i + 1).padStart(2, '0')}.jpg`, blob);
      } catch {}
    }));
    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url; a.download = `${skuName}_shots.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  }, [generationHistory]);

  const handleDownloadAllSKUs = useCallback(async () => {
    if (!bulkBatches.length) return;
    // @ts-ignore
    const zip = new window.JSZip();
    await Promise.all(bulkBatches.map(async batch => {
      const name = batch.skuName || batch.id;
      const folder = zip.folder(name);
      await Promise.all(batch.images.filter(img => img.status === 'success' && img.url).map(async (img, i) => {
        try {
          const blob = await (await fetch(img.url!)).blob();
          folder?.file(`Shot_${String(i + 1).padStart(2, '0')}.jpg`, blob);
        } catch {}
      }));
    }));
    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url; a.download = `bulk_run_${Date.now()}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  }, [bulkBatches]);

  const handleFileUpload = useCallback((key: keyof UploadedFiles, base64: string, mimeType: string) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: { data: base64, mimeType } }));
    setError(null);

    if (activeProject) {
      // Optimistic: add temp asset to project library
      const tempId = `tmp-${Date.now()}`;
      const tempAsset: AssetFile = { id: tempId, data: base64, mimeType };
      setActiveProject(prev => prev ? {
        ...prev,
        assets: { ...prev.assets, [key]: [...(prev.assets?.[key] || []), tempAsset] },
      } : prev);

      // Persist to Supabase in background, replace temp with real id
      db.uploadAndSaveAsset(activeProject.id, key, base64, mimeType)
        .then(saved => {
          setActiveProject(prev => {
            if (!prev) return prev;
            const updated = (prev.assets?.[key] || []).map(f => f.id === tempId ? saved : f);
            return { ...prev, assets: { ...prev.assets, [key]: updated } };
          });
        })
        .catch(e => console.error('[app] Failed to save asset:', e));
    }
  }, [activeProject]);

  const handleRemoveUpload = (key: keyof UploadedFiles) => {
    setUploadedFiles((prev) => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  const handlePresetBackgroundSelect = (color: string) => {
    const base64 = createSolidColorBase64(color);
    handleFileUpload('background', base64, 'image/jpeg');
  };

  // Validation
  const isFormValid = useMemo(() => {
    if (!activeProject) return false;

    if (NON_FASHION_CATEGORIES.includes(selectedCategory)) {
      return uploadedFiles.productImage !== undefined;
    }

    if (!uploadedFiles.characterFace) return false;

    switch (selectedCategory) {
      case ProductCategory.TOP:
      case ProductCategory.JACKET:
      case ProductCategory.COAT:
      case ProductCategory.SWEATER:
      case ProductCategory.ETHNIC:
        return (uploadedFiles.topFront !== undefined || uploadedFiles.topBack !== undefined);
      case ProductCategory.BOTTOM:
        return (uploadedFiles.bottomFront !== undefined || uploadedFiles.bottomBack !== undefined);
      case ProductCategory.DRESS:
        return uploadedFiles.topFront !== undefined;
      case ProductCategory.SHOES:
        return uploadedFiles.shoes !== undefined;
      case ProductCategory.ACCESSORIES:
        return uploadedFiles.accessories !== undefined;
      case ProductCategory.SAREE:
        return uploadedFiles.characterFace !== undefined && uploadedFiles.drape !== undefined && uploadedFiles.blouse !== undefined;
      default:
        return false;
    }
  }, [uploadedFiles, selectedCategory, activeProject]);

  const displayedImages: GeneratedImage[] = useMemo(() => {
    if (viewingHistoryBatchId) {
      return generationHistory.find(batch => batch.id === viewingHistoryBatchId)?.images || [];
    }
    return liveGenerationImages;
  }, [viewingHistoryBatchId, generationHistory, liveGenerationImages]);

  // Filtered History for Dropdown
  const projectHistory = useMemo(() => {
    if (activeProject) {
      return generationHistory.filter(b => b.projectId === activeProject.id);
    }
    return generationHistory;
  }, [generationHistory, activeProject]);

  const handleUpdateDisplayedImage = useCallback((index: number, update: Partial<GeneratedImage>) => {
    if (viewingHistoryBatchId) {
      setGenerationHistory(prevHistory => prevHistory.map(batch => {
        if (batch.id === viewingHistoryBatchId) {
          return {
            ...batch,
            images: batch.images.map((img, i) => (i === index ? { ...img, ...update } : img))
          };
        }
        return batch;
      }));
    } else {
      setLiveGenerationImages((prev) =>
        prev.map((img, i) => (i === index ? { ...img, ...update } : img))
      );
    }
  }, [viewingHistoryBatchId]);

  const handleLiveProgressUpdate = useCallback((index: number, update: Partial<GeneratedImage>) => {
    setLiveGenerationImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, ...update } : img))
    );
  }, []);

  const handleGenerateTryOn = useCallback(async () => {
    if (apiProvider === 'kie') {
      if (!kieApiKey) {
        setError('Kie.ai API Key required.');
        return;
      }
    } else {
      if (!apiKey) {
        setError('Gemini API Key required.');
        return;
      }
    }

    if (!isFormValid) {
      setError('Missing required items for this category.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setBulkRunId(null);
    setBulkRunSKUs([]);

    const newBatchId = Date.now().toString();
    setActiveGenerationMeta({
      id: newBatchId,
      model: selectedModel,
      category: selectedCategory,
      projectId: activeProject?.id
    });
    setViewingHistoryBatchId(null);

    const initialImages: GeneratedImage[] = currentShots.map((shot, i) => ({
      id: `${newBatchId}-${i}`,
      prompt: shot.prompt,
      status: 'pending',
    }));
    setLiveGenerationImages(initialImages);

    if (outputPreviewRef.current) {
      outputPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    try {
      const modelConfig = MODEL_CONFIGS[selectedModel];

      if (apiProvider === 'kie') {
        await kieService.generateTryOn(
          uploadedFiles.characterFace,
          uploadedFiles,
          modelConfig,
          currentShots,
          brandName,
          selectedCategory,
          activeProject?.environment,
          activeProject?.lighting,
          stylingConfig,
          cameraConfig,
          activeProject?.negativePrompt,
          activeProject?.seed,
          activeProject?.fashionType,
          activeProject?.mood,
          handleLiveProgressUpdate,
          newBatchId
        );
      } else {
        await geminiService.generateTryOn(
          uploadedFiles.characterFace,
          uploadedFiles,
          modelConfig,
          currentShots, // Pass ShotConfig array
          brandName,
          selectedCategory,
          activeProject?.environment,
          activeProject?.lighting,
          stylingConfig,
          cameraConfig,
          activeProject?.negativePrompt,
          activeProject?.seed,
          activeProject?.fashionType,
          activeProject?.mood,
          handleLiveProgressUpdate
        );
      }
    } catch (e: any) {
      const errorMessage = e.message || `Generation failed.`;
      setError(errorMessage);
      setLiveGenerationImages(prev => prev.map(img =>
        img.status === 'pending' || img.status === 'generating' ? { ...img, status: 'failed', errorMessage: errorMessage } : img
      ));
    } finally {
      setIsLoading(false);
    }
  }, [uploadedFiles, selectedModel, selectedCategory, brandName, apiKey, handleLiveProgressUpdate, currentShots, isFormValid, activeProject, stylingConfig, cameraConfig]);

  // Refine, Retry, Edit, Color Grading handlers
  const handleRefineImage = useCallback(async (index: number) => {
    if (apiProvider === 'kie') {
      if (!kieApiKey) { setError('Kie API Key required.'); return; }
    } else {
      if (!apiKey) { setError('API Key required.'); return; }
    }
    const imageToRefine = displayedImages[index];
    if (!imageToRefine || !imageToRefine.url || imageToRefine.status !== 'success') return;

    handleUpdateDisplayedImage(index, { status: 'refining', errorMessage: undefined });
    setError(null);
    const startTime = Date.now();

    try {
      const modelConfig = MODEL_CONFIGS[selectedModel];

      // Ensure we have base64 data, converting from URL if necessary
      let imageInput = '';
      let mimeType = 'image/jpeg'; // Default

      if (apiProvider === 'kie' && imageToRefine.url.startsWith('http')) {
        // Direct URL for Kie
        imageInput = imageToRefine.url;
      } else {
        // Base64 for Gemini or fallback
        if (imageToRefine.url.startsWith('http')) {
          imageInput = await urlToBase64(imageToRefine.url);
          if (imageToRefine.url.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        } else {
          imageInput = imageToRefine.url.split(',')[1];
          mimeType = imageToRefine.url.split(';')[0].split(':')[1];
        }
      }

      let refinedUrl = '';
      if (apiProvider === 'kie') {
        refinedUrl = await kieService.refineImageDetails(
          imageInput,
          mimeType,
          uploadedFiles,
          modelConfig.imageSize as '4K',
          modelConfig.aspectRatio as '1:1' | '3:4' | '4:3' | '9:16' | '16:9',
          modelConfig.model
        );
      } else {
        const base64ForGemini = imageInput.startsWith('http') ? await urlToBase64(imageInput) : imageInput;
        refinedUrl = await refineImageDetails(
          base64ForGemini,
          mimeType,
          uploadedFiles,
          modelConfig.imageSize as '4K',
          modelConfig.aspectRatio as '1:1' | '3:4' | '4:3' | '9:16' | '16:9',
          modelConfig.model
        );
      }
      const duration = Date.now() - startTime;
      handleUpdateDisplayedImage(index, { status: 'success', url: refinedUrl, errorMessage: undefined, generationTime: duration });
    } catch (e: any) {
      setError(e.message);
      handleUpdateDisplayedImage(index, { status: 'failed', errorMessage: e.message });
    }
  }, [displayedImages, apiKey, uploadedFiles, selectedModel, handleUpdateDisplayedImage]);

  const handleRetryImage = useCallback(async (index: number) => {
    if (apiProvider === 'kie') {
      if (!kieApiKey) { setError('Kie API Key required.'); return; }
    } else {
      if (!apiKey) { setError('API Key required.'); return; }
    }
    const imageToRetry = displayedImages[index];
    if (!imageToRetry) return;

    handleUpdateDisplayedImage(index, { status: 'generating', errorMessage: undefined });
    setError(null);

    try {
      const modelConfig = MODEL_CONFIGS[selectedModel];
      // Find the specific shot config for this index
      const shot = currentShots[index] || { prompt: imageToRetry.prompt };

      if (apiProvider === 'kie') {
        await kieService.generateSingleTryOnImage(
          uploadedFiles.characterFace,
          uploadedFiles,
          modelConfig,
          shot,
          brandName,
          selectedCategory,
          activeProject?.environment,
          activeProject?.lighting,
          stylingConfig,
          cameraConfig,
          activeProject?.negativePrompt,
          activeProject?.seed,
          activeProject?.fashionType,
          activeProject?.mood,
          index,
          handleUpdateDisplayedImage,
          imageToRetry.id.split('-')[0] // Extract batchId from the original image ID
        );
      } else {
        await geminiService.generateSingleTryOnImage(
          uploadedFiles.characterFace,
          uploadedFiles,
          modelConfig,
          shot, // Pass the ShotConfig
          brandName,
          selectedCategory,
          activeProject?.environment,
          activeProject?.lighting,
          stylingConfig,
          cameraConfig,
          activeProject?.negativePrompt,
          activeProject?.seed,
          activeProject?.fashionType,
          activeProject?.mood,
          index,
          handleUpdateDisplayedImage
        );
      }
    } catch (e: any) {
      handleUpdateDisplayedImage(index, { status: 'failed', errorMessage: e.message || 'Retry failed.' });
    }
  }, [displayedImages, apiKey, selectedModel, uploadedFiles, brandName, handleUpdateDisplayedImage, selectedCategory, activeProject, stylingConfig, cameraConfig, currentShots]);

  const handlePanelApplyEdit = useCallback(async (
    index: number,
    prompt: string,
    references: { id: string; data: string; mimeType: string }[],
    originalKeys: string[]
  ) => {
    const imageToEdit = displayedImages[index];
    if (!imageToEdit || !imageToEdit.url || !prompt.trim()) return;

    handleUpdateDisplayedImage(index, { status: 'generating' });
    const startTime = Date.now();

    try {
      let imageInput = '';
      if (apiProvider === 'kie' && imageToEdit.url.startsWith('http')) {
        imageInput = imageToEdit.url;
      } else {
        imageInput = imageToEdit.url.startsWith('http')
          ? await urlToBase64(imageToEdit.url)
          : imageToEdit.url.split(',')[1];
      }

      const referenceImages = [
        ...references.map(r => ({ data: r.data, mimeType: r.mimeType })),
        ...originalKeys.map(key => {
          const item = uploadedFiles[key as keyof UploadedFiles];
          return item ? { data: item.data, mimeType: item.mimeType } : null;
        }).filter(Boolean) as { data: string; mimeType: string }[]
      ];

      let currentAspectRatio: any = '3:4';
      if (viewingHistoryBatchId) {
        const batch = generationHistory.find(b => b.id === viewingHistoryBatchId);
        if (batch) currentAspectRatio = MODEL_CONFIGS[batch.model].aspectRatio;
      } else if (activeGenerationMeta) {
        currentAspectRatio = MODEL_CONFIGS[activeGenerationMeta.model].aspectRatio;
      } else {
        currentAspectRatio = MODEL_CONFIGS[selectedModel].aspectRatio;
      }

      let editedBase64 = '';
      if (apiProvider === 'kie') {
        editedBase64 = await kieService.editImage(imageInput, prompt, referenceImages, currentAspectRatio);
      } else {
        const base64ForGemini = imageInput.startsWith('http') ? await urlToBase64(imageInput) : imageInput;
        editedBase64 = await geminiService.editImage(base64ForGemini, prompt, referenceImages, currentAspectRatio);
      }
      handleUpdateDisplayedImage(index, { status: 'success', url: editedBase64, prompt, generationTime: Date.now() - startTime });
    } catch (e: any) {
      handleUpdateDisplayedImage(index, { status: 'failed', errorMessage: e.message });
    }
  }, [displayedImages, handleUpdateDisplayedImage, uploadedFiles, viewingHistoryBatchId, generationHistory, activeGenerationMeta, selectedModel, apiProvider]);

  const handlePanelApplyColorGrading = useCallback((index: number, newBase64: string) => {
    handleUpdateDisplayedImage(index, { url: `data:image/jpeg;base64,${newBase64}` });
  }, [handleUpdateDisplayedImage]);

  const handleDownloadImage = useCallback((imageUrl: string | undefined, filename: string) => {
    if (!imageUrl) return;

    fetch(imageUrl)
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((e) => {
        console.warn("Download via blob failed (likely CORS), falling back to direct link:", e);
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  }, []);

  const handleBulkDownload = useCallback(async () => {
    const successImages = displayedImages.filter(img => img.status === 'success' && img.url);
    if (successImages.length === 0) return;
    setIsZipping(true);
    try {
      // @ts-ignore
      const zip = new window.JSZip();
      const folder = zip.folder("virtual_shoot_images");
      await Promise.all(successImages.map(async (img, i) => {
        if (!img.url) return;
        try {
          const blob = await (await fetch(img.url)).blob();
          folder?.file(`image_${i + 1}.jpg`, blob);
        } catch (e) { }
      }));
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shoot_batch_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) { setError("Zip Failed"); } finally { setIsZipping(false); }
  }, [displayedImages]);

  const handleViewHistoryBatch = useCallback((batchId: string) => {
    setViewingHistoryBatchId(batchId);
    setSelectedImageForEditIndex(null);
    if (outputPreviewRef.current) outputPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleViewCurrentGeneration = useCallback(() => {
    setViewingHistoryBatchId(null);
    setBulkRunId(null);
    setBulkRunSKUs([]);
    setBulkCurrentSKUId(null);
    if (outputPreviewRef.current) outputPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleClearHistory = useCallback(() => {
    // Delete all project batches from Supabase in background
    projectHistory.forEach(batch => {
      db.deleteGenerationBatch(batch.id).catch(e =>
        console.error('[app] deleteGenerationBatch:', e)
      );
    });
    setGenerationHistory([]);
    if (viewingHistoryBatchId !== null) handleViewCurrentGeneration();
  }, [viewingHistoryBatchId, handleViewCurrentGeneration, projectHistory]);


  const imagesToGenerateCount = currentShots.length;
  const completedImagesCount = liveGenerationImages.filter(img => img.status === 'success').length;

  const currentOutputTitle = useMemo(() => {
    if (viewingHistoryBatchId) {
      const batch = generationHistory.find(b => b.id === viewingHistoryBatchId);
      return batch ? `Archive: ${new Date(parseInt(batch.id, 10)).toLocaleDateString()}` : 'Archive';
    }
    return activeGenerationMeta ? 'Generating...' : activeProject ? activeProject.name : 'Output';
  }, [viewingHistoryBatchId, generationHistory, activeGenerationMeta, activeProject]);

  // ── Dashboard view ────────────────────────────────────────
  if (view === 'dashboard') {
    return (
      <Dashboard
        projects={projects}
        onCreateProject={handleStartCreateProject}
        onOpenProject={handleLoadProject}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        apiProvider={apiProvider}
        onProviderChange={setApiProvider}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        kieApiKey={kieApiKey}
        onKieApiKeyChange={setKieApiKeyState}
      />
    );
  }

  // ── Create / Edit Project view ────────────────────────────
  if (view === 'create') {
    return (
      <CreateProject
        onBack={() => { setView('dashboard'); setEditingProject(null); }}
        initialProject={editingProject ?? undefined}
        onSave={async (data, editId) => {
          if (editId) {
            const existing = projects.find(p => p.id === editId);
            const updated: Project = { ...existing, ...data, id: editId, createdAt: existing?.createdAt || Date.now() };
            setProjects(prev => prev.map(p => p.id === editId ? updated : p));
            // Persist metadata to Supabase (assets already saved on upload)
            db.saveProject(updated).catch(e => console.error('[app] saveProject(edit):', e));
            setView('dashboard');
            setEditingProject(null);
          } else {
            const newProject: Project = { ...data, id: Date.now().toString(), createdAt: Date.now() };
            setProjects(prev => [newProject, ...prev]);
            // Save project metadata to Supabase
            try {
              await db.saveProject(newProject);
              // Upload any assets built in CreateProject
              if (newProject.assets && Object.keys(newProject.assets).length > 0) {
                db.uploadProjectAssets(newProject.id, newProject.assets)
                  .catch(e => console.error('[app] uploadProjectAssets:', e));
              }
            } catch (e) {
              console.error('[app] saveProject(create):', e);
            }
            handleLoadProject(newProject);
          }
        }}
      />
    );
  }

    // ── Workspace view ────────────────────────────────────────────
  const WS = {
    bg: '#0A0908', surface: '#111010', surfHi: '#161412',
    border: '#1C1A18', borderHi: '#2C2A28',
    txtPri: '#E8E3DC', txtSec: '#5A5550', txtMid: '#8A8580', gold: '#C8A97A',
  };

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: WS.bg, height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', color: WS.txtPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Sora:wght@300;400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
*:hover > .bulk-dl-btn, .bulk-dl-btn:hover { opacity: 1 !important; }
      `}</style>

      {/* ── Top slim bar ── */}
      <header style={{ height: 50, borderBottom: `1px solid ${WS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, background: WS.bg, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: WS.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#0A0908" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
              <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
            </svg>
          </div>
          <button onClick={handleBackToProjects} style={{ fontSize: 10, color: WS.txtSec, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em', transition: 'color 0.12s', padding: 0 }} onMouseEnter={e => (e.currentTarget.style.color = WS.txtPri)} onMouseLeave={e => (e.currentTarget.style.color = WS.txtSec)}>
            ← Dashboard
          </button>
          {activeProject && (
            <>
              <span style={{ color: WS.border }}>·</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: WS.txtMid }}>{activeProject.name}</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* History */}
          {projectHistory.length > 0 && (
            <div style={{ position: 'relative' }} className="history-wrap">
              <button style={{ fontSize: 10, color: WS.txtSec, background: 'none', border: `1px solid transparent`, borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = WS.border; (e.currentTarget as HTMLElement).style.color = WS.txtMid; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = WS.txtSec; }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 11, height: 11 }}><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2 1.5" strokeLinecap="round"/></svg>
                History
              </button>
              <div className="history-dropdown" style={{ display: 'none', position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 220, background: WS.surface, border: `1px solid ${WS.border}`, borderRadius: 6, padding: 6, zIndex: 60, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px 8px', borderBottom: `1px solid ${WS.border}`, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: WS.txtSec, letterSpacing: '0.08em' }}>RECENT</span>
                  <button onClick={handleClearHistory} style={{ fontSize: 9, color: '#E57373', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear all</button>
                </div>
                {projectHistory.map(batch => (
                  <button key={batch.id} onClick={() => handleViewHistoryBatch(batch.id)} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget.style.background = WS.surfHi)} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <div>
                      <div style={{ fontSize: 11, color: WS.txtPri, fontWeight: 500 }}>{batch.skuName || new Date(parseInt(batch.id)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div style={{ fontSize: 9, color: WS.txtSec }}>{batch.skuName ? new Date(batch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' : ''}{batch.model.replace(/_/g, ' ')}</div>
                    </div>
                    <svg viewBox="0 0 12 12" fill="none" stroke={WS.txtSec} strokeWidth="1.4" style={{ width: 10, height: 10 }}><path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                ))}
              </div>
              <style>{`.history-wrap:hover .history-dropdown { display: block !important; }`}</style>
            </div>
          )}

          {/* Bulk run status */}
          {isBulkGenerating && bulkProgress && (
            <span style={{ fontSize: 10, color: WS.gold }}>
              Bulk {bulkProgress.current}/{bulkProgress.total} · {liveGenerationImages.filter(i => i.status === 'success').length + bulkBatches.reduce((s, b) => s + b.images.filter(i => i.status === 'success').length, 0)} shots done
            </span>
          )}
          {bulkRunId && !isBulkGenerating && (
            <span style={{ fontSize: 10, color: WS.txtSec }}>
              Bulk complete · {bulkBatches.reduce((s, b) => s + b.images.filter(i => i.status === 'success').length, 0)}/{bulkRunSKUs.length * currentShots.length} shots
            </span>
          )}
          {bulkRunId && !isBulkGenerating && bulkBatches.some(b => b.images.some(i => i.status === 'success')) && (
            <button
              onClick={handleDownloadAllSKUs}
              style={{ fontSize: 10, color: WS.txtSec, background: 'none', border: `1px solid ${WS.border}`, borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = WS.borderHi; (e.currentTarget as HTMLElement).style.color = WS.txtMid; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = WS.border; (e.currentTarget as HTMLElement).style.color = WS.txtSec; }}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" style={{ width: 11, height: 11 }}>
                <path d="M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" strokeLinecap="round"/>
                <path d="M7 1v8M4.5 6.5L7 9l2.5-2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download all SKUs
            </button>
          )}
          {viewingHistoryBatchId && (
            <button onClick={handleViewCurrentGeneration} style={{ fontSize: 10, color: WS.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>← Live</button>
          )}

          <button onClick={handleBulkDownload} disabled={isZipping || !displayedImages.some(img => img.status === 'success' && img.url)} style={{ fontSize: 10, color: WS.txtSec, background: 'none', border: `1px solid ${WS.border}`, borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s', opacity: (isZipping || !displayedImages.some(img => img.status === 'success' && img.url)) ? 0.3 : 1 }} onMouseEnter={e => { if (!isZipping) { (e.currentTarget as HTMLElement).style.borderColor = WS.borderHi; (e.currentTarget as HTMLElement).style.color = WS.txtMid; } }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = WS.border; (e.currentTarget as HTMLElement).style.color = WS.txtSec; }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" style={{ width: 11, height: 11 }}><path d="M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" strokeLinecap="round"/><path d="M7 1v8M4.5 6.5L7 9l2.5-2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {isZipping ? 'Zipping…' : 'Download'}
          </button>
        </div>
      </header>

      {/* ── Main canvas ── */}
      <main ref={outputPreviewRef} style={{ flex: 1, overflowY: 'auto', position: 'relative', paddingBottom: workspaceTab ? 340 : 90 }}>

        {/* Empty: no project */}
        {!activeProject && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={WS.txtSec} strokeWidth="1" style={{ width: 48, height: 48, marginBottom: 12 }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
            <p style={{ fontSize: 12, color: WS.txtMid }}>Open a project to begin</p>
          </div>
        )}

        {/* Project loading spinner */}
        {isLoadingProject && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
            <div style={{ width: 36, height: 36, border: `2px solid ${WS.borderHi}`, borderTopColor: WS.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 14 }} />
            <p style={{ fontSize: 11, color: WS.txtSec }}>Loading assets…</p>
          </div>
        )}

        {/* Empty: project but no images */}
        {activeProject && displayedImages.length === 0 && !isLoading && !isLoadingProject && !bulkRunId && !isBulkGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: `1px solid ${WS.borderHi}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={WS.txtSec} strokeWidth="1" style={{ width: 28, height: 28 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/></svg>
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic', fontWeight: 400, color: WS.txtPri, marginBottom: 8 }}>Ready to generate</h3>
            <p style={{ fontSize: 11, color: WS.txtMid, marginBottom: 6 }}>Upload your assets, then hit Generate.</p>
            <p style={{ fontSize: 10, color: WS.txtSec }}>Open <strong style={{ color: WS.gold }}>Inputs</strong> from the bar below to upload.</p>
          </div>
        )}

        {/* Generating spinner overlay */}
        {isLoading && displayedImages.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
            <div style={{ width: 40, height: 40, border: `3px solid ${WS.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
            <p style={{ fontSize: 12, color: WS.txtMid }}>Generating…</p>
          </div>
        )}

        {/* ── Bulk run canvas (live + results) ── */}
        {bulkRunId && bulkRunSKUs.length > 0 && (
          <BulkResultsCanvas
            runSKUs={bulkRunSKUs}
            batches={bulkBatches}
            currentSKUId={bulkCurrentSKUId}
            liveImages={liveGenerationImages}
            shotCount={currentShots.length || 1}
            primarySlot={(() => {
              const keys = PRODUCT_SLOT_KEYS[selectedCategory] || [];
              return keys[0] || 'productImage';
            })()}
            isBulkGenerating={isBulkGenerating}
            onRetryShot={handleRetryBulkShot}
            onDownloadImage={handleDownloadImage}
            onDownloadSKU={handleDownloadSKU}
            onSelectImage={url => {
              setLiveGenerationImages([{ id: 'bulk-select', prompt: '', status: 'success', url }]);
              setViewingHistoryBatchId(null);
              setBulkRunId(null);
            }}
          />
        )}

        {/* Images grid */}
        {!bulkRunId && displayedImages.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, padding: 24 }}>
            {displayedImages.map((image, index) => (
              <div key={image.id} className="ws-img-card" style={{ position: 'relative' }}>
                <div
                  style={{ aspectRatio: '3/4', background: WS.surfHi, borderRadius: 8, overflow: 'hidden', position: 'relative', border: `1px solid ${selectedImageForEditIndex === index ? WS.gold : WS.border}`, cursor: image.status === 'success' ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
                  onClick={() => image.status === 'success' && setSelectedImageForEditIndex(index)}
                >
                  {image.url ? (
                    <img src={image.url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="Generated" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {image.status === 'pending' && <span style={{ fontSize: 10, color: WS.txtSec }}>Pending…</span>}
                      {(image.status === 'generating' || image.status === 'refining') && (
                        <div style={{ width: 20, height: 20, border: `2px solid ${image.status === 'refining' ? WS.gold : WS.txtMid}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      )}
                      {image.status === 'failed' && <span style={{ fontSize: 10, color: '#E57373', textAlign: 'center', padding: '0 12px' }}>Failed</span>}
                    </div>
                  )}

                  {/* Editing/regenerating overlay */}
                  {image.url && (image.status === 'generating' || image.status === 'refining') && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,9,8,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 22, height: 22, border: `2px solid ${WS.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    </div>
                  )}

                  {/* Failed overlay */}
                  {image.status === 'failed' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(60,26,26,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12, textAlign: 'center' }}>
                      <p style={{ fontSize: 9, color: '#F2B8B5', marginBottom: 8, lineHeight: 1.5 }}>{image.errorMessage}</p>
                      <button onClick={e => { e.stopPropagation(); handleRetryImage(index); }} style={{ padding: '4px 12px', background: '#F2B8B5', color: '#602020', border: 'none', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
                  <span style={{ fontSize: 9, color: WS.txtSec, fontVariantNumeric: 'tabular-nums' }}>IMG_{String(index + 1).padStart(2, '0')}</span>
                  {image.generationTime && (
                    <span style={{ fontSize: 9, color: WS.txtSec }}>{(image.generationTime / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Bulk confirm overlay ── */}
      {showBulkOverlay && activeProject && (() => {
        const productKeys = new Set<string>(PRODUCT_SLOT_KEYS[selectedCategory] || []);
        const supportingSlots = getAllSlotsForCategory(selectedCategory)
          .filter(s => !productKeys.has(s.key));
        const primarySlot = (PRODUCT_SLOT_KEYS[selectedCategory] || [])[0] || 'productImage';
        const selectedSKUs = skus.filter(s => bulkSelectedSKUIds.has(s.id));
        return (
          <BulkConfirmOverlay
            skus={selectedSKUs}
            uploadedFiles={uploadedFiles}
            supportingSlotLabels={supportingSlots.map(s => ({ key: s.key, label: s.label }))}
            shotCount={currentShots.length}
            primarySlot={primarySlot}
            onGenerate={handleBulkGenerate}
            onCancel={() => setShowBulkOverlay(false)}
            onRemoveSKU={skuId => {
              setBulkSelectedSKUIds(prev => { const n = new Set(prev); n.delete(skuId); return n; });
            }}
          />
        );
      })()}

      {/* ── Bottom panel (expands up) ── */}
      {workspaceTab && activeProject && (
        <div style={{ position: 'absolute', bottom: 68, left: '50%', transform: 'translateX(-50%)', width: 820, maxWidth: '96vw', maxHeight: '52vh', background: WS.surface, border: `1px solid ${WS.borderHi}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 -12px 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', zIndex: 40 }}>

          {/* Panel header */}
          <div style={{ padding: '11px 20px', borderBottom: `1px solid ${WS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: WS.txtSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              {workspaceTab === 'inputs' ? 'Image Inputs' : workspaceTab === 'settings' ? 'Settings' : workspaceTab === 'camera' ? 'Camera' : workspaceTab === 'shots' ? 'Shot List' : 'SKUs'}
            </span>
            <button onClick={() => setWorkspaceTab(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WS.txtSec, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, transition: 'color 0.1s' }} onMouseEnter={e => (e.currentTarget.style.color = WS.txtPri)} onMouseLeave={e => (e.currentTarget.style.color = WS.txtSec)}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 10, height: 10 }}><path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, scrollbarWidth: 'thin' as const, scrollbarColor: `${WS.border} transparent` }}>

            {/* INPUTS TAB */}
            {workspaceTab === 'inputs' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
                {getAllSlotsForCategory(selectedCategory).map(slot => {
                  const projectFiles = (activeProject?.assets?.[slot.key] || []) as AssetFile[];
                  const currentFile = uploadedFiles[slot.key as keyof UploadedFiles];
                  return (
                    <div key={slot.key}>
                      <div style={{ fontSize: 10, color: WS.txtSec, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {slot.label}
                        {slot.required && <span style={{ color: '#E57373', fontSize: 8 }}>*</span>}
                      </div>

                      {/* Project asset thumbnails (selectable) */}
                      {projectFiles.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                          {projectFiles.map(file => {
                            const isActive = currentFile?.data === file.data;
                            return (
                              <button key={file.id} onClick={() => {
                                isActive
                                  ? setUploadedFiles(prev => { const u = {...prev}; delete u[slot.key as keyof UploadedFiles]; return u; })
                                  : setUploadedFiles(prev => ({ ...prev, [slot.key as keyof UploadedFiles]: { data: file.data, mimeType: file.mimeType } }));
                              }} style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, transition: 'transform 0.1s' }} title={isActive ? 'Deselect' : 'Select'}>
                                <img src={`data:${file.mimeType};base64,${file.data}`} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, display: 'block', border: `2px solid ${isActive ? WS.gold : 'transparent'}`, outline: `1px solid ${WS.border}` }} />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Upload card */}
                      <ImageUploadCard
                        label=""
                        uploadId={slot.key}
                        onFileUpload={(base64, mimeType) => handleFileUpload(slot.key as keyof UploadedFiles, base64, mimeType)}
                        onRemove={() => handleRemoveUpload(slot.key as keyof UploadedFiles)}
                        currentImage={currentFile?.data}
                        required={slot.required}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* SETTINGS TAB */}
            {workspaceTab === 'settings' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 580 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 10, color: WS.txtSec, marginBottom: 7 }}>Material & texture guide</div>
                  <textarea
                    value={stylingConfig.materialDescription}
                    onChange={e => setStylingConfig(prev => ({ ...prev, materialDescription: e.target.value }))}
                    placeholder="Optional: describe fabric texture if AI needs correction…"
                    style={{ width: '100%', height: 60, background: 'transparent', border: `1px solid ${WS.border}`, borderRadius: 4, color: WS.txtPri, fontSize: 11, fontFamily: 'inherit', resize: 'none', padding: '8px 10px', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
                    onFocus={e => (e.target.style.borderColor = WS.gold)}
                    onBlur={e => (e.target.style.borderColor = WS.border)}
                  />
                </div>
                {[
                  { label: 'Environment', value: projectEnvironment, set: setProjectEnvironment, ph: 'Minimal studio, rooftop…' },
                  { label: 'Lighting', value: projectLighting, set: setProjectLighting, ph: 'Soft daylight, ring light…' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 10, color: WS.txtSec, marginBottom: 7 }}>{f.label}</div>
                    <input type="text" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: '100%', background: 'transparent', border: `1px solid ${WS.border}`, borderRadius: 4, color: WS.txtPri, fontSize: 11, fontFamily: 'inherit', padding: '8px 10px', outline: 'none', boxSizing: 'border-box' }} onFocus={e => (e.target.style.borderColor = WS.gold)} onBlur={e => (e.target.style.borderColor = WS.border)} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 10, color: WS.txtSec, marginBottom: 7 }}>Negative prompt</div>
                  <input type="text" value={projectNegativePrompt} onChange={e => setProjectNegativePrompt(e.target.value)} placeholder="blur, text, low quality…" style={{ width: '100%', background: 'transparent', border: `1px solid ${WS.border}`, borderRadius: 4, color: WS.txtPri, fontSize: 11, fontFamily: 'inherit', padding: '8px 10px', outline: 'none', boxSizing: 'border-box' }} onFocus={e => (e.target.style.borderColor = WS.gold)} onBlur={e => (e.target.style.borderColor = WS.border)} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: WS.txtSec, marginBottom: 7 }}>Seed</div>
                  <input type="number" value={projectSeed ?? ''} onChange={e => setProjectSeed(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="42" style={{ width: '100%', background: 'transparent', border: `1px solid ${WS.border}`, borderRadius: 4, color: WS.txtPri, fontSize: 11, fontFamily: 'inherit', padding: '8px 10px', outline: 'none', boxSizing: 'border-box' }} onFocus={e => (e.target.style.borderColor = WS.gold)} onBlur={e => (e.target.style.borderColor = WS.border)} />
                </div>
              </div>
            )}

            {/* CAMERA TAB */}
            {workspaceTab === 'camera' && (
              <div>
                <CameraSettings config={cameraConfig} onChange={update => setCameraConfig(prev => ({ ...prev, ...update }))} />
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 10, color: WS.txtSec, marginBottom: 10 }}>Studio backgrounds</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PRESET_BACKGROUNDS[selectedModel]?.map((bg, i) => (
                      <button key={i} onClick={() => handlePresetBackgroundSelect(bg.color)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, border: `1px solid ${WS.border}`, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.12s' }} onMouseEnter={e => (e.currentTarget.style.borderColor = WS.borderHi)} onMouseLeave={e => (e.currentTarget.style.borderColor = WS.border)}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: bg.color, border: '1px solid rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: 10, color: WS.txtSec }}>{bg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SHOTS TAB */}
            {workspaceTab === 'shots' && (
              <PoseEditor
                selectedModel={selectedModel}
                selectedCategory={selectedCategory}
                currentShots={currentShots}
                onShotsChange={setCurrentShots}
              />
            )}

            {/* SKUS TAB */}
            {workspaceTab === 'skus' && (() => {
              const productKeys = PRODUCT_SLOT_KEYS[selectedCategory] || [];
              const primarySlot = productKeys[0] || 'productImage';
              const primaryLabel = ITEM_LABELS[primarySlot] || primarySlot;

              return (
                <div>
                  {/* SKU controls header — always visible */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: WS.txtSec }}>
                        {skus.length} SKU{skus.length !== 1 ? 's' : ''}
                      </span>
                      {skus.length > 0 && (
                        <button
                          onClick={() => setBulkSelectedSKUIds(
                            bulkSelectedSKUIds.size === skus.length ? new Set() : new Set(skus.map(s => s.id))
                          )}
                          style={{ fontSize: 9, color: WS.txtSec, background: 'none', border: `1px solid ${WS.border}`, borderRadius: 3, cursor: 'pointer', padding: '3px 8px', fontFamily: 'inherit' }}
                          onMouseEnter={e => (e.currentTarget.style.color = WS.txtPri)}
                          onMouseLeave={e => (e.currentTarget.style.color = WS.txtSec)}
                        >
                          {bulkSelectedSKUIds.size === skus.length && skus.length > 0 ? 'Deselect all' : 'Select all'}
                        </button>
                      )}
                      {bulkSelectedSKUIds.size > 0 && (
                        <span style={{ fontSize: 9, color: WS.gold }}>{bulkSelectedSKUIds.size} selected</span>
                      )}
                    </div>
                  </div>

                  {/* SKU card grid */}
                  {skus.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                      {skus.map(sku => {
                        const isActive = activeSKUId === sku.id;
                        const isSelected = bulkSelectedSKUIds.has(sku.id);
                        const thumb = sku.productAssets[primarySlot];
                        return (
                          <div key={sku.id} style={{ position: 'relative' }}>
                            {/* Checkbox */}
                            <button
                              onClick={() => setBulkSelectedSKUIds(prev => {
                                const n = new Set(prev);
                                isSelected ? n.delete(sku.id) : n.add(sku.id);
                                return n;
                              })}
                              style={{
                                position: 'absolute', top: 4, left: 4, zIndex: 2,
                                width: 18, height: 18, borderRadius: 4,
                                border: `1.5px solid ${isSelected ? WS.gold : WS.border}`,
                                background: isSelected ? WS.gold : 'rgba(10,9,8,0.7)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.1s',
                              }}
                              title={isSelected ? 'Deselect' : 'Select for bulk'}
                            >
                              {isSelected && (
                                <svg viewBox="0 0 10 10" fill="none" stroke={WS.bg} strokeWidth="2" style={{ width: 8, height: 8 }}>
                                  <path d="M2 5l2.5 2.5L8 3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>

                            {/* Card body */}
                            <button
                              onClick={() => handleSelectSKU(sku.id)}
                              style={{
                                width: 110, background: 'none',
                                border: `2px solid ${isActive ? WS.gold : isSelected ? WS.gold + '40' : WS.border}`,
                                borderRadius: 8, cursor: 'pointer', padding: '6px 6px 8px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                                transition: 'border-color 0.12s',
                              }}
                              title="Use this SKU's assets"
                            >
                              <div style={{
                                width: 88, height: 88, borderRadius: 4, background: WS.surfHi,
                                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {thumb ? (
                                  <img src={`data:${thumb.mimeType};base64,${thumb.data}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={sku.name} />
                                ) : (
                                  <svg viewBox="0 0 16 16" fill="none" stroke={WS.txtSec} strokeWidth="1.2" style={{ width: 22, height: 22 }}>
                                    <rect x="1" y="2" width="14" height="12" rx="1.5" />
                                    <path d="M1 11l3.5-3 3 2.5 3-3 4 3.5" strokeLinecap="round" />
                                  </svg>
                                )}
                              </div>
                              <div style={{ fontSize: 10, color: isActive ? WS.gold : WS.txtSec, textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.3, maxWidth: 96, width: '100%' }}>
                                {sku.name}
                              </div>
                              {sku.skuCode && (
                                <div style={{ fontSize: 8, color: WS.txtSec }}>{sku.skuCode}</div>
                              )}
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteSKU(sku.id)}
                              style={{
                                position: 'absolute', top: -4, right: -4, width: 17, height: 17,
                                borderRadius: '50%', background: WS.borderHi, border: 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: WS.txtSec, fontSize: 10,
                              }}
                              title="Delete SKU"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bulk add */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: WS.txtSec, marginBottom: 8 }}>Bulk add — one SKU per image ({primaryLabel})</div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: `1px dashed ${WS.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 10, color: WS.txtMid, transition: 'border-color 0.12s' }} onMouseEnter={e => (e.currentTarget.style.borderColor = WS.borderHi)} onMouseLeave={e => (e.currentTarget.style.borderColor = WS.border)}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 12, height: 12 }}><path d="M7 1v8M4.5 3.5L7 1l2.5 2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" strokeLinecap="round"/></svg>
                      Upload multiple images
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={async e => {
                        const files = Array.from(e.target.files || []);
                        const parsed = await Promise.all(files.map((f: File) => new Promise<{ name: string; data: string; mimeType: string }>(res => {
                          const reader = new FileReader();
                          reader.onloadend = () => res({ name: f.name, data: (reader.result as string).split(',')[1], mimeType: f.type });
                          reader.readAsDataURL(f as Blob);
                        })));
                        await handleBulkAddSKUs(parsed, primarySlot);
                        e.target.value = '';
                      }} />
                    </label>
                  </div>

                  {/* Manual add form */}
                  <div style={{ background: WS.surfHi, borderRadius: 8, padding: 14, maxWidth: 400 }}>
                    <div style={{ fontSize: 10, color: WS.txtSec, marginBottom: 12, letterSpacing: '0.06em' }}>ADD SINGLE SKU</div>
                    <SKUAddForm productKeys={productKeys} itemLabels={ITEM_LABELS} ws={WS} onAdd={(name, code, assets) => handleAddSKU(name, code, assets)} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Bottom floating bar ── */}
      {activeProject && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '0 0 14px', zIndex: 50 }}>
          <div style={{ background: '#1A1816', border: `1px solid #3A3632`, borderRadius: 50, padding: '5px 5px 5px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(200,169,122,0.06)' }}>

            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: isLoading ? WS.gold : '#4CAF50', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: WS.txtPri, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeProject.name}
              </span>
              <span style={{ color: WS.borderHi, fontSize: 10 }}>·</span>
              <span style={{ fontSize: 10, color: WS.txtMid }}>{currentShots.length} shots</span>
              {activeSKUId && !isBulkGenerating && (() => { const s = skus.find(x => x.id === activeSKUId); return s ? (<><span style={{ color: WS.borderHi, fontSize: 10 }}>·</span><span style={{ fontSize: 10, color: WS.gold }}>{s.name}</span></>) : null; })()}
              {bulkSelectedSKUIds.size >= 2 && (
                <><span style={{ color: WS.borderHi, fontSize: 10 }}>·</span><span style={{ fontSize: 10, color: WS.gold }}>{bulkSelectedSKUIds.size} selected</span></>
              )}
              {isLoading && (
                <>
                  <span style={{ color: WS.borderHi, fontSize: 10 }}>·</span>
                  <span style={{ fontSize: 10, color: WS.gold }}>{completedImagesCount}/{imagesToGenerateCount}</span>
                </>
              )}
            </div>

            {/* Tab icon pills */}
            <div style={{ display: 'flex', gap: 2, background: WS.bg, borderRadius: 30, padding: 3 }}>
              {([
                { key: 'inputs' as const, title: 'Image Inputs', icon: (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 13, height: 13 }}><rect x="1" y="2" width="14" height="12" rx="1.5"/><circle cx="5" cy="7" r="1.5"/><path d="M1 12l3.5-3 3 2.5 3-3 4 3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )},
                { key: 'settings' as const, title: 'Settings', icon: (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 13, height: 13 }}><circle cx="8" cy="8" r="2.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M3.2 12.8l1-1M11.8 4.2l1-1" strokeLinecap="round"/></svg>
                )},
                { key: 'camera' as const, title: 'Camera', icon: (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 13, height: 13 }}><path d="M1 5.5A1.5 1.5 0 012.5 4h1.618l.894-1.789A1 1 0 016 1.75h4a1 1 0 01.894.553L11.882 4H13.5A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-7z"/><circle cx="8" cy="9" r="2.5"/></svg>
                )},
                { key: 'shots' as const, title: 'Shots', icon: (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 13, height: 13 }}><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
                )},
                { key: 'skus' as const, title: `SKUs${skus.length > 0 ? ` (${skus.length})` : ''}`, icon: (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 13, height: 13 }}><path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round"/><path d="M5 2v12" strokeLinecap="round" strokeOpacity="0.5"/></svg>
                )},
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setWorkspaceTab(t => t === tab.key ? null : tab.key)}
                  title={tab.title}
                  style={{ width: 32, height: 32, borderRadius: 30, border: 'none', background: workspaceTab === tab.key ? WS.surfHi : 'transparent', color: workspaceTab === tab.key ? WS.gold : WS.txtMid, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.12s' }}
                  onMouseEnter={e => { if (workspaceTab !== tab.key) (e.currentTarget as HTMLElement).style.color = WS.txtPri; }}
                  onMouseLeave={e => { if (workspaceTab !== tab.key) (e.currentTarget as HTMLElement).style.color = WS.txtMid; }}
                >
                  {tab.icon}
                </button>
              ))}
            </div>

            {/* Error indicator */}
            {error && (
              <div style={{ fontSize: 9, color: '#E57373', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={error}>⚠ {error}</div>
            )}

            {/* Generate / Run Batch button */}
            {bulkSelectedSKUIds.size >= 2 ? (
              <button
                onClick={() => setShowBulkOverlay(true)}
                disabled={isBulkGenerating}
                style={{ padding: '9px 22px', borderRadius: 40, background: WS.gold, color: WS.bg, border: 'none', fontSize: 11, fontWeight: 600, cursor: isBulkGenerating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7, opacity: isBulkGenerating ? 0.5 : 1 }}
                onMouseEnter={e => { if (!isBulkGenerating) (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11 }}><path d="M7 1l1.5 4.5L13 7l-4.5 1.5L7 13l-1.5-4.5L1 7l4.5-1.5L7 1z" strokeLinejoin="round"/></svg>
                Run Batch ({bulkSelectedSKUIds.size})
              </button>
            ) : (
              <button
                onClick={handleGenerateTryOn}
                disabled={!isFormValid || (apiProvider === 'google' ? !apiKey : !kieApiKey) || isLoading}
                style={{ padding: '9px 22px', borderRadius: 40, background: isFormValid && (apiProvider === 'google' ? apiKey : kieApiKey) && !isLoading ? WS.gold : '#2A2622', color: isFormValid && (apiProvider === 'google' ? apiKey : kieApiKey) && !isLoading ? WS.bg : WS.txtMid, border: `1px solid ${isFormValid && (apiProvider === 'google' ? apiKey : kieApiKey) && !isLoading ? 'transparent' : WS.borderHi}`, fontSize: 11, fontWeight: 600, cursor: isFormValid && (apiProvider === 'google' ? apiKey : kieApiKey) && !isLoading ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7 }}
                onMouseEnter={e => { if (isFormValid && !isLoading) (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                {isLoading ? (
                  <>
                    <div style={{ width: 11, height: 11, border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                    {completedImagesCount}/{imagesToGenerateCount}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11 }}><path d="M7 1l1.5 4.5L13 7l-4.5 1.5L7 13l-1.5-4.5L1 7l4.5-1.5L7 1z" strokeLinejoin="round"/></svg>
                    Generate
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Image edit panel */}
      {selectedImageForEditIndex !== null && displayedImages[selectedImageForEditIndex] && (
        <ImageEditPanel
          image={displayedImages[selectedImageForEditIndex]}
          imageIndex={selectedImageForEditIndex}
          uploadedFiles={uploadedFiles}
          filename={`Shot_${String(selectedImageForEditIndex + 1).padStart(2, '0')}.jpg`}
          onClose={() => setSelectedImageForEditIndex(null)}
          onRegenerate={handleRetryImage}
          onApplyEdit={handlePanelApplyEdit}
          onApplyColorGrading={handlePanelApplyColorGrading}
          onDownload={handleDownloadImage}
        />
      )}
    </div>
  );
}

export default App;
