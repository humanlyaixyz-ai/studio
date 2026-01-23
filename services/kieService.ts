import { UploadedFiles, GeneratedImage, ModelType, ShotConfig, StylingConfig, CameraConfig, ProductCategory } from '../types';
import { MODEL_CONFIGS, KIE_MODEL_ID, KIE_CALLBACK_URL, CORE_GENERATION_PROMPT, PRODUCT_GENERATION_PROMPT, REFINEMENT_PROMPT, SYSTEM_INSTRUCTION, DEFAULT_NEGATIVE_PROMPT, NON_FASHION_CATEGORIES } from '../constants';
import { resizeImageBase64 } from '../utils/imageUtils';
import { uploadImagesToS3 } from './s3Upload';

// --- Kie.ai Service ---

let currentApiKey = '';

export const setKieApiKey = (key: string) => {
    currentApiKey = key;
};

const KIE_API_BASE_URL = 'https://api.kie.ai/api/v1';

// Helper to call Kie API
async function callKieApi(endpoint: string, method: string, body?: any): Promise<any> {
    if (!currentApiKey) {
        throw new Error('Kie.ai API Key not set.');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${KIE_API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentApiKey}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    // Read response text first to handle non-JSON or weird responses
    const responseText = await response.text();
    let data: any;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        if (!response.ok) {
            throw new Error(`Kie API Error ${response.status}: ${response.statusText}`);
        }
        throw new Error(`Kie API returned invalid JSON: ${responseText.substring(0, 100)}`);
    }

    // Check both HTTP status and Kie's internal code field
    if (!response.ok || (data.code !== 0 && data.code !== 200 && data.code !== undefined)) {
        console.error(`Kie API Failure Log:`, {
            status: response.status,
            statusText: response.statusText,
            data: data
        });

        // Prioritize actual error fields. Never use "success" as an error message.
        const errorMsg = data.error ||
            data.errorMessage ||
            data.message ||
            (data.msg && data.msg !== 'success' ? data.msg : null) ||
            `Kie API Error (Code: ${data.code ?? 'N/A'}, HTTP: ${response.status})`;

        throw new Error(errorMsg);
    }

    return data;
}

