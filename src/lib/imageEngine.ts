import { createIcoFile, type IcoFrame } from "./icoEncoder";
import { encodeBmp } from "./bmpEncoder";
import { encodeTiff } from "./tiffEncoder";
import { encodeGif } from "./gifEncoder";
import { loadAndDecodeImage } from "./imageDecoder";

export type ImageOutputFormat =
  | "png"
  | "jpg"
  | "jpeg"
  | "webp"
  | "ico"
  | "gif"
  | "bmp"
  | "svg"
  | "tiff";

export interface ImageConvertSettings {
  format: ImageOutputFormat;
  quality: number; // 1 - 100
  resizeMode: "original" | "pixels" | "percentage";
  targetWidth: number;
  targetHeight: number;
  percentage: number; // e.g. 50 = 50%
  maintainAspectRatio: boolean;
  transparencyMode: "preserve" | "fill";
  backgroundColor: string; // Hex color e.g. "#ffffff"
  icoSizes: number[]; // e.g. [16, 32, 48, 64, 128, 256]
}

export const DEFAULT_IMAGE_SETTINGS: ImageConvertSettings = {
  format: "png",
  quality: 92,
  resizeMode: "original",
  targetWidth: 1920,
  targetHeight: 1080,
  percentage: 100,
  maintainAspectRatio: true,
  transparencyMode: "preserve",
  backgroundColor: "#ffffff",
  icoSizes: [16, 32, 48, 64, 128, 256],
};

export const IMAGE_FORMAT_DEFS = [
  { id: "png", label: "PNG", hint: "Lossless · 32-bit RGBA alpha", ext: "png", mime: "image/png" },
  { id: "jpg", label: "JPG", hint: "Standard photo compression", ext: "jpg", mime: "image/jpeg" },
  { id: "jpeg", label: "JPEG", hint: "Standard JPEG photo format", ext: "jpeg", mime: "image/jpeg" },
  { id: "webp", label: "WEBP", hint: "Modern web · High compression", ext: "webp", mime: "image/webp" },
  { id: "ico", label: "ICO", hint: "Windows icon & Favicon bundle", ext: "ico", mime: "image/x-icon" },
  { id: "gif", label: "GIF", hint: "Smooth 256-color dithered image", ext: "gif", mime: "image/gif" },
  { id: "bmp", label: "BMP", hint: "Uncompressed Windows Bitmap", ext: "bmp", mime: "image/bmp" },
  { id: "svg", label: "SVG", hint: "Scalable Vector Graphic", ext: "svg", mime: "image/svg+xml" },
  { id: "tiff", label: "TIFF", hint: "Tagged Image File Format (Print)", ext: "tiff", mime: "image/tiff" },
] as const;

export const ICO_SIZE_PRESETS = [
  { size: 16, label: "16×16 (Browser tab)" },
  { size: 32, label: "32×32 (Standard favicon)" },
  { size: 48, label: "48×48 (Windows desktop)" },
  { size: 64, label: "64×64 (High-DPI favicon)" },
  { size: 128, label: "128×128 (Application)" },
  { size: 256, label: "256×256 (Full icon)" },
];

