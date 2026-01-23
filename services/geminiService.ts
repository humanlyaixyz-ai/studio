import { GoogleGenAI, GenerateContentResponse, Part, HarmBlockThreshold, HarmCategory } from '@google/genai';
import { ModelType, UploadedFiles, GeneratedImage, UploadedFile, ProductCategory, StylingConfig, CameraConfig, ShotConfig } from '../types';
import { GEMINI_IMAGE_MODEL, MODEL_CONFIGS, IMAGES_PER_GENERATION, CORE_GENERATION_PROMPT, PRODUCT_GENERATION_PROMPT, REFINEMENT_PROMPT, SYSTEM_INSTRUCTION, DEFAULT_NEGATIVE_PROMPT, NON_FASHION_CATEGORIES } from '../constants';
import { resizeImageBase64 } from '../utils/imageUtils';

// Module-level variable to store the API Key
let currentApiKey = process.env.API_KEY || '';

// Function to set the API Key dynamically from the UI
export const setGeminiApiKey = (key: string) => {
  currentApiKey = key;
};

// Helper to convert base64 to a Part for Gemini API
const base64ToImagePart = (base64: string, mimeType: string): Part => ({
  inlineData: {
    data: base64,
    mimeType: mimeType,
  },
});

// Helper to extract a human-readable error message
const getReadableErrorMessage = (error: any): string => {
  let message = 'An unknown error occurred. Please try again.';
  let parsedError = error;

  if (error instanceof Error && typeof error.message === 'string') {
    try {
      parsedError = JSON.parse(error.message);
    } catch (e) {
      // Not a JSON string
    }
  } else if (typeof error === 'string') {
    try {
      parsedError = JSON.parse(error);
    } catch (e) {
      if (error.trim() !== '') {
        message = error;
      } else {
        message = 'An unknown API error occurred with an empty response. Please retry.';
      }
      return message;
    }
  }

  if (parsedError && typeof parsedError === 'object' && 'error' in parsedError &&
    typeof parsedError.error === 'object' && 'message' in parsedError.error &&
    typeof (parsedError.error as any).message === 'string') {
    message = (parsedError.error as any).message;
  }
  else if (parsedError && typeof parsedError === 'object' && 'message' in parsedError &&
    typeof parsedError.message === 'string') {
    message = parsedError.message;
  }
  else if (error instanceof Error) {
    message = error.message;
  }
  else if (typeof error === 'object' && error !== null) {
    try {
      message = JSON.stringify(error);
    } catch (e) {
      message = 'An unstringifiable error object occurred.';
    }
  }

  if (message.trim() === '') {
    return 'An internal server error occurred with no specific details. Please retry.';
  }

  return message;
};

