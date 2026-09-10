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

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageConvertSettings {
  format: ImageOutputFormat;
  quality: number; // 1 - 100
  resizeMode: "original" | "pixels" | "percentage";
  targetWidth: number;
  targetHeight: number;
  percentage: number; // e.g. 50 = 50%
  maintainAspectRatio: boolean;
  fitMode: "contain" | "cover" | "stretch"; // how the image fills the target box (pixels mode)
  transparencyMode: "preserve" | "fill";
  backgroundColor: string; // Hex color e.g. "#ffffff"
  icoSizes: number[]; // e.g. [16, 32, 48, 64, 128, 256]
  // Transforms (applied before resize, in order: rotate → flip → crop)
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  crop: CropRect | null; // in transformed-source pixels
  // Auto-optimize lossy output under this size (KB). null = off
  targetSizeKb: number | null;
}

export const DEFAULT_IMAGE_SETTINGS: ImageConvertSettings = {
  format: "png",
  quality: 92,
  resizeMode: "original",
  targetWidth: 1920,
  targetHeight: 1080,
  percentage: 100,
  maintainAspectRatio: true,
  fitMode: "contain",
  transparencyMode: "preserve",
  backgroundColor: "#ffffff",
  icoSizes: [16, 32, 48, 64, 128, 256],
  rotate: 0,
  flipH: false,
  flipV: false,
  crop: null,
  targetSizeKb: null,
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

type ImageSource = HTMLImageElement | HTMLCanvasElement;

/** Natural pixel size of an image or canvas source. */
export function getSourceSize(source: ImageSource): { width: number; height: number } {
  return {
    width:
      source instanceof HTMLImageElement
        ? source.naturalWidth || source.width
        : source.width,
    height:
      source instanceof HTMLImageElement
        ? source.naturalHeight || source.height
        : source.height,
  };
}

/**
 * Applies rotation (90° steps) and mirroring. Returns the original element
 * untouched when no transform is needed.
 */
export function applyTransforms(
  source: ImageSource,
  settings: Pick<ImageConvertSettings, "rotate" | "flipH" | "flipV">,
): ImageSource {
  const rotation = ((Number(settings.rotate) % 360) + 360) % 360;
  const needsRotate = rotation !== 0;
  const needsFlip = Boolean(settings.flipH || settings.flipV);
  if (!needsRotate && !needsFlip) return source;

  const { width, height } = getSourceSize(source);
  const swap = rotation === 90 || rotation === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? height : width;
  canvas.height = swap ? width : height;
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, -width / 2, -height / 2, width, height);
  ctx.restore();
  return canvas;
}

/** Extracts a crop region (clamped to the source bounds). */
export function applyCrop(source: ImageSource, crop: CropRect): ImageSource {
  const { width: srcW, height: srcH } = getSourceSize(source);
  const x = Math.max(0, Math.min(Math.round(crop.x), srcW - 1));
  const y = Math.max(0, Math.min(Math.round(crop.y), srcH - 1));
  const w = Math.max(1, Math.min(Math.round(crop.width), srcW - x));
  const h = Math.max(1, Math.min(Math.round(crop.height), srcH - y));
  if (w >= srcW && h >= srcH) return source;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
  return canvas;
}

/** Generic canvas → Blob encoder with quality control. */
function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error(`Failed to encode image as ${mime}`))),
      mime,
      Math.max(0.01, Math.min(1, quality)),
    );
  });
}

/**
 * Renders an image with high-quality cubic resampling, background color fills, and alpha preservation.
 * Supports three fit modes in Exact Pixels mode:
 *  - contain: fit inside the target box (letterbox, aspect preserved)
 *  - cover:   fill the target box completely and center-crop the overflow
 *  - stretch: squash to the exact target box (aspect ignored)
 */
