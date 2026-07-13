// Image upload utility using Supabase Storage (replaces AWS S3)
// Uploads base64 images to the 'kie-uploads' bucket and returns public URLs

import { supabaseStorage } from '../lib/supabase';

const BUCKET = 'project-assets';
const FOLDER = 'kie-refs';

/**
 * Upload a base64 image to Supabase Storage and return the public URL.
 */
export async function uploadImageToS3(
    base64Data: string,
    mimeType: string,
    filename?: string
): Promise<string> {
    const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const finalFilename = filename || `img_${crypto.randomUUID()}.${extension}`;
    const path = `${FOLDER}/${finalFilename}`;

    // Strip data URL prefix if present
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    // Convert base64 → Uint8Array
    const byteString = atob(cleanBase64);
    const uint8Array = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], { type: mimeType });

    const { error } = await supabaseStorage.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: mimeType, upsert: true });

    if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload image to Supabase: ${error.message}`);
    }

    const { data } = supabaseStorage.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Upload multiple images to Supabase Storage in parallel and return public URLs.
 */
export async function uploadImagesToS3(
    images: { data: string; mimeType: string }[]
): Promise<string[]> {
    console.log(`Uploading ${images.length} images to Supabase Storage...`);
    const promises = images.map((img) =>
        uploadImageToS3(img.data, img.mimeType)
    );
    return Promise.all(promises);
}
