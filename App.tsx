import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ImageUploadCard from './components/ImageUploadCard';
import ModelSelection from './components/ModelSelection';
import CategorySelection from './components/CategorySelection';
import PoseEditor from './components/PoseEditor';
import ColorGradingControl from './components/ColorGradingControl';
import CameraSettings from './components/CameraSettings';
import { ModelType, UploadedFiles, GeneratedImage, ProductCategory, GenerationBatch, ActiveGenerationMeta, Project, StylingConfig, CameraConfig, ShotConfig, ApiProvider } from './types';
import { geminiService, refineImageDetails, setGeminiApiKey } from './services/geminiService';
import { kieService, setKieApiKey } from './services/kieService';
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

function App() {
  // --- Project State ---
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem('projects');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);

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

  const [generationHistory, setGenerationHistory] = useState<GenerationBatch[]>(() => {
    try {
      const storedHistory = localStorage.getItem('generationHistory');
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (e) {
      console.error("Failed to parse generation history from localStorage", e);
      return [];
    }
  });
  const [viewingHistoryBatchId, setViewingHistoryBatchId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingPrompt, setEditingPrompt] = useState<string>('');
  const [selectedImageForEditIndex, setSelectedImageForEditIndex] = useState<number | null>(null);
  const [editCustomReferences, setEditCustomReferences] = useState<{ id: string; data: string; mimeType: string }[]>([]);
  const [editSelectedOriginalKeys, setEditSelectedOriginalKeys] = useState<string[]>([]);

  // Color Grading State
  const [gradingImageIndex, setGradingImageIndex] = useState<number | null>(null);
  const [gradingBase64, setGradingBase64] = useState<string | null>(null);

  const [isZipping, setIsZipping] = useState(false);

  const outputPreviewRef = useRef<HTMLDivElement>(null);
  const errorContainerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Persist Projects
  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

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

  // Persist History
  useEffect(() => {
    try {
      const historyToStore = generationHistory.map(batch => ({
        ...batch,
        images: batch.images.map(image => {
          const { url, ...rest } = image;
          return rest;
        })
      }));
      localStorage.setItem('generationHistory', JSON.stringify(historyToStore));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        setError("History storage full. Clear history to save new items.");
      }
    }
  }, [generationHistory]);

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
  };

  const handleLoadProject = (project: Project) => {
    setIsCreatingProject(false);
    setActiveProject(project);

    // Load config
    setSelectedCategory(project.category);
    setSelectedModel(project.model);
    setBrandName(project.brandName);

    // Handle Migration: If old project has posePrompts but no shots
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

    // Reset workspace specific uploads/config
    setUploadedFiles({});
    setStylingConfig({ materialDescription: '' });
    setCameraConfig({ framing: '', angle: '', focalLength: '' });
    setLiveGenerationImages([]);
    setViewingHistoryBatchId(null);
    setError(null);
  };

  const handleBackToProjects = () => {
    setActiveProject(null);
    setIsCreatingProject(false);
  };

  const handleFileUpload = (key: keyof UploadedFiles, base64: string, mimeType: string) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: { data: base64, mimeType } }));
    setError(null);
  };

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

  const handleApplyEdit = useCallback(async () => {
    if (selectedImageForEditIndex === null || editingPrompt.trim() === '') return;
    const imageToEdit = displayedImages[selectedImageForEditIndex];
    if (!imageToEdit || !imageToEdit.url) return;

    setIsLoading(true);
    handleUpdateDisplayedImage(selectedImageForEditIndex, { status: 'generating' });
    const startTime = Date.now();

    try {
      let imageInput = '';

      if (apiProvider === 'kie' && imageToEdit.url.startsWith('http')) {
        imageInput = imageToEdit.url;
      } else {
        if (imageToEdit.url.startsWith('http')) {
          imageInput = await urlToBase64(imageToEdit.url);
        } else {
          imageInput = imageToEdit.url.split(',')[1];
        }
      }

      const referenceImages = [
        ...editCustomReferences.map(r => ({ data: r.data, mimeType: r.mimeType })),
        ...editSelectedOriginalKeys.map(key => {
          const item = uploadedFiles[key as keyof UploadedFiles];
          return item ? { data: item.data, mimeType: item.mimeType } : null;
        }).filter(item => item !== null) as { data: string; mimeType: string }[]
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
        editedBase64 = await kieService.editImage(imageInput, editingPrompt, referenceImages, currentAspectRatio);
      } else {
        // Ensure Base64 for Gemini
        const base64ForGemini = imageInput.startsWith('http') ? await urlToBase64(imageInput) : imageInput;
        editedBase64 = await geminiService.editImage(base64ForGemini, editingPrompt, referenceImages, currentAspectRatio);
      }
      const duration = Date.now() - startTime;
      handleUpdateDisplayedImage(selectedImageForEditIndex, { status: 'success', url: editedBase64, prompt: editingPrompt, generationTime: duration });

      setEditingPrompt('');
      // Keep selected for consecutive edits
      // setSelectedImageForEditIndex(null); 
      setEditCustomReferences([]);
      setEditSelectedOriginalKeys([]);
    } catch (e: any) {
      handleUpdateDisplayedImage(selectedImageForEditIndex, { status: 'failed', errorMessage: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [displayedImages, selectedImageForEditIndex, editingPrompt, handleUpdateDisplayedImage, editCustomReferences, editSelectedOriginalKeys, uploadedFiles, viewingHistoryBatchId, generationHistory, activeGenerationMeta, selectedModel]);

  const handleOpenColorGrading = useCallback(async (index: number) => {
    const img = displayedImages[index];
    if (!img || !img.url) return;

    try {
      let base64 = '';
      if (img.url.startsWith('http')) {
        setIsLoading(true);
        base64 = await urlToBase64(img.url);
        setIsLoading(false);
      } else {
        base64 = img.url.split(',')[1];
      }
      setGradingBase64(base64);
      setGradingImageIndex(index);
    } catch (e) {
      console.error("Failed to prepare image for grading", e);
      setIsLoading(false);
    }
  }, [displayedImages]);

  const handleApplyColorGrading = useCallback((newImageBase64: string) => {
    if (gradingImageIndex === null) return;
    handleUpdateDisplayedImage(gradingImageIndex, { url: `data:image/jpeg;base64,${newImageBase64}` });
    setGradingImageIndex(null);
    setGradingBase64(null);
  }, [gradingImageIndex, handleUpdateDisplayedImage]);

  const handleColorGradingPreview = useCallback(async (adjustments: ColorAdjustments) => {
    if (!gradingBase64) return '';
    return await applyColorGrading(gradingBase64, adjustments);
  }, [gradingBase64]);

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
    setEditingPrompt('');
    setSelectedImageForEditIndex(null);
    setEditCustomReferences([]);
    setEditSelectedOriginalKeys([]);
    if (outputPreviewRef.current) outputPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleViewCurrentGeneration = useCallback(() => {
    setViewingHistoryBatchId(null);
    if (outputPreviewRef.current) outputPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleClearHistory = useCallback(() => {
    setGenerationHistory([]);
    if (viewingHistoryBatchId !== null) handleViewCurrentGeneration();
  }, [viewingHistoryBatchId, handleViewCurrentGeneration]);

  const handleEditAddReference = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64String = reader.result.split(',')[1];
          setEditCustomReferences(prev => [
            ...prev,
            { id: Date.now().toString(), data: base64String, mimeType: file.type }
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditRemoveReference = (id: string) => setEditCustomReferences(prev => prev.filter(ref => ref.id !== id));
  const toggleEditOriginalItem = (key: string) => setEditSelectedOriginalKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const imagesToGenerateCount = currentShots.length;
  const completedImagesCount = liveGenerationImages.filter(img => img.status === 'success').length;

  const currentOutputTitle = useMemo(() => {
    if (viewingHistoryBatchId) {
      const batch = generationHistory.find(b => b.id === viewingHistoryBatchId);
      return batch ? `Archive: ${new Date(parseInt(batch.id, 10)).toLocaleDateString()}` : 'Archive';
    }
    return activeGenerationMeta ? 'Generating...' : activeProject ? activeProject.name : 'Output';
  }, [viewingHistoryBatchId, generationHistory, activeGenerationMeta, activeProject]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#131314] text-[#E3E3E3] font-sans overflow-hidden selection:bg-[#A8C7FA] selection:text-black">

      {/* Sidebar Control Panel */}
      <div className="lg:w-[380px] flex flex-col bg-[#1E1F20] border-r border-[#444746] relative z-20">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#444746] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#A8C7FA] flex items-center justify-center text-[#062E6F] font-bold text-xl shadow-inner">
            C
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold tracking-tight text-[#E3E3E3]">HUMANLY AI</h1>
          </div>
          {activeProject && (
            <button onClick={handleBackToProjects} className="text-xs text-[#A8C7FA] hover:text-white transition-colors">
              Exit Project
            </button>
          )}
        </div>

        {/* --- VIEW: HOME (PROJECT LIST) --- */}
        {!activeProject && !isCreatingProject && (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

              {/* Settings / API Key */}
              <div>
                <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Settings</h3>

                {/* Provider Selection */}
                <div className="flex gap-2 mb-3 bg-[#131314] p-1 rounded-lg border border-[#444746]">
                  <button
                    onClick={() => setApiProvider('google')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${apiProvider === 'google' ? 'bg-[#444746] text-white' : 'text-[#8E918F] hover:text-[#C4C7C5]'}`}
                  >
                    Google Cloud
                  </button>
                  <button
                    onClick={() => setApiProvider('kie')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${apiProvider === 'kie' ? 'bg-[#444746] text-white' : 'text-[#8E918F] hover:text-[#C4C7C5]'}`}
                  >
                    Kie.ai
                  </button>
                </div>

                {apiProvider === 'google' ? (
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste Gemini API Key"
                    className="w-full p-3 bg-[#131314] border border-[#444746] text-sm text-[#E3E3E3] placeholder-[#8E918F] focus:border-[#A8C7FA] outline-none rounded-lg transition-colors"
                  />
                ) : (
                  <input
                    type="password"
                    value={kieApiKey}
                    onChange={(e) => setKieApiKeyState(e.target.value)}
                    placeholder="Paste Kie.ai API Key"
                    className="w-full p-3 bg-[#131314] border border-[#444746] text-sm text-[#E3E3E3] placeholder-[#8E918F] focus:border-[#A8C7FA] outline-none rounded-lg transition-colors"
                  />
                )}
              </div>

              <div>
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-xs font-semibold text-[#8E918F]">Your Projects</h3>
                </div>

                <button
                  onClick={handleStartCreateProject}
                  className="w-full py-4 rounded-xl border border-dashed border-[#444746] text-[#A8C7FA] hover:bg-[#004A77]/20 hover:border-[#A8C7FA] transition-all flex flex-col items-center justify-center gap-2 mb-4 group"
                >
                  <div className="p-2 rounded-full bg-[#131314] group-hover:bg-[#004A77] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                  </div>
                  <span className="text-xs font-medium">Create New Project</span>
                </button>

                <div className="space-y-3">
                  {projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => handleLoadProject(project)}
                      className="w-full text-left p-4 bg-[#131314] border border-[#444746] rounded-xl hover:border-[#8E918F] hover:bg-[#2D2E30] transition-all group"
                    >
                      <h4 className="text-sm font-semibold text-[#E3E3E3] mb-1 group-hover:text-white">{project.name}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-[#8E918F]">
                        <span className="bg-[#1E1F20] px-1.5 py-0.5 rounded">{project.model.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-xs text-[#444746] text-center mt-8">No projects yet.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- VIEW: CREATE PROJECT --- */}
        {!activeProject && isCreatingProject && (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setIsCreatingProject(false)} className="text-[#8E918F] hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>
                </button>
                <h2 className="text-sm font-bold">New Project Configuration</h2>
              </div>

              <CategorySelection selectedCategory={selectedCategory} onSelect={setSelectedCategory} />

              <ModelSelection selectedModel={selectedModel} onSelect={setSelectedModel} />

              {/* Fashion Type Selection */}
              <div>
                <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Fashion Type</h3>
                <div className="flex flex-wrap gap-2">
                  {FASHION_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setProjectFashionType(type)}
                      className={`
                             px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-colors
                             ${projectFashionType === type
                          ? 'bg-[#A8C7FA]/20 border-[#A8C7FA] text-[#A8C7FA]'
                          : 'bg-[#131314] border-[#444746] text-[#C4C7C5] hover:bg-[#2D2E30]'}
                           `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood & Atmosphere */}
              <div>
                <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Mood & Atmosphere</h3>
                <div className="relative">
                  <select
                    value={projectMood}
                    onChange={(e) => setProjectMood(e.target.value)}
                    className="w-full p-3 bg-[#131314] border border-[#444746] text-sm text-[#E3E3E3] rounded-lg outline-none focus:border-[#A8C7FA] appearance-none"
                  >
                    {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#8E918F]"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Brand Context</h3>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Brand name (Used for project name)"
                  className="w-full p-3 bg-[#131314] border border-[#444746] text-sm text-[#E3E3E3] placeholder-[#8E918F] focus:border-[#A8C7FA] outline-none rounded-lg transition-colors"
                />
              </div>

              {/* Environment and Lighting */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Environment</h3>
                  <input
                    type="text"
                    value={projectEnvironment}
                    onChange={(e) => setProjectEnvironment(e.target.value)}
                    placeholder="e.g. Minimal Studio"
                    className="w-full p-3 bg-[#131314] border border-[#444746] text-xs text-[#E3E3E3] placeholder-[#8E918F] focus:border-[#A8C7FA] outline-none rounded-lg transition-colors"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Lighting</h3>
                  <input
                    type="text"
                    value={projectLighting}
                    onChange={(e) => setProjectLighting(e.target.value)}
                    placeholder="e.g. Soft Daylight"
                    className="w-full p-3 bg-[#131314] border border-[#444746] text-xs text-[#E3E3E3] placeholder-[#8E918F] focus:border-[#A8C7FA] outline-none rounded-lg transition-colors"
                  />
                </div>
              </div>

              {/* Advanced Controls (Negative Prompt & Seed) */}
              <div className="pt-2 border-t border-[#444746]">
                <h3 className="text-xs font-semibold text-[#8E918F] mb-3 mt-2">Advanced Constraints</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-[#C4C7C5] mb-1 block">Negative Prompt (What to avoid)</label>
                    <textarea
                      value={projectNegativePrompt}
                      onChange={(e) => setProjectNegativePrompt(e.target.value)}
                      placeholder="e.g. text, blur, low quality..."
                      className="w-full p-2 bg-[#131314] border border-[#444746] text-xs text-[#E3E3E3] placeholder-[#8E918F] focus:border-[#A8C7FA] outline-none rounded-lg transition-colors h-16 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#C4C7C5] mb-1 block">Seed (Optional - For Consistency)</label>
                    <input
                      type="number"
                      value={projectSeed || ''}
                      onChange={(e) => setProjectSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="e.g. 42"
                      className="w-full p-2 bg-[#131314] border border-[#444746] text-xs text-[#E3E3E3] placeholder-[#8E918F] focus:border-[#A8C7FA] outline-none rounded-lg transition-colors"
                    />
                  </div>
                </div>
              </div>

              <PoseEditor
                selectedModel={selectedModel}
                selectedCategory={selectedCategory}
                currentShots={currentShots}
                onShotsChange={setCurrentShots}
              />
            </div>

            <div className="p-6 border-t border-[#444746] bg-[#1E1F20]">
              <button
                onClick={handleSaveProject}
                className="w-full py-3.5 rounded-full bg-[#A8C7FA] text-[#062E6F] text-sm font-semibold hover:bg-[#D3E3FD] transition-all shadow-md"
              >
                Create & Continue
              </button>
            </div>
          </>
        )}

        {/* --- VIEW: WORKSPACE (ACTIVE PROJECT) --- */}
        {activeProject && !isCreatingProject && (
          <>
            <div className="bg-[#131314] px-6 py-3 border-b border-[#444746]">
              <span className="text-[10px] text-[#8E918F] uppercase tracking-wider font-bold">Project</span>
              <h2 className="text-sm font-semibold text-white truncate" title={activeProject.name}>{activeProject.name}</h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

              {/* Input Assets */}
              <div>
                <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Input Assets</h3>
                <div className="grid grid-cols-3 gap-3">
                  {ITEMS_TO_UPLOAD.map((item) => {
                    const isNonFashion = NON_FASHION_CATEGORIES.includes(selectedCategory);
                    const isSaree = selectedCategory === ProductCategory.SAREE;

                    const sareeFields = ['drape', 'blouse', 'accessory1', 'accessory2'];

                    // Hide Saree fields in other categories
                    if (!isSaree && sareeFields.includes(item.key)) {
                      return null;
                    }

                    // Hide standard fields in Saree category
                    if (isSaree && ['topFront', 'topBack', 'bottomBack', 'accessories', 'sunglasses', 'shoes'].includes(item.key)) {
                      return null;
                    }

                    if (isNonFashion) {
                      if (item.key !== 'productImage' && item.key !== 'background') return null;
                    } else {
                      if (item.key === 'productImage') return null;
                    }

                    let isRequired = false;
                    if (isNonFashion) {
                      if (item.key === 'productImage') isRequired = true;
                    } else {
                      if (item.key === 'characterFace') isRequired = true;
                      else if (selectedCategory === ProductCategory.SHOES && item.key === 'shoes') isRequired = true;
                      else if (selectedCategory === ProductCategory.ACCESSORIES && item.key === 'accessories') isRequired = true;
                      else if (selectedCategory === ProductCategory.BOTTOM && (item.key === 'bottomFront' || item.key === 'bottomBack')) isRequired = true;
                      else if (['Top', 'Jacket', 'Coat', 'Sweater', 'Ethnic'].includes(selectedCategory) && (item.key === 'topFront' || item.key === 'topBack')) isRequired = true;
                      else if (selectedCategory === ProductCategory.DRESS && item.key === 'topFront') isRequired = true;
                    }

                    return (
                      <ImageUploadCard
                        key={item.key}
                        label={item.label}
                        onFileUpload={(base64, mimeType) => handleFileUpload(item.key as keyof UploadedFiles, base64, mimeType)}
                        onRemove={() => handleRemoveUpload(item.key as keyof UploadedFiles)}
                        currentImage={uploadedFiles[item.key as keyof UploadedFiles]?.data}
                        required={isRequired}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Fabric & Styling Details Input - CONSOLIDATED */}
              <div>
                <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Material & Texture Guide</h3>
                <textarea
                  placeholder="Optional: Describe material details only if necessary to correct hallucination (e.g. 'Ribbed knit cotton texture'). Leave empty to rely on image input."
                  value={stylingConfig.materialDescription}
                  onChange={(e) => setStylingConfig(prev => ({ ...prev, materialDescription: e.target.value }))}
                  className="w-full p-2 bg-[#131314] border border-[#444746] rounded text-xs text-[#E3E3E3] placeholder-[#8E918F] outline-none focus:border-[#A8C7FA] resize-none h-16"
                />
              </div>

              {/* Camera & Composition Controls (New) */}
              <CameraSettings config={cameraConfig} onChange={(update) => setCameraConfig(prev => ({ ...prev, ...update }))} />

              {/* Backgrounds */}
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Studio Backgrounds</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {PRESET_BACKGROUNDS[selectedModel]?.map((bg, index) => (
                    <button
                      key={index}
                      onClick={() => handlePresetBackgroundSelect(bg.color)}
                      className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#444746] bg-[#1E1F20] hover:bg-[#2D2E30] transition-colors group"
                      title={`Use ${bg.label}`}
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-black/10"
                        style={{ backgroundColor: bg.color }}
                      />
                      <span className="text-[10px] font-medium text-[#C4C7C5] whitespace-nowrap">{bg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shot List - Editable via PoseEditor */}
              <PoseEditor
                selectedModel={selectedModel}
                selectedCategory={selectedCategory}
                currentShots={currentShots}
                onShotsChange={setCurrentShots}
              />
            </div>

            <div className="p-6 border-t border-[#444746] bg-[#1E1F20]">
              {error && (
                <div ref={errorContainerRef} className="mb-4 p-3 bg-[#3C1A1A] border border-[#602020] text-[#F2B8B5] text-xs rounded-lg flex flex-col gap-1">
                  <span className="font-semibold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    Alert
                  </span>
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerateTryOn}
                disabled={!isFormValid || (apiProvider === 'google' ? !apiKey : !kieApiKey) || isLoading}
                className={`
                    w-full py-3.5 rounded-full text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2
                    ${isFormValid && (apiProvider === 'google' ? apiKey : kieApiKey) && !isLoading
                    ? 'bg-[#A8C7FA] text-[#062E6F] hover:bg-[#D3E3FD] hover:shadow-lg'
                    : 'bg-[#444746] text-[#8E918F] cursor-not-allowed opacity-70'
                  }
                  `}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing ({completedImagesCount}/{imagesToGenerateCount})
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.96l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.96 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.96l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.683a1 1 0 01.633.633l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" /></svg>
                    Generate Images
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col bg-[#131314] relative h-full">
        {/* Top Bar */}
        <div className="h-16 flex items-center justify-between px-8 border-b border-[#444746] bg-[#1E1F20]">
          <h2 className="text-sm font-semibold text-[#E3E3E3] flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full inline-block ${activeProject ? 'bg-green-500' : 'bg-gray-500'}`}></span>
            {currentOutputTitle}
          </h2>

          <div className="flex items-center gap-3">
            {viewingHistoryBatchId && (
              <button onClick={handleViewCurrentGeneration} className="text-xs font-medium text-[#A8C7FA] hover:text-[#D3E3FD] transition-colors">Back to Live</button>
            )}
            {projectHistory.length > 0 && (
              <div className="relative group">
                <button className="text-xs font-medium text-[#C4C7C5] hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#333]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  History
                </button>
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#1E1F20] border border-[#444746] rounded-xl shadow-lg p-2 hidden group-hover:block max-h-80 overflow-y-auto z-50">
                  <div className="flex justify-between items-center mb-2 px-3 pt-2">
                    <span className="text-xs font-semibold text-[#8E918F]">Recent</span>
                    <button onClick={handleClearHistory} className="text-[10px] text-red-400 hover:text-red-300">Clear All</button>
                  </div>
                  {projectHistory.map(batch => (
                    <button key={batch.id} onClick={() => handleViewHistoryBatch(batch.id)} className="w-full text-left p-3 hover:bg-[#2D2E30] rounded-lg mb-1 flex items-center justify-between group/item">
                      <div>
                        <div className="text-xs text-[#E3E3E3] font-medium">{new Date(parseInt(batch.id)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-[#8E918F]">{batch.model.replace(/_/g, ' ')}</div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#8E918F] opacity-0 group-hover/item:opacity-100 transition-opacity"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleBulkDownload}
              disabled={isZipping || !displayedImages.some(img => img.status === 'success' && img.url)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#444746] hover:bg-[#2D2E30] hover:text-[#E3E3E3] text-xs font-medium text-[#C4C7C5] transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              {isZipping ? (
                <span className="animate-pulse">Zipping...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  Download All
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div ref={outputPreviewRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">

          {!activeProject && !isCreatingProject && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#444746] pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
              <p className="text-sm font-medium">Select or Create a Project</p>
            </div>
          )}

          {activeProject && displayedImages.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#444746] pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
              <p className="text-sm font-medium">Ready to Generate</p>
              <p className="text-xs mt-1 opacity-70">Upload your assets in the sidebar to begin.</p>
            </div>
          )}

          {isLoading && displayedImages.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              <div className="w-12 h-12 border-4 border-[#A8C7FA] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium text-[#E3E3E3]">HUMANLY AI Working...</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-40">
            {displayedImages.map((image, index) => (
              <div key={image.id} className="group relative flex flex-col">
                {/* Image Frame */}
                <div
                  className={`
                      aspect-[3/4] bg-[#1E1F20] relative rounded-xl overflow-hidden transition-all duration-300
                      ${selectedImageForEditIndex === index ? 'ring-2 ring-[#A8C7FA] shadow-lg' : 'hover:shadow-md border border-[#444746]'}
                    `}
                  onClick={() => image.status === 'success' && setSelectedImageForEditIndex(index)}
                >
                  {image.url ? (
                    <img src={image.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Generated" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1E1F20]">
                      {image.status === 'pending' && <span className="text-xs font-mono text-[#8E918F]">Pending...</span>}
                      {image.status === 'generating' && <div className="w-6 h-6 border-2 border-[#E3E3E3] border-t-transparent rounded-full animate-spin"></div>}
                      {image.status === 'refining' && <div className="w-6 h-6 border-2 border-[#A8C7FA] border-t-transparent rounded-full animate-spin"></div>}
                      {image.status === 'failed' && <span className="text-xs text-red-400 font-medium px-2 text-center">Failed</span>}
                      {image.status === 'success' && !image.url && <span className="text-xs text-[#8E918F] text-center px-4">Preview Unavailable<br />(Archived)</span>}
                    </div>
                  )}

                  {/* Overlay Actions */}
                  {image.status === 'success' && image.url && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadImage(image.url, `Humanly_Shoot_${index}.jpg`) }}
                        className="p-2.5 rounded-full bg-white text-black hover:bg-[#E3E3E3] shadow-lg transform transition-transform hover:scale-105"
                        title="Download"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRefineImage(index) }}
                        className="p-2.5 rounded-full bg-[#1E1F20] text-[#A8C7FA] hover:bg-[#2D2E30] border border-[#444746] shadow-lg transform transition-transform hover:scale-105"
                        title="Refine Details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l2.846-.813a1.125 1.125 0 0 0 .617-.443l4.885-6.839a.578.578 0 0 0-.135-.85L14.73 7.378a.578.578 0 0 0-.85.135l-4.885 6.839a1.125 1.125 0 0 0-.182.552Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 10.5h.008v.008h-.008V10.5Z" /></svg>
                      </button>
                      {/* Color Grade Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenColorGrading(index) }}
                        className="p-2.5 rounded-full bg-[#1E1F20] text-[#A8C7FA] hover:bg-[#2D2E30] border border-[#444746] shadow-lg transform transition-transform hover:scale-105"
                        title="Color Grade"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Failure Overlay */}
                  {image.status === 'failed' && (
                    <div className="absolute inset-0 bg-[#3C1A1A]/90 flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm">
                      <p className="text-[10px] text-[#F2B8B5] mb-3 line-clamp-3">{image.errorMessage}</p>
                      <button onClick={(e) => { e.stopPropagation(); handleRetryImage(index); }} className="px-4 py-1.5 bg-[#F2B8B5] text-[#602020] rounded-full text-xs font-semibold hover:bg-white transition-colors">Retry</button>
                    </div>
                  )}
                </div>

                <div className="mt-2 flex justify-between items-center px-1">
                  <p className="text-[10px] font-mono text-[#8E918F]">IMG_{String(index + 1).padStart(2, '0')}</p>
                  {image.generationTime && (
                    <div className="flex items-center gap-1 bg-[#1E1F20] px-1.5 py-0.5 rounded text-[10px] text-[#C4C7C5]">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                      {(image.generationTime / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Edit Bar */}
        {displayedImages.some(img => img.status === 'success') && (
          <div className="absolute bottom-6 left-6 right-6 z-30">
            <div className="max-w-4xl mx-auto bg-[#1E1F20] border border-[#444746] rounded-2xl p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ITEMS_TO_UPLOAD.map(item => {
                      const key = item.key as keyof UploadedFiles;
                      if (!uploadedFiles[key]) return null;
                      const isSelected = editSelectedOriginalKeys.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleEditOriginalItem(key)}
                          className={`
                                 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border
                                 ${isSelected ? 'bg-[#D3E3FD] text-[#041E49] border-[#D3E3FD]' : 'bg-transparent text-[#C4C7C5] border-[#444746] hover:bg-[#2D2E30]'}
                               `}
                        >
                          {isSelected ? '✓ ' : '+ '} {item.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 bg-[#131314] rounded-xl p-1.5 border border-[#444746] focus-within:border-[#A8C7FA] transition-colors">
                    <div className="flex -space-x-1 pl-1">
                      {editCustomReferences.map(ref => (
                        <div key={ref.id} className="w-8 h-8 relative group">
                          <img src={`data:${ref.mimeType};base64,${ref.data}`} className="w-full h-full object-cover rounded-full border border-[#131314]" />
                          <button onClick={() => handleEditRemoveReference(ref.id)} className="absolute -top-1 -right-1 bg-[#444746] text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] hover:bg-red-400">&times;</button>
                        </div>
                      ))}
                      <label className="w-8 h-8 flex items-center justify-center bg-[#2D2E30] text-[#C4C7C5] rounded-full cursor-pointer hover:bg-[#444746] transition-colors border border-[#131314] z-10" title="Add Reference Image">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                        <input type="file" accept="image/*" onChange={handleEditAddReference} className="hidden" />
                      </label>
                    </div>

                    <div className="w-px h-6 bg-[#444746] mx-1"></div>

                    <input
                      type="text"
                      value={editingPrompt}
                      onChange={(e) => setEditingPrompt(e.target.value)}
                      placeholder={selectedImageForEditIndex !== null ? "Describe your edit (e.g. 'Change background to a minimalist white room')..." : "Select an image above to start editing"}
                      className="flex-1 bg-transparent text-sm text-[#E3E3E3] outline-none placeholder-[#8E918F]"
                      disabled={selectedImageForEditIndex === null || isLoading}
                    />
                  </div>
                </div>
                <button
                  onClick={handleApplyEdit}
                  disabled={selectedImageForEditIndex === null || isLoading}
                  className="h-[52px] px-6 rounded-xl bg-[#A8C7FA] text-[#062E6F] text-sm font-semibold hover:bg-[#D3E3FD] disabled:opacity-50 disabled:bg-[#444746] disabled:text-[#8E918F] transition-all shadow-md self-end"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Color Grading Modal */}
        {gradingImageIndex !== null && gradingBase64 && (
          <ColorGradingControl
            originalImage={gradingBase64}
            onApply={handleApplyColorGrading}
            onPreview={handleColorGradingPreview}
            onCancel={() => { setGradingImageIndex(null); setGradingBase64(null); }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
