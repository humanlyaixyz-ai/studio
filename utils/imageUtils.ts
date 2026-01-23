
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Extract only the base64 part (after "data:image/png;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to convert file to base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blobToBase64(blob);
  } catch (error) {
    console.error('Error converting URL to Base64:', error);
    throw new Error('Failed to load image from URL for processing.');
  }
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        resolve('');
      }
    };
    reader.readAsDataURL(blob);
  });
};

export const resizeImageBase64 = (base64: string, mimeType: string, maxWidth = 1536, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `data:${mimeType};base64,${base64}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Get data URL as JPEG for compression
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      // Return only the base64 part
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = (e) => reject(new Error('Failed to load image for resizing'));
  });
};

export const createSolidColorBase64 = (color: string, width = 512, height = 512): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    // Returns data:image/jpeg;base64,... so we split it
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    return dataUrl.split(',')[1];
  }
  return '';
};

export interface ColorAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  exposure: number;   // -100 to 100
  temperature: number; // -100 to 100 (Blue <-> Orange)
  tint: number;       // -100 to 100 (Green <-> Magenta)
  sharpness: number;  // 0 to 100
}

export const applyColorGrading = (base64: string, adjustments: ColorAdjustments): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64}`;
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 1. Basic Filters (Brightness, Contrast, Saturation)
      // Convert slider range (-100 to 100) to CSS filter scale
      // Brightness: 1 is default. Range 0.5 to 1.5
      // Contrast: 1 is default. Range 0.5 to 1.5
      // Saturate: 1 is default. Range 0 to 2

      const b = 1 + (adjustments.brightness / 200);
      const c = 1 + (adjustments.contrast / 200);
      const s = 1 + (adjustments.saturation / 100);

      // Exposure simulation (Brightness filter + Opacity layering)
      const e = 1 + (adjustments.exposure / 150);

      const filterString = `brightness(${b * e}) contrast(${c}) saturate(${s})`;
      ctx.filter = filterString;

      // Draw the base image with filters
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none'; // Reset filter for overlays

      // 2. Temperature (Warmth/Coolness)
      // Simulate using overlay blending
      if (adjustments.temperature !== 0) {
        ctx.globalCompositeOperation = 'soft-light'; // or 'overlay'
        ctx.fillStyle = adjustments.temperature > 0
          ? '#FFA500' // Warm Orange
          : '#0099FF'; // Cool Blue

        // Opacity depends on strength
        ctx.globalAlpha = Math.abs(adjustments.temperature) / 200; // Max 0.5 opacity
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 3. Tint (Green/Magenta)
      if (adjustments.tint !== 0) {
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = adjustments.tint > 0
          ? '#FF00FF' // Magenta
          : '#00FF00'; // Green

        ctx.globalAlpha = Math.abs(adjustments.tint) / 200;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Reset composite settings
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;

      // 4. Sharpness (Convolution) - Simple approximation if needed
      // Note: Full convolution in JS on 4K images is slow. 
      // Skipping for performance unless requested specifically via WebGL.

      // Export
      const resultDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      resolve(resultDataUrl.split(',')[1]);
    };

    img.onerror = (e) => reject(new Error('Failed to load image for grading'));
  });
};
