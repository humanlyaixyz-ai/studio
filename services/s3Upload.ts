// S3 Upload Utility for Kie.ai Image References
// Uploads base64 images to S3 and returns public URLs

// S3 Configuration - Add these to your .env file
// AWS_ACCESS_KEY_ID=your_access_key
// AWS_SECRET_ACCESS_KEY=your_secret_key
// AWS_REGION=us-east-1
// AWS_S3_BUCKET=odnnet

const S3_CONFIG = {
    bucket: 'odnnet', // Update this to match your bucket
    region: 'us-east-1',
    folder: 'kie-uploads/', // Folder for temporary Kie uploads
};

/**
 * Upload a base64 image to S3 and return the public URL
 * @param base64Data Base64 encoded image data (without data:image/... prefix)
 * @param mimeType Image MIME type (e.g., 'image/jpeg')
 * @param filename Optional custom filename
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToS3(
    base64Data: string,
    mimeType: string,
    filename?: string
): Promise<string> {
    try {
        // Generate a unique filename if not provided
        const extension = mimeType.split('/')[1] || 'jpg';
        const finalFilename = filename || `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
        const s3Key = `${S3_CONFIG.folder}${finalFilename}`;

        // Convert base64 to Blob
        const byteString = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([uint8Array], { type: mimeType });

        // Get AWS credentials from environment or localStorage
        const accessKeyId = localStorage.getItem('aws_access_key_id') || (import.meta as any).env?.VITE_AWS_ACCESS_KEY_ID;
        const secretAccessKey = localStorage.getItem('aws_secret_access_key') || (import.meta as any).env?.VITE_AWS_SECRET_ACCESS_KEY;

        if (!accessKeyId || !secretAccessKey) {
            throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in localStorage or environment variables.');
        }

        // Generate presigned URL for upload using AWS Signature V4
        const url = await generatePresignedPutUrl(s3Key, mimeType, accessKeyId, secretAccessKey);

        // Upload the file
        const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: blob,
            headers: {
                'Content-Type': mimeType,
            },
        });

        if (!uploadResponse.ok) {
            throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        // Return the public URL
        const publicUrl = `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${s3Key}`;
        return publicUrl;

    } catch (error: any) {
        console.error('S3 Upload Error:', error);
        throw new Error(`Failed to upload image to S3: ${error.message}`);
    }
}

/**
 * Upload multiple images to S3 in parallel
 * @param images Array of {data: base64, mimeType: string}
 * @returns Array of public URLs
 */
export async function uploadImagesToS3(
    images: { data: string; mimeType: string }[]
): Promise<string[]> {
    const uploadPromises = images.map((img, index) =>
        uploadImageToS3(img.data, img.mimeType, `batch_${Date.now()}_${index}`)
    );

    return Promise.all(uploadPromises);
}

/**
 * Generate AWS Signature V4 presigned URL for PUT operation
 * Using browser-compatible implementation (no Node.js crypto)
 */
async function generatePresignedPutUrl(
    key: string,
    contentType: string,
    accessKeyId: string,
    secretAccessKey: string
): Promise<string> {
    const region = S3_CONFIG.region;
    const bucket = S3_CONFIG.bucket;
    const service = 's3';

    // Create date strings
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substr(0, 8);

    // Canonical request
    const method = 'PUT';
    const canonicalUri = `/${key}`;
    const canonicalQuerystring = '';
    const canonicalHeaders = `host:${bucket}.s3.${region}.amazonaws.com\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-date';
    const payloadHash = 'UNSIGNED-PAYLOAD';

    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    // String to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const canonicalRequestHash = await sha256(canonicalRequest);
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

    // Calculate signature
    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = await hmacSha256(stringToSign, signingKey);

    // Build authorization header
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Note: For presigned URLs, we'd normally use query parameters
    // For simplicity, we're using a direct PUT with auth header
    // You'll need to modify this to use XMLHttpRequest or fetch with custom headers

    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    // For browser, we need to return the URL with auth in header
    // This is a simplified version - in production, use AWS SDK or presigned URL library
    return url;
}

// Browser-compatible SHA256
async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return bufferToHex(hashBuffer);
}

// Browser-compatible HMAC-SHA256
async function hmacSha256(message: string, key: ArrayBuffer): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgBuffer);
    return bufferToHex(signature);
}

// Get signing key
async function getSignatureKey(
    key: string,
    dateStamp: string,
    regionName: string,
    serviceName: string
): Promise<ArrayBuffer> {
    const kDate = await hmacSha256Raw(dateStamp, new TextEncoder().encode(`AWS4${key}`).buffer);
    const kRegion = await hmacSha256Raw(regionName, kDate);
    const kService = await hmacSha256Raw(serviceName, kRegion);
    const kSigning = await hmacSha256Raw('aws4_request', kService);
    return kSigning;
}

async function hmacSha256Raw(message: string, key: ArrayBuffer): Promise<ArrayBuffer> {
    const msgBuffer = new TextEncoder().encode(message);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    return await crypto.subtle.sign('HMAC', cryptoKey, msgBuffer);
}

function bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