// Retry mechanism with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 7,
  delay: number = 2000,
  factor: number = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error.status || (error.response ? error.response.status : null);
    const message = error.message || '';
    const isTransient =
      status === 499 ||
      status === 503 ||
      status === 500 ||
      status === 'UNAVAILABLE' ||
      status === 'INTERNAL' ||
      message.includes('timeout') ||
      message.includes('Internal') ||
      message.includes('Deadline expired') ||
      message.includes('Failed to fetch');

    if (retries > 0 && isTransient) {
      console.warn(`API call failed with status ${status}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * factor, factor);
    }
    throw error;
  }
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export const refineImageDetails = async (
  generatedBase64Image: string,
  generatedMimeType: string,
  originalGarments: UploadedFiles,
  imageSize: '4K',
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9',
  modelToUse: string,
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: currentApiKey });
  const compressedGenerated = await resizeImageBase64(generatedBase64Image, generatedMimeType);

  const parts: Part[] = [
    base64ToImagePart(compressedGenerated, 'image/jpeg'),
  ];

  const garmentKeys: Array<keyof UploadedFiles> = [
    'topFront', 'topBack', 'bottomFront', 'bottomBack', 'shoes', 'accessories', 'sunglasses', 'productImage', 'background', 'drape', 'blouse', 'accessory1', 'accessory2'
  ];
  for (const key of garmentKeys) {
    const item = originalGarments[key];
    if (item) {
      const compressedItem = await resizeImageBase64(item.data, item.mimeType);
      parts.push(base64ToImagePart(compressedItem, 'image/jpeg'));
    }
  }

  parts.push({ text: REFINEMENT_PROMPT });

  try {
    console.log('Sending refineImageDetails request.');
    const response: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
      model: modelToUse,
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        safetySettings: SAFETY_SETTINGS,
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize,
        },
      },
    }));

    if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
      console.warn('RefineImageDetails response did not contain valid candidates or content.');
      throw new Error('Received an empty or invalid response from the model during refinement.');
    }

    for (const part of response.candidates[0].content.parts || []) {
      if (part.inlineData) {
        return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }
    throw new Error('No image data found in the response during refinement.');
  } catch (e: any) {
    console.error('API Error during refineImageDetails:', e);
    const errorMessage = getReadableErrorMessage(e);
    throw new Error(`Refinement failed: ${errorMessage}`);
  }
};

export const generateSingleTryOnImage = async (
  characterFace: UploadedFile | undefined,
  allUploadedItems: UploadedFiles,
  modelConfig: typeof MODEL_CONFIGS[ModelType],
  shot: ShotConfig,
  brandName: string | undefined,
  category: ProductCategory,
  environment: string | undefined,
  lighting: string | undefined,
  stylingConfig: StylingConfig | undefined,
  cameraConfig: CameraConfig | undefined,
  negativePrompt: string | undefined,
  seed: number | undefined,
  fashionType: string | undefined,
  mood: string | undefined,
  index: number,
  onProgressUpdate: (index: number, update: Partial<GeneratedImage>) => void,
) => {
  const ai = new GoogleGenAI({ apiKey: currentApiKey });
  const modelToUse = modelConfig.model;
  const imageSize = modelConfig.imageSize as '1K' | '2K' | '4K';
  const aspectRatio = modelConfig.aspectRatio as '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  const isNonFashion = NON_FASHION_CATEGORIES.includes(category);
  const prompt = shot.prompt;

  onProgressUpdate(index, { status: 'generating', errorMessage: undefined, prompt: prompt });

  const imagesToPrepare: { data: string; mimeType: string; label: string }[] = [];
  const parts: Part[] = [];

  try {
    // 1. Add Face
    if (!isNonFashion && characterFace) {
      const compressedFace = await resizeImageBase64(characterFace.data, characterFace.mimeType);
      imagesToPrepare.push({ data: compressedFace, mimeType: characterFace.mimeType, label: 'character face' });
    }

    // 2. Add Main Item(s)
    if (isNonFashion && allUploadedItems.productImage) {
      const compressed = await resizeImageBase64(allUploadedItems.productImage.data, allUploadedItems.productImage.mimeType);
      imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.productImage.mimeType, label: 'product image' });
    } else {
      const lowerCasePrompt = prompt.toLowerCase();
      const prefersBack = lowerCasePrompt.includes('back view') || lowerCasePrompt.includes('from behind') || lowerCasePrompt.includes('rear view');

      if (category === ProductCategory.SHOES && allUploadedItems.shoes) {
        const compressed = await resizeImageBase64(allUploadedItems.shoes.data, allUploadedItems.shoes.mimeType);
        imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.shoes.mimeType, label: 'shoes' });
      } else if (category === ProductCategory.ACCESSORIES && allUploadedItems.accessories) {
        const compressed = await resizeImageBase64(allUploadedItems.accessories.data, allUploadedItems.accessories.mimeType);
        imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.accessories.mimeType, label: 'accessories' });
      } else if (category === ProductCategory.SAREE) {
        if (allUploadedItems.drape) {
          const compressed = await resizeImageBase64(allUploadedItems.drape.data, allUploadedItems.drape.mimeType);
          imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.drape.mimeType, label: 'saree drape' });
        }
        if (allUploadedItems.blouse) {
          const compressed = await resizeImageBase64(allUploadedItems.blouse.data, allUploadedItems.blouse.mimeType);
          imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.blouse.mimeType, label: 'blouse' });
        }
        if (allUploadedItems.accessory1) {
          const compressed = await resizeImageBase64(allUploadedItems.accessory1.data, allUploadedItems.accessory1.mimeType);
          imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.accessory1.mimeType, label: 'accessory 1' });
        }
        if (allUploadedItems.accessory2) {
          const compressed = await resizeImageBase64(allUploadedItems.accessory2.data, allUploadedItems.accessory2.mimeType);
          imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.accessory2.mimeType, label: 'accessory 2' });
        }
      } else {
        // Top
        if (prefersBack && allUploadedItems.topBack) {
          const compressed = await resizeImageBase64(allUploadedItems.topBack.data, allUploadedItems.topBack.mimeType);
          imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.topBack.mimeType, label: 'Top back' });
        } else if (allUploadedItems.topFront) {
          const compressed = await resizeImageBase64(allUploadedItems.topFront.data, allUploadedItems.topFront.mimeType);
          imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.topFront.mimeType, label: 'Top front' });
        }
        // Bottom
        if (prefersBack && allUploadedItems.bottomBack) {
          const compressed = await resizeImageBase64(allUploadedItems.bottomBack.data, allUploadedItems.bottomBack.mimeType);
          imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.bottomBack.mimeType, label: 'Bottom back' });
        } else if (allUploadedItems.bottomFront) {
          const compressed = await resizeImageBase64(allUploadedItems.bottomFront.data, allUploadedItems.bottomFront.mimeType);
          imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.bottomFront.mimeType, label: 'Bottom front' });
        }
      }
    }

    // 3. Add Context Items
    if (!isNonFashion) {
      if (category !== ProductCategory.SHOES && allUploadedItems.shoes) {
        const compressed = await resizeImageBase64(allUploadedItems.shoes.data, allUploadedItems.shoes.mimeType);
        imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.shoes.mimeType, label: 'shoes (context)' });
      }
      if (category !== ProductCategory.ACCESSORIES && allUploadedItems.accessories) {
        const compressed = await resizeImageBase64(allUploadedItems.accessories.data, allUploadedItems.accessories.mimeType);
        imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.accessories.mimeType, label: 'accessories (context)' });
      }
      if (allUploadedItems.sunglasses) {
        const compressed = await resizeImageBase64(allUploadedItems.sunglasses.data, allUploadedItems.sunglasses.mimeType);
        imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.sunglasses.mimeType, label: 'sunglasses' });
      }
    }

    // Add Background
    if (allUploadedItems.background) {
      const compressed = await resizeImageBase64(allUploadedItems.background.data, allUploadedItems.background.mimeType);
      imagesToPrepare.push({ data: compressed, mimeType: allUploadedItems.background.mimeType, label: 'background' });
    }

    // 4. ADD SHOT-LEVEL REFERENCE IMAGE
    let referenceImageInstruction = "";
    if (shot.referenceImage) {
      const compressedRef = await resizeImageBase64(shot.referenceImage.data, shot.referenceImage.mimeType);
      imagesToPrepare.push({ data: compressedRef, mimeType: shot.referenceImage.mimeType, label: 'reference image' });
      referenceImageInstruction = " IMPORTANT: A Reference Image has been provided. You MUST match its Camera Angle, Composition, and Framing exactly. The generated image should look like the Reference Image but with the product/subject replacing the original content.";
    }

    // Convert prepared images to Parts
    for (const img of imagesToPrepare) {
      parts.push(base64ToImagePart(img.data, img.mimeType));
    }

    // Create a description of what each image represents (for the prompt)
    const imageDescriptions = imagesToPrepare.map((img, index) => `Image ${index + 1}: ${img.label}`).join(', ');
    const imageContext = imagesToPrepare.length > 0
      ? `\n\nREFERENCE IMAGES FOR CHARACTER CONSISTENCY (${imagesToPrepare.length} total): ${imageDescriptions}.

**CRITICAL INSTRUCTIONS FOR REFERENCE IMAGES:**
- Image 1 (character face): Use this EXACT face identity - match facial features, proportions, skin tone, expression style
- Garment/Saree images: Replicate the EXACT textures, patterns, colors, materials, and fit shown. For Saree, combine the Drape and Blouse into a single cohesive outfit.
- Background/context images: Use as environmental reference for lighting and setting
- You MUST maintain character consistency across all aspects - face, outfit, and style details from the references

DO NOT generate a different person or different clothes. The reference images show the EXACT appearance required.\n`
      : '';

    // 5. Construct Prompt
    const brandPrefix = brandName ? `For brand ${brandName}. ` : '';

    // Environment & Lighting Injection
    let envInstruction = "";
    if (environment) envInstruction += ` Environment: ${environment}.`;
    if (lighting) envInstruction += ` Lighting: ${lighting}.`;
    if (allUploadedItems.background) envInstruction += " Use the provided background image as the exact environment setting.";

    // Fashion & Mood Injection
    let styleInstruction = "";
    if (fashionType) styleInstruction += ` Fashion Style: ${fashionType}.`;
    if (mood) styleInstruction += ` Mood & Atmosphere: ${mood}.`;

    let basePrompt = CORE_GENERATION_PROMPT;
    if (isNonFashion) {
      basePrompt = PRODUCT_GENERATION_PROMPT;
    }

    // Camera Configuration
    let cameraInstruction = "";
    if (cameraConfig) {
      if (cameraConfig.framing) cameraInstruction += ` Framing: ${cameraConfig.framing}.`;
      if (cameraConfig.angle) cameraInstruction += ` Camera Angle: ${cameraConfig.angle}.`;
      if (cameraConfig.focalLength) cameraInstruction += ` Lens: ${cameraConfig.focalLength}.`;
    }

    // Styling & Fabric Injection (Consolidated)
    let detailsInstruction = "";
    if (stylingConfig && stylingConfig.materialDescription) {
      detailsInstruction += ` Material & Texture Details: ${stylingConfig.materialDescription}.`;
    }

    // Negative Prompt Construction
    const combinedNegativePrompt = `${DEFAULT_NEGATIVE_PROMPT}, ${negativePrompt || ''}`;
    const negativeInstruction = ` Avoid: ${combinedNegativePrompt}.`;

    const fullPrompt = `${brandPrefix} ${basePrompt} ${styleInstruction} ${envInstruction} ${cameraInstruction} ${detailsInstruction} **VERY IMPORTANT - SPECIFIC SHOT INSTRUCTIONS (Generated Image should STRICTLY Follow this Instruction, do not deviate from this )**: ${prompt} TEXTURE & PATTERN LOCK (CRITICAL):
- The fabric texture and pattern MUST remain identical to the reference and previous shots.
- Pattern scale, spacing, alignment, and weave density are FIXED.
- Fabric folds may deform the pattern naturally but must NOT redraw, blur, stretch, or repaint it.
- The check pattern must remain continuous and traceable across the entire garment.
- No area of the product may appear smoother, sharper, or differently textured than another.

GARMENT BEHAVIOR:
- Treat the garment as a real woven fabric being bent by the body.
- Do NOT reinterpret the fabric pattern based on pose or lighting.
- Seams, plackets, buttons, and pockets must preserve pattern alignment.

- The product material, texture, pattern, and identity must remain unchanged.

**HALLUCINATION PREVENTION — STRICT MODE**

You are NOT allowed to invent, regenerate, reinterpret, enhance, or infer any visual information.
You may ONLY use pixels, geometry, textures, identities, and details explicitly present in the provided references.

ABSOLUTE RULES:
• Do NOT guess missing details
• Do NOT “improve”, “clean”, “beautify”, or “optimize”
• Do NOT smooth, redraw, rescale, or re-texture anything
• Do NOT create new patterns, stitching, folds, logos, text, or surfaces
• Do NOT modify color, material response, gloss, roughness, or wear

**FAILURE CONDITION:**
If the fabric pattern appears regenerated, resynthesized, softened, or inconsistent at any point,
this shot is INVALID and must be regenerated.

1:1 Product high fidelity and detailed to last pixel 

**FINAL CHECK**
Before delivering, verify:
1. Does the product texture match the reference everywhere? YES / NO
2. Is fabric detail consistent across folds and seams? YES / NO
3. Is the character identity unchanged? YES / NO

If ANY answer is NO — correct until ALL are YES.

${referenceImageInstruction} 
${negativeInstruction}`

      ;
    parts.push({ text: `${imageContext}\n\n${fullPrompt}` });

    const startTime = Date.now();
    console.log(`Sending generateContent request for image ${index}`);
    console.log("Prompt parts being sent to the model:");
    console.log(JSON.stringify(parts, null, 2));

    const response: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
      model: modelToUse,
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        safetySettings: SAFETY_SETTINGS,
        seed: seed,
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize,
        },
      },
    }));

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
      console.warn(`GenerateContent response for image ${index} did not contain valid candidates or content.`);
      throw new Error('Received an empty or invalid response from the model.');
    }

    let initialGeneratedImageBase64: string | undefined;
    let initialGeneratedImageMimeType: string = 'image/jpeg';

    for (const part of response.candidates[0].content.parts || []) {
      if (part.inlineData) {
        initialGeneratedImageBase64 = part.inlineData.data;
        initialGeneratedImageMimeType = part.inlineData.mimeType;
        break;
      }
    }

    if (!initialGeneratedImageBase64) {
      throw new Error('No image data found in the response for initial generation.');
    }

    onProgressUpdate(index, {
      status: 'success',
      url: `data:${initialGeneratedImageMimeType};base64,${initialGeneratedImageBase64}`,
      errorMessage: undefined,
      generationTime: duration,
    });

  } catch (e: any) {
    console.error(`API Error during generateTryOn for pose: ${prompt}`, e);
    const errorMessage = getReadableErrorMessage(e);
    onProgressUpdate(index, { status: 'failed', errorMessage: errorMessage });
  }
};

export const generateTryOn = async (
  characterFace: UploadedFile | undefined,
  allUploadedItems: UploadedFiles,
  modelConfig: typeof MODEL_CONFIGS[ModelType],
  shots: ShotConfig[], // CHANGED from posePrompts: string[]
  brandName: string | undefined,
  category: ProductCategory,
  environment: string | undefined,
  lighting: string | undefined,
  stylingConfig: StylingConfig | undefined,
  cameraConfig: CameraConfig | undefined,
  negativePrompt: string | undefined,
  seed: number | undefined,
  fashionType: string | undefined,
  mood: string | undefined,
  onProgressUpdate: (index: number, update: Partial<GeneratedImage>) => void,
): Promise<void> => {
  for (let i = 0; i < shots.length; i++) {
    generateSingleTryOnImage(
      characterFace,
      allUploadedItems,
      modelConfig,
      shots[i],
      brandName,
      category,
      environment,
      lighting,
      stylingConfig,
      cameraConfig,
      negativePrompt,
      seed,
      fashionType,
      mood,
      i,
      onProgressUpdate
    );
  }
};


export const geminiService = {
  generateTryOn,
  generateSingleTryOnImage,
  async editImage(
    base64Image: string,
    prompt: string,
    referenceImages: { data: string; mimeType: string }[] = [],
    aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '3:4'
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: currentApiKey });
    const compressedMain = await resizeImageBase64(base64Image, 'image/jpeg');

    const parts: Part[] = [
      base64ToImagePart(compressedMain, 'image/jpeg'),
    ];

    for (const ref of referenceImages) {
      const compressedRef = await resizeImageBase64(ref.data, ref.mimeType);
      parts.push(base64ToImagePart(compressedRef, 'image/jpeg'));
    }

    // STRICT EDITING PROMPT
    const strictEditPrompt = `
    Input Image provided.
    **Task:** Edit this specific image according to this instruction: "${prompt}".
    
    TEXTURE IMMUTABILITY RULE (CRITICAL):
    - The product fabric pattern is FIXED as per the given refernce and must not be regenerated.
    - Pattern scale, spacing, and alignment must remain globally consistent.
    - Fabric folds may deform the pattern, but must NOT redraw, blur, or resynthesize it.
    - The same check pattern must be traceable continuously across the entire garment.
    - Any area that appears repainted, softened, or reinterpreted is invalid.

    **STRICT EDITING RULES:**
    1. **Preserve Subject Identity:** The main subject (person, product, garment) MUST remain exactly the same. Do not change the face, body type, or clothing details unless the prompt specifically asks to change them.
    2. **Preserve Pose & Angle:** The camera angle and subject's pose must not change unless specified in the prompt.
    3. **Targeted Change:** Only modify the background or the specific element mentioned in the instruction. 
    4. **Integration:** Ensure the lighting on the subject matches the new background/element naturally, but do not alter the subject's morphology.
    `;

    parts.push({ text: strictEditPrompt });

    try {
      console.log('Sending editImage request.');
      const response: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: { parts: parts },
        config: {
          // Override system instruction for strict retouching behavior
          systemInstruction: "You are an expert professional photo retoucher. Your primary goal is to EXECUTE EDITS on the provided image while PRESERVING the original subject, pose, and composition. Do not hallucinate new subjects. Do not change the aspect ratio or camera angle. Only change what is explicitly asked.",
          safetySettings: SAFETY_SETTINGS,
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: '4K',
          },
        },
      }));

      if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
        throw new Error('Received an empty or invalid response from the model during editing.');
      }

      for (const part of response.candidates[0].content.parts || []) {
        if (part.inlineData) {
          return `data:image/jpeg;base64,${part.inlineData.data}`;
        }
      }
      throw new Error('No image data found in the response during editing.');

    } catch (e: any) {
      console.error('API Error during editImage:', e);
      const errorMessage = getReadableErrorMessage(e);
      throw new Error(`Editing failed: ${errorMessage}`);
    }
  },
  refineImageDetails,
};
