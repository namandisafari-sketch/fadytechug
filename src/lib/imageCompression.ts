/**
 * Image compression utility for Fady Technologies
 * Compresses images larger than 200KB before upload
 */

const MAX_FILE_SIZE = 200 * 1024; // 200KB
const TARGET_FILE_SIZE = 180 * 1024; // Target 180KB to have some buffer

interface CompressionResult {
  file: File;
  wasCompressed: boolean;
  originalSize: number;
  compressedSize: number;
}

/**
 * Compress an image file if it exceeds the maximum size limit
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  // If file is already under the limit, return as-is
  if (file.size <= MAX_FILE_SIZE) {
    return {
      file,
      wasCompressed: false,
      originalSize,
      compressedSize: file.size
    };
  }

  // Only process image files
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }

  try {
    const compressedFile = await compressImageFile(file);
    return {
      file: compressedFile,
      wasCompressed: true,
      originalSize,
      compressedSize: compressedFile.size
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image');
  }
}

async function compressImageFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = async () => {
      try {
        // Calculate dimensions - reduce if image is very large
        let { width, height } = img;
        const maxDimension = 1920;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to get under target size
        let quality = 0.8;
        let blob: Blob | null = null;
        const minQuality = 0.3;
        const qualityStep = 0.1;

        while (quality >= minQuality) {
          blob = await new Promise<Blob | null>((res) => {
            canvas.toBlob(res, 'image/jpeg', quality);
          });

          if (blob && blob.size <= TARGET_FILE_SIZE) {
            break;
          }

          quality -= qualityStep;
        }

        // If still too large, reduce dimensions further
        if (blob && blob.size > TARGET_FILE_SIZE) {
          const scaleFactor = Math.sqrt(TARGET_FILE_SIZE / blob.size);
          const newWidth = Math.round(width * scaleFactor);
          const newHeight = Math.round(height * scaleFactor);

          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          blob = await new Promise<Blob | null>((res) => {
            canvas.toBlob(res, 'image/jpeg', 0.7);
          });
        }

        if (!blob) {
          reject(new Error('Failed to create compressed image'));
          return;
        }

        // Create new file with original name but .jpg extension
        const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
        const compressedFile = new File([blob], fileName, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        resolve(compressedFile);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