export const PRESET_BG_COLORS = [
  { name: "Pure White", value: "#ffffff" },
  { name: "Pitch Black", value: "#000000" },
  { name: "Dark Slate", value: "#0f172a" },
  { name: "Cool Grey", value: "#64748b" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Emerald", value: "#059669" },
  { name: "Rose", value: "#e11d48" },
];

/**
 * Calculates output dimensions based on resize settings and source aspect ratio.
 * Guarantees zero distortion and pixel-accurate dimension calculation.
 */
export function calculateDimensions(
  srcWidth: number,
  srcHeight: number,
  settings: ImageConvertSettings,
): { width: number; height: number } {
  const safeW = Math.max(1, srcWidth || 1200);
  const safeH = Math.max(1, srcHeight || 800);

  if (settings.resizeMode === "original") {
    return { width: safeW, height: safeH };
  }

  if (settings.resizeMode === "percentage") {
    const scale = Math.max(0.01, (settings.percentage || 100) / 100);
    return {
      width: Math.max(1, Math.round(safeW * scale)),
      height: Math.max(1, Math.round(safeH * scale)),
    };
  }

  // Exact Pixels mode
  const targetW = Number(settings.targetWidth);
  const targetH = Number(settings.targetHeight);

  if (settings.maintainAspectRatio) {
    const aspect = safeW / safeH;

    if (targetW > 0 && targetH <= 0) {
      return { width: Math.max(1, Math.round(targetW)), height: Math.max(1, Math.round(targetW / aspect)) };
    } else if (targetH > 0 && targetW <= 0) {
      return { width: Math.max(1, Math.round(targetH * aspect)), height: Math.max(1, Math.round(targetH)) };
    } else if (targetW > 0 && targetH > 0) {
      // If user provided both with aspect ratio locked, calculate proportional fit within bounding box
      const scale = Math.min(targetW / safeW, targetH / safeH);
      return {
        width: Math.max(1, Math.round(safeW * scale)),
        height: Math.max(1, Math.round(safeH * scale)),
      };
    }
  }

  return {
    width: Math.max(1, Math.round(targetW || safeW)),
    height: Math.max(1, Math.round(targetH || safeH)),
  };
}

/**
 * Progressive Multi-Step Downsampling (Hermite / Half-Step Downsampling).
 * Prevents aliasing, moiré patterns, and blurriness when downsizing high-resolution images.
 */
function progressiveResample(
  source: HTMLImageElement | HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  let currentWidth = source instanceof HTMLImageElement ? (source.naturalWidth || source.width) : source.width;
  let currentHeight = source instanceof HTMLImageElement ? (source.naturalHeight || source.height) : source.height;

  let intermediateCanvas = document.createElement("canvas");
  intermediateCanvas.width = currentWidth;
  intermediateCanvas.height = currentHeight;
  let intermediateCtx = intermediateCanvas.getContext("2d", { willReadFrequently: true })!;
  intermediateCtx.imageSmoothingEnabled = true;
  intermediateCtx.imageSmoothingQuality = "high";
  intermediateCtx.drawImage(source, 0, 0, currentWidth, currentHeight);

  // If downsampling by more than 2x, step down in 50% increments
  while (currentWidth * 0.5 >= targetWidth && currentHeight * 0.5 >= targetHeight) {
    const nextWidth = Math.max(targetWidth, Math.floor(currentWidth * 0.5));
    const nextHeight = Math.max(targetHeight, Math.floor(currentHeight * 0.5));

    const nextCanvas = document.createElement("canvas");
    nextCanvas.width = nextWidth;
    nextCanvas.height = nextHeight;
    const nextCtx = nextCanvas.getContext("2d", { willReadFrequently: true })!;
    nextCtx.imageSmoothingEnabled = true;
    nextCtx.imageSmoothingQuality = "high";
    nextCtx.drawImage(intermediateCanvas, 0, 0, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight);

    intermediateCanvas = nextCanvas;
    intermediateCtx = nextCtx;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  // Final draw to exact target dimensions with high-quality bicubic interpolation
  if (currentWidth !== targetWidth || currentHeight !== targetHeight) {
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const finalCtx = finalCanvas.getContext("2d", { willReadFrequently: true })!;
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = "high";
    finalCtx.drawImage(intermediateCanvas, 0, 0, currentWidth, currentHeight, 0, 0, targetWidth, targetHeight);
    return finalCanvas;
  }

  return intermediateCanvas;
}

/**
 * Renders an image with high-quality cubic resampling, background color fills, and alpha preservation.
 */
function renderHighQualityImage(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  settings: ImageConvertSettings,
): HTMLCanvasElement {
  const resampled = progressiveResample(img, targetWidth, targetHeight);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // Handle transparency vs solid background fill
  const isOpaqueFormat = settings.format === "jpg" || settings.format === "jpeg";
  const needsBgFill =
    isOpaqueFormat || (settings.transparencyMode === "fill" && Boolean(settings.backgroundColor));

  if (needsBgFill) {
    ctx.fillStyle = settings.backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(resampled, 0, 0);
  return canvas;
}

/**
 * Helper to convert canvas into Uint8Array PNG bytes for ICO container packaging.
 */
async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Canvas toBlob failed"));
      blob
        .arrayBuffer()
        .then((buf) => resolve(new Uint8Array(buf)))
        .catch(reject);
    }, "image/png");
  });
}

/**
 * Processes and converts an image in the browser using pure client-side HTML5 Canvas & Binary Encoders.
 * Supports PNG, JPG, JPEG, WEBP, ICO, GIF, BMP, SVG, TIFF with 100% in-memory processing.
 * Also generates a clean, sharp PNG DataURL for live previewing BMP, TIFF, ICO, and SVG in all browsers.
 */