// Polling Helper
async function pollTask(taskId: string): Promise<string> {
    const maxAttempts = 150; // 5 minutes timeout (150 * 2s = 300s)
    const delay = 2000; // 2 seconds

    for (let i = 0; i < maxAttempts; i++) {
        try {
            const data = await callKieApi(`/jobs/recordInfo?taskId=${taskId}`, 'GET');

            // Log full response for debugging
            console.log(`Poll attempt ${i + 1}/${maxAttempts} - Full response:`, JSON.stringify(data, null, 2));

            const taskData = data.data || data;

            // Normalize state check
            const state = (taskData.state || taskData.status)?.toLowerCase();
            console.log(`Task state: ${state}`);

            if (state === 'success' || state === 'succeeded') {
                console.log('Task succeeded! Extracting output URL...');

                // 1. Try resultJson (Standard for newer models)
                // 1. Try resultJson (Standard for newer models)
                if (taskData.resultJson) {
                    try {
                        let results = taskData.resultJson;
                        if (typeof results === 'string') {
                            try {
                                results = JSON.parse(results);
                            } catch (e) {
                                console.warn('resultJson was a string but failed to parse:', e);
                            }
                        }

                        console.log('Parsed resultJson:', results);

                        // Check for standard fields or the "resultUrls" array pattern
                        const url =
                            // 1. Direct resultUrls array (The case user provided)
                            (results?.resultUrls && Array.isArray(results.resultUrls) ? results.resultUrls[0] : undefined) ||
                            // 2. Direct array result
                            (Array.isArray(results) ? (results[0]?.url || results[0]?.proxy_url || results[0]?.image_url || results[0]) : undefined) ||
                            // 3. Object result
                            (results?.url || results?.image_url);

                        if (typeof url === 'string' && url.startsWith('http')) {
                            console.log('✅ Image URL found in resultJson:', url);
                            return url;
                        }
                    } catch (parseError) {
                        console.error('Error processing resultJson:', parseError);
                    }
                }

                // 2. Try modelOutputs (Common for Banana/Kie models)
                if (taskData.modelOutputs) {
                    const outputs = taskData.modelOutputs;
                    console.log('Checking modelOutputs:', outputs);

                    // Often an array of objects or strings
                    if (Array.isArray(outputs) && outputs.length > 0) {
                        const firstOutput = outputs[0];
                        // precise check for various formats
                        const url = firstOutput?.url || firstOutput?.image_url || firstOutput?.image || (typeof firstOutput === 'string' ? firstOutput : undefined);

                        if (url && typeof url === 'string' && url.startsWith('http')) {
                            console.log('✅ Image URL found in modelOutputs:', url);
                            return url;
                        }
                    }
                }

                // 3. Try result or output object (Fallbacks)
                const result = taskData.result || taskData.output || taskData.data; // Added taskData.data check
                if (result) {
                    console.log('Checking result/output/data object:', result);
                    const url = result.url || result.image_url || result.image || (Array.isArray(result) ? result[0] : undefined);
                    if (url && typeof url === 'string' && url.startsWith('http')) {
                        console.log('✅ Image URL found in result/output:', url);
                        return url;
                    }
                }

                // 4. Last ditch top-level fields
                const topUrl = taskData.url || taskData.image_url || taskData.output_url || taskData.generated_image;
                if (topUrl && typeof topUrl === 'string' && topUrl.startsWith('http')) {
                    console.log('✅ Image URL found at top level:', topUrl);
                    return topUrl;
                }

                throw new Error(`Task succeeded but no image URL could be extracted. Response: ${JSON.stringify(taskData)}`);
            } else if (state === 'fail' || state === 'failed' || state === 'error') {
                console.error('Kie Task Failure Detected:', JSON.stringify(taskData, null, 2));
                // Prioritize explicit error fields over 'msg'/'message' which often contains "success" at the transport level
                const errorMsg = taskData.error || taskData.errorMessage || taskData.message || (taskData.msg !== 'success' ? taskData.msg : null) || 'Task failed on Kie.ai';
                throw new Error(errorMsg);
            } else {
                console.log(`Task state: ${state || 'unknown'} - waiting...`);
            }

        } catch (error: any) {
            // Rethrow all errors to the caller
            console.error('Polling cycle error:', error);
            throw error;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new Error(`Generation timed out after 5 minutes. The task may still be running at Kie.ai.`);
}

export const kieService = {
    async generateSingleTryOnImage(
        characterFace: UploadedFiles['characterFace'],
        allUploadedItems: UploadedFiles,
        modelConfig: any,
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
        batchId: string, // Unique identifier for the generation batch
    ): Promise<void> {
        onProgressUpdate(index, { status: 'generating', errorMessage: undefined });

        try {
            // --- 1. PREPARE IMAGES (Mirroring GeminiService Logic) ---
            // Track both image data and labels
            const imagesToUpload: { data: string; mimeType: string; label: string }[] = [];
            const isNonFashion = NON_FASHION_CATEGORIES.includes(category);

            // Add Face
            if (!isNonFashion && characterFace) {
                const compressedFace = await resizeImageBase64(characterFace.data, characterFace.mimeType);
                imagesToUpload.push({ data: compressedFace, mimeType: characterFace.mimeType, label: 'character face' });
            }

            // Add Main Item(s)
            if (isNonFashion && allUploadedItems.productImage) {
                const compressed = await resizeImageBase64(allUploadedItems.productImage.data, allUploadedItems.productImage.mimeType);
                imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.productImage.mimeType, label: 'product image' });
            } else {
                const lowerCasePrompt = shot.prompt.toLowerCase();
                const prefersBack = lowerCasePrompt.includes('back view') || lowerCasePrompt.includes('from behind') || lowerCasePrompt.includes('rear view');

                if (category === ProductCategory.SHOES && allUploadedItems.shoes) {
                    const compressed = await resizeImageBase64(allUploadedItems.shoes.data, allUploadedItems.shoes.mimeType);
                    imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.shoes.mimeType, label: 'shoes' });
                } else if (category === ProductCategory.ACCESSORIES && allUploadedItems.accessories) {
                    const compressed = await resizeImageBase64(allUploadedItems.accessories.data, allUploadedItems.accessories.mimeType);
                    imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.accessories.mimeType, label: 'accessories' });
                } else if (category === ProductCategory.SAREE) {
                    if (allUploadedItems.drape) {
                        const compressed = await resizeImageBase64(allUploadedItems.drape.data, allUploadedItems.drape.mimeType);
                        imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.drape.mimeType, label: 'saree drape' });
                    }
                    if (allUploadedItems.blouse) {
                        const compressed = await resizeImageBase64(allUploadedItems.blouse.data, allUploadedItems.blouse.mimeType);
                        imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.blouse.mimeType, label: 'blouse' });
                    }
                    if (allUploadedItems.accessory1) {
                        const compressed = await resizeImageBase64(allUploadedItems.accessory1.data, allUploadedItems.accessory1.mimeType);
                        imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.accessory1.mimeType, label: 'accessory 1' });
                    }
                    if (allUploadedItems.accessory2) {
                        const compressed = await resizeImageBase64(allUploadedItems.accessory2.data, allUploadedItems.accessory2.mimeType);
                        imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.accessory2.mimeType, label: 'accessory 2' });
                    }
                } else {
                    // Top
                    if (prefersBack && allUploadedItems.topBack) {
                        const compressed = await resizeImageBase64(allUploadedItems.topBack.data, allUploadedItems.topBack.mimeType);
                        imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.topBack.mimeType, label: 'Top back' });
                    } else if (allUploadedItems.topFront) {
                        const compressed = await resizeImageBase64(allUploadedItems.topFront.data, allUploadedItems.topFront.mimeType);
                        imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.topFront.mimeType, label: 'Top front' });
                    }
                    // Bottom
                    if (prefersBack && allUploadedItems.bottomBack) {
                        const compressed = await resizeImageBase64(allUploadedItems.bottomBack.data, allUploadedItems.bottomBack.mimeType);
                        imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.bottomBack.mimeType, label: 'Bottom back' });
                    } else if (allUploadedItems.bottomFront) {
                        const compressed = await resizeImageBase64(allUploadedItems.bottomFront.data, allUploadedItems.bottomFront.mimeType);
                        imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.bottomFront.mimeType, label: 'Bottom front' });
                    }
                }
            }

            // Add Context Items
            if (!isNonFashion) {
                if (category !== ProductCategory.SHOES && allUploadedItems.shoes) {
                    const compressed = await resizeImageBase64(allUploadedItems.shoes.data, allUploadedItems.shoes.mimeType);
                    imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.shoes.mimeType, label: 'shoes (context)' });
                }
                if (category !== ProductCategory.ACCESSORIES && allUploadedItems.accessories) {
                    const compressed = await resizeImageBase64(allUploadedItems.accessories.data, allUploadedItems.accessories.mimeType);
                    imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.accessories.mimeType, label: 'accessories (context)' });
                }
                if (allUploadedItems.sunglasses) {
                    const compressed = await resizeImageBase64(allUploadedItems.sunglasses.data, allUploadedItems.sunglasses.mimeType);
                    imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.sunglasses.mimeType, label: 'sunglasses' });
                }
            }

            // Add Background
            if (allUploadedItems.background) {
                const compressed = await resizeImageBase64(allUploadedItems.background.data, allUploadedItems.background.mimeType);
                imagesToUpload.push({ data: compressed, mimeType: allUploadedItems.background.mimeType, label: 'background' });
            }

            // Add Shot Reference Image
            let referenceImageInstruction = "";
            if (shot.referenceImage) {
                const compressedRef = await resizeImageBase64(shot.referenceImage.data, shot.referenceImage.mimeType);
                imagesToUpload.push({ data: compressedRef, mimeType: shot.referenceImage.mimeType, label: 'reference image' });
                referenceImageInstruction = " IMPORTANT: A Reference Image has been provided. You MUST match its Camera Angle, Composition, and Framing exactly. The generated image should look like the Reference Image but with the product/subject replacing the original content.";
            }

            // --- UPLOAD IMAGES TO S3 ---
            console.log(`Uploading ${imagesToUpload.length} images to S3...`);
            // Upload only the data and mimeType
            const imageUrls = await uploadImagesToS3(imagesToUpload.map(img => ({ data: img.data, mimeType: img.mimeType })));
            console.log('Images uploaded to S3:', imageUrls);

            // Create a description of what each image represents (for the prompt)
            const imageDescriptions = imagesToUpload.map((img, index) => `Image ${index + 1}: ${img.label}`).join(', ');
            const imageContext = imagesToUpload.length > 0
                ? `\n\nREFERENCE IMAGES FOR CHARACTER CONSISTENCY (${imagesToUpload.length} total): ${imageDescriptions}.

**CRITICAL INSTRUCTIONS FOR REFERENCE IMAGES:**
- Image 1 (character face): Use this EXACT face identity - match facial features, proportions, skin tone, expression style
- Garment/Saree images: Replicate the EXACT textures, patterns, colors, materials, and fit shown. For Saree, combine the Drape and Blouse into a single cohesive outfit.
- Background/context images: Use as environmental reference for lighting and setting
- You MUST maintain character consistency across all aspects - face, outfit, and style details from the references

DO NOT generate a different person or different clothes. The reference images show the EXACT appearance required.\n`
                : '';
            console.log('Image context for prompt:', imageContext);

            // --- 2. CONSTRUCT FULL PROMPT (Mirroring GeminiService Logic) ---
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

            const fullPrompt = `${brandPrefix} ${basePrompt} ${styleInstruction} ${envInstruction} ${cameraInstruction} ${detailsInstruction} **VERY IMPORTANT - SPECIFIC SHOT INSTRUCTIONS (Generated Image should STRICTLY Follow this Instruction, do not deviate from this )**: ${shot.prompt} TEXTURE & PATTERN LOCK (CRITICAL):
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
• Do NOT "improve", "clean", "beautify", or "optimize"
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
${negativeInstruction}`;

            // --- 3. CONSTRUCT PAYLOAD ---
            // Merge System Instruction and Image Context into the main prompt
            const finalPrompt = `${SYSTEM_INSTRUCTION}${imageContext}\n\n${fullPrompt}`;

            const payload = {
                model: KIE_MODEL_ID, // 'nano-banana-pro'
                input: {
                    prompt: finalPrompt,
                    image_input: imageUrls, // Updated to image_input per official documentation for Nano Banana Pro
                    negative_prompt: combinedNegativePrompt,
                    aspect_ratio: modelConfig.aspectRatio || "3:4",
                    num_images: 1,
                    resolution: "4K", // Added resolution parameter
                    output_format: "png", // Added output_format parameter
                    callBackUrl: `${KIE_CALLBACK_URL}?batchId=${batchId}&index=${index}` // Unique callback URL for each generation
                }
            };

            console.log("Kie.ai Payload:", JSON.stringify(payload, null, 2));

            // 1. Initiate Task
            const initialResponse = await callKieApi('/jobs/createTask', 'POST', payload);
            console.log("Kie.ai Initial Response:", JSON.stringify(initialResponse, null, 2));

            // Expecting { code: 0, data: { taskId: "..." } }
            const taskId = initialResponse.data?.taskId || initialResponse.taskId;

            if (!taskId) {
                const respError = initialResponse.message || initialResponse.msg || initialResponse.error || "Unknown Error";
                throw new Error(`Failed to start task: No Task ID received. API Response: ${JSON.stringify(initialResponse)}`);
            }

            // 2. Poll Task
            const imageUrl = await pollTask(taskId);

            onProgressUpdate(index, { status: 'success', url: imageUrl });

        } catch (error: any) {
            console.error("Kie Generation Error:", error);
            onProgressUpdate(index, { status: 'failed', errorMessage: error.message });
        }
    },

    async generateTryOn(
        characterFace: UploadedFiles['characterFace'],
        allUploadedItems: UploadedFiles,
        modelConfig: any,
        shots: ShotConfig[],
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
        batchId: string, // Pass batchId from App.tsx
    ): Promise<void> {
        // Parallel execution
        const promises = shots.map((shot, i) =>
            this.generateSingleTryOnImage(
                characterFace,
                allUploadedItems,
                modelConfig,
                shot,
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
                onProgressUpdate,
                batchId
            )
        );
        await Promise.all(promises);
    },

    async editImage(
        imageInput: string, // Can be base64 or URL
        prompt: string,
        referenceImages: { data: string; mimeType: string }[] = [],
        aspectRatio: string
    ): Promise<string> {
        // Ensure the main image is also an S3 URL
        let mainImageUrl = imageInput;
        if (!imageInput.startsWith('http')) {
            const uploaded = await uploadImagesToS3([{ data: imageInput, mimeType: 'image/jpeg' }]);
            mainImageUrl = uploaded[0];
        }

        // Upload reference images to S3
        const refUrls = referenceImages.length > 0
            ? await uploadImagesToS3(referenceImages)
            : [];

        // In Kie.ai, all images (input + refs) usually go into image_urls
        const allImageUrls = [mainImageUrl, ...refUrls];

        const payload = {
            model: 'google/nano-banana-edit', // Example model
            input: {
                image_urls: allImageUrls, // Fixed field name: image -> image_urls
                prompt: prompt,
                aspect_ratio: aspectRatio
            }
        };

        const initialResponse = await callKieApi('/jobs/createTask', 'POST', payload);
        const taskId = initialResponse.data?.taskId || initialResponse.taskId;

        if (taskId) {
            return await pollTask(taskId);
        }
        throw new Error('Edit failed: No Task ID');
    },

    async refineImageDetails(
        imageInput: string, // Can be base64 or URL
        generatedMimeType: string,
        originalGarments: UploadedFiles,
        imageSize: string,
        aspectRatio: string,
        modelToUse: string,
    ): Promise<string> {
        // Ensure image is S3 URL
        let mainImageUrl = imageInput;
        if (!imageInput.startsWith('http')) {
            const uploaded = await uploadImagesToS3([{ data: imageInput, mimeType: generatedMimeType }]);
            mainImageUrl = uploaded[0];
        }

        const payload = {
            model: KIE_MODEL_ID,
            input: {
                image_urls: [mainImageUrl], // Fixed field name: image -> image_urls (array)
                prompt: "Refine details, high quality",
                strength: 0.3 // Example parameter
            }
        };

        const initialResponse = await callKieApi('/jobs/createTask', 'POST', payload);
        const taskId = initialResponse.data?.taskId || initialResponse.taskId;

        if (taskId) {
            return await pollTask(taskId);
        }
        throw new Error('Refine failed: No Task ID');
    }
};