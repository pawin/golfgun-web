/**
 * Resize image bytes to specified dimensions
 * Note: This is a browser-compatible version using Canvas API
 */
export async function resizeImageBytes(
  imageBytes: Uint8Array,
  options: { width?: number; height?: number } = {}
): Promise<Uint8Array> {
  const { width = 2048, height = 2048 } = options;

  return new Promise((resolve, reject) => {
    const blob = new Blob([imageBytes], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          blob.arrayBuffer().then((buffer) => {
            resolve(new Uint8Array(buffer));
          });
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image'));
    };

    img.src = url;
  });
}

/**
 * Resize and crop image bytes to a square
 */
export async function resizeAndCropImageBytes(
  imageBytes: Uint8Array,
  options: { size?: number } = {}
): Promise<Uint8Array> {
  const { size = 2048 } = options;

  return new Promise((resolve, reject) => {
    const blob = new Blob([imageBytes], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const minSide = Math.min(img.width, img.height);
      const xOffset = (img.width - minSide) / 2;
      const yOffset = (img.height - minSide) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(
        img,
        xOffset,
        yOffset,
        minSide,
        minSide,
        0,
        0,
        size,
        size
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          blob.arrayBuffer().then((buffer) => {
            resolve(new Uint8Array(buffer));
          });
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image'));
    };

    img.src = url;
  });
}