export async function convertImage(
  imageSource: string | File | Blob,
  settings: ImageConvertSettings,
  originalFileName: string,
  sourceExt?: string,
): Promise<{ blob: Blob; mime: string; ext: string; width: number; height: number; previewUrl: string }> {
  const { imgElement, width: srcWidth, height: srcHeight } = await loadAndDecodeImage(imageSource, sourceExt);

  const { width, height } = calculateDimensions(srcWidth, srcHeight, settings);

  // 1. ICO conversion mode (Multi-resolution Windows Icon container with razor-sharp progressive resampling)
  if (settings.format === "ico") {
    const requestedSizes =
      settings.icoSizes && settings.icoSizes.length > 0
        ? settings.icoSizes
        : [16, 32, 48, 64, 128, 256];

    const frames: IcoFrame[] = [];
    let largestPreviewDataUrl = "";
    const largestSize = Math.max(...requestedSizes);

    for (const size of requestedSizes) {
      const iconCanvas = document.createElement("canvas");
      iconCanvas.width = size;
      iconCanvas.height = size;
      const ctx = iconCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, size, size);

      const resampled = progressiveResample(imgElement, size, size);
      ctx.drawImage(resampled, 0, 0);

      const pngData = await canvasToPngBytes(iconCanvas);
      frames.push({ width: size, height: size, pngData });

      if (size === largestSize) {
        largestPreviewDataUrl = iconCanvas.toDataURL("image/png");
      }
    }

    const icoBlob = createIcoFile(frames);
    return {
      blob: icoBlob,
      mime: "image/x-icon",
      ext: "ico",
      width: largestSize,
      height: largestSize,
      previewUrl: largestPreviewDataUrl,
    };
  }

  // 2. SVG conversion mode (Scalable Vector container with clean vector markup)
  if (settings.format === "svg") {
    const canvas = renderHighQualityImage(imgElement, width, height, settings);
    const dataUrl = canvas.toDataURL("image/png");

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" version="1.1">
  <title>${originalFileName.replace(/[<>&"]/g, "")}</title>
  <defs/>
  ${
    settings.transparencyMode === "fill" && settings.backgroundColor
      ? `<rect width="${width}" height="${height}" fill="${settings.backgroundColor}"/>`
      : ""
  }
  <image width="${width}" height="${height}" xlink:href="${dataUrl}" preserveAspectRatio="none"/>
</svg>`;

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    return {
      blob,
      mime: "image/svg+xml",
      ext: "svg",
      width,
      height,
      previewUrl: dataUrl,
    };
  }

  // 3. GIF conversion mode (GIF89a with balanced dithered gradients)
  if (settings.format === "gif") {
    const canvas = renderHighQualityImage(imgElement, width, height, settings);
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, width, height);
    const gifBlob = encodeGif(imageData);
    const previewUrl = canvas.toDataURL("image/png");
    return {
      blob: gifBlob,
      mime: "image/gif",
      ext: "gif",
      width,
      height,
      previewUrl,
    };
  }

  // 4. BMP conversion mode (Windows Bitmap 24/32-bit)
  if (settings.format === "bmp") {
    const canvas = renderHighQualityImage(imgElement, width, height, settings);
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, width, height);
    const withAlpha = settings.transparencyMode === "preserve";
    const bmpBlob = encodeBmp(imageData, withAlpha);
    const previewUrl = canvas.toDataURL("image/png");
    return {
      blob: bmpBlob,
      mime: "image/bmp",
      ext: "bmp",
      width,
      height,
      previewUrl,
    };
  }

  // 5. TIFF conversion mode (Baseline uncompressed TIFF 6.0)
  if (settings.format === "tiff") {
    const canvas = renderHighQualityImage(imgElement, width, height, settings);
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, width, height);
    const withAlpha = settings.transparencyMode === "preserve";
    const tiffBlob = encodeTiff(imageData, withAlpha);
    const previewUrl = canvas.toDataURL("image/png");
    return {
      blob: tiffBlob,
      mime: "image/tiff",
      ext: "tiff",
      width,
      height,
      previewUrl,
    };
  }

  // 6. Raster formats: PNG, JPG, JPEG, WEBP
  const canvas = renderHighQualityImage(imgElement, width, height, settings);
  const qualityDecimal = Math.max(0.01, Math.min(1.0, (settings.quality || 92) / 100));

  let mime = "image/png";
  let ext = "png";

  if (settings.format === "jpg" || settings.format === "jpeg") {
    mime = "image/jpeg";
    ext = settings.format;
  } else if (settings.format === "webp") {
    mime = "image/webp";
    ext = "webp";
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error(`Failed to encode image to ${settings.format.toUpperCase()}`));
      },
      mime,
      qualityDecimal,
    );
  });

  const previewUrl = canvas.toDataURL("image/png");

  return { blob, mime, ext, width, height, previewUrl };
}