function renderHighQualityImage(
  img: HTMLImageElement | HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  settings: ImageConvertSettings,
): HTMLCanvasElement {
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

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const isCover =
    settings.fitMode === "cover" &&
    settings.resizeMode === "pixels" &&
    targetWidth > 0 &&
    targetHeight > 0;

  if (isCover) {
    // Fill the box: scale so both dimensions cover the target, center-crop the rest
    const { width: srcW, height: srcH } = getSourceSize(img);
    const scale = Math.max(targetWidth / srcW, targetHeight / srcH);
    const drawW = Math.max(targetWidth, Math.round(srcW * scale));
    const drawH = Math.max(targetHeight, Math.round(srcH * scale));
    const resampled = progressiveResample(img, drawW, drawH);
    const sx = Math.max(0, Math.floor((drawW - targetWidth) / 2));
    const sy = Math.max(0, Math.floor((drawH - targetHeight) / 2));
    ctx.drawImage(resampled, sx, sy, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
    return canvas;
  }

  const resampled = progressiveResample(img, targetWidth, targetHeight);
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
  const { imgElement } = await loadAndDecodeImage(imageSource, sourceExt);

  // Transform pipeline: rotate/flip first, then crop. Crop coordinates are
  // expressed in the rotated/flipped space — matching the crop editor UI.
  const transformed = applyTransforms(imgElement, settings);
  const workingSource = settings.crop ? applyCrop(transformed, settings.crop) : transformed;
  const { width: srcWidth, height: srcHeight } = getSourceSize(workingSource);

  const { width, height } = calculateDimensions(srcWidth, srcHeight, settings);

  // 1. ICO conversion mode (Multi-resolution Windows Icon container with razor-sharp progressive resampling)
  if (settings.format === "ico") {
    const requestedSizes =
      settings.icoSizes && settings.icoSizes.length > 0
        ? settings.icoSizes
        : [16, 32, 48, 64, 128, 256];

    const padWithBackground =
      settings.transparencyMode === "fill" && Boolean(settings.backgroundColor);
    const safeSrcW = Math.max(1, srcWidth);
    const safeSrcH = Math.max(1, srcHeight);

    const frames: IcoFrame[] = [];
    let largestPreviewDataUrl = "";
    const largestSize = Math.max(...requestedSizes);

    for (const size of requestedSizes) {
      const iconCanvas = document.createElement("canvas");
      iconCanvas.width = size;
      iconCanvas.height = size;
      const ctx = iconCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, size, size);

      // Aspect-preserving contain fit: scale the image to fit inside the
      // square frame and center it, instead of squashing it into a square.
      // Padding is transparent by default, or the chosen background fill.
      const scale = Math.min(size / safeSrcW, size / safeSrcH);
      const fitW = Math.max(1, Math.round(safeSrcW * scale));
      const fitH = Math.max(1, Math.round(safeSrcH * scale));

      if (padWithBackground) {
        ctx.fillStyle = settings.backgroundColor || "#ffffff";
        ctx.fillRect(0, 0, size, size);
      }

      const resampled = progressiveResample(workingSource, fitW, fitH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        resampled,
        Math.floor((size - fitW) / 2),
        Math.floor((size - fitH) / 2),
      );

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
    const canvas = renderHighQualityImage(workingSource, width, height, settings);
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
    const canvas = renderHighQualityImage(workingSource, width, height, settings);
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
    const canvas = renderHighQualityImage(workingSource, width, height, settings);
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
    const canvas = renderHighQualityImage(workingSource, width, height, settings);
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
  const canvas = renderHighQualityImage(workingSource, width, height, settings);
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

  let finalCanvas = canvas;
  let blob = await canvasToBlob(canvas, mime, qualityDecimal);

  // ---- Target file size optimizer (lossy formats only) ----
  const targetBytes =
    settings.targetSizeKb != null &&
    settings.targetSizeKb > 0 &&
    (settings.format === "jpg" || settings.format === "jpeg" || settings.format === "webp")
      ? settings.targetSizeKb * 1024
      : null;

  if (targetBytes != null && blob.size > targetBytes) {
    // 1) Binary-search the highest quality (≤ the user's chosen quality) that fits
    let lo = 4;
    let hi = Math.max(5, Math.min(100, settings.quality || 100));
    let best: Blob | null = null;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const candidate = await canvasToBlob(canvas, mime, mid / 100);
      if (candidate.size <= targetBytes) {
        best = candidate;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    // 2) Still too big at minimum quality → progressively downscale (85% steps)
    if (!best) {
      let work: HTMLCanvasElement = canvas;
      for (let attempt = 0; attempt < 8; attempt++) {
        const { width: cw, height: ch } = getSourceSize(work);
        const nw = Math.max(16, Math.round(cw * 0.85));
        const nh = Math.max(16, Math.round(ch * 0.85));
        work = progressiveResample(work, nw, nh);
        const candidate = await canvasToBlob(work, mime, 0.82);
        best = candidate; // keep the smallest attempt so far
        finalCanvas = work;
        if (candidate.size <= targetBytes) break;
      }
    }

    if (best) blob = best;
  }

  const previewUrl = finalCanvas.toDataURL("image/png");
  const { width: outW, height: outH } = getSourceSize(finalCanvas);

  return { blob, mime, ext, width: outW, height: outH, previewUrl };
}
