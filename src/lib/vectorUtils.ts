/**
 * Utility functions to handle vector files (SVG, EPS, AI - Adobe Illustrator)
 */

/**
 * Checks if a file is a vector graphics file based on extension or MIME type
 */
export function isVectorFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith('.svg') ||
    name.endsWith('.eps') ||
    name.endsWith('.ai') ||
    type === 'image/svg+xml' ||
    type === 'application/postscript' ||
    type === 'application/eps' ||
    type === 'image/x-eps' ||
    type === 'application/illustrator'
  );
}

/**
 * Gets the file extension category for vector files
 */
export function getVectorType(file: File): 'svg' | 'eps' | 'ai' | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.svg') || file.type === 'image/svg+xml') return 'svg';
  if (name.endsWith('.eps') || file.type.includes('eps') || file.type.includes('postscript')) return 'eps';
  if (name.endsWith('.ai') || file.type.includes('illustrator')) return 'ai';
  return null;
}

/**
 * Rasterizes an SVG file to a PNG Data URL using HTML5 Canvas
 */
export async function rasterizeSvgToPng(file: File, width = 1024, height = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        return reject(new Error('Failed to read SVG file'));
      }

      // Create a blob URL for the SVG string to safely load into an Image
      const svgBlob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const targetWidth = img.naturalWidth || width;
          const targetHeight = img.naturalHeight || height;
          
          // Clamp maximum canvas size for performance
          const maxDim = 1536;
          let w = targetWidth;
          let h = targetHeight;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = w || 1024;
          canvas.height = h || 1024;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            URL.revokeObjectURL(url);
            return reject(new Error('Failed to get 2D canvas context'));
          }

          // Draw transparent/white canvas background then render SVG
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const pngDataUrl = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(pngDataUrl);
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG into image element'));
      };

      img.src = url;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

/**
 * Attempts to extract an embedded JPEG or PNG thumbnail from binary EPS or AI files.
 * Adobe Illustrator and EPS files frequently contain embedded JPEG/PNG preview streams.
 */
export async function extractEmbeddedVectorThumbnail(file: File): Promise<string | null> {
  const vectorType = getVectorType(file);
  
  if (vectorType === 'svg') {
    // For SVG, create direct Object URL
    return URL.createObjectURL(file);
  }

  if (vectorType !== 'eps' && vectorType !== 'ai') {
    return null;
  }

  try {
    // Read up to first 4MB of the binary file to search for JPEG / PNG thumbnail signatures
    const slice = file.slice(0, 4 * 1024 * 1024);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // 1. Search for JPEG magic bytes (FF D8 FF) and EOF (FF D9)
    let jpegStart = -1;
    let jpegEnd = -1;

    for (let i = 0; i < bytes.length - 3; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
        jpegStart = i;
        break;
      }
    }

    if (jpegStart !== -1) {
      // Find the last FF D9 marker after jpegStart
      for (let i = jpegStart + 10; i < bytes.length - 1; i++) {
        if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) {
          jpegEnd = i + 2;
          // Keep searching in case there's a larger full thumbnail stream, up to a reasonable size
          if (jpegEnd - jpegStart > 1000000) break;
        }
      }

      if (jpegEnd > jpegStart + 100) { // must be a reasonable image size (>100 bytes)
        const jpegBytes = bytes.subarray(jpegStart, jpegEnd);
        let binary = '';
        const len = jpegBytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(jpegBytes[i]);
        }
        const base64 = btoa(binary);
        return `data:image/jpeg;base64,${base64}`;
      }
    }

    // 2. Search for PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)
    let pngStart = -1;
    for (let i = 0; i < bytes.length - 8; i++) {
      if (
        bytes[i] === 0x89 &&
        bytes[i + 1] === 0x50 &&
        bytes[i + 2] === 0x4e &&
        bytes[i + 3] === 0x47 &&
        bytes[i + 4] === 0x0d &&
        bytes[i + 5] === 0x0a &&
        bytes[i + 6] === 0x1a &&
        bytes[i + 7] === 0x0a
      ) {
        pngStart = i;
        break;
      }
    }

    if (pngStart !== -1) {
      // Find IEND chunk in PNG (49 45 4E 44 AE 42 60 82)
      let pngEnd = -1;
      for (let i = pngStart + 8; i < bytes.length - 7; i++) {
        if (
          bytes[i] === 0x49 &&
          bytes[i + 1] === 0x45 &&
          bytes[i + 2] === 0x4e &&
          bytes[i + 3] === 0x44
        ) {
          pngEnd = i + 8;
          break;
        }
      }

      if (pngEnd > pngStart + 50) {
        const pngBytes = bytes.subarray(pngStart, pngEnd);
        let binary = '';
        const len = pngBytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(pngBytes[i]);
        }
        const base64 = btoa(binary);
        return `data:image/png;base64,${base64}`;
      }
    }
  } catch (err) {
    console.warn('Vector thumbnail extraction skipped:', err);
  }

  return null;
}
