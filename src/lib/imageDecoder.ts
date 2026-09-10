/**
 * Pure JavaScript Image Decoder for BMP, TIFF, and Standard Image formats.
 * Converts raw BMP/TIFF binary files into standard PNG Data URLs for instant,
 * crystal-clear live previews in browser <img> elements that lack native TIFF/BMP support.
 */

/**
 * Decodes an uncompressed or standard TIFF 6.0 ArrayBuffer into ImageData.
 */
export function decodeTiffToImageData(buffer: ArrayBuffer): ImageData | null {
  try {
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);

    // Byte Order: II (0x4949 = Little Endian) or MM (0x4D4D = Big Endian)
    const endianMark = view.getUint16(0, false);
    const isLittleEndian = endianMark === 0x4949;

    const magic = view.getUint16(2, isLittleEndian);
    if (magic !== 42) return null;

    const firstIfdOffset = view.getUint32(4, isLittleEndian);
    if (firstIfdOffset >= buffer.byteLength) return null;

    const numEntries = view.getUint16(firstIfdOffset, isLittleEndian);

    let width = 0;
    let height = 0;
    let samplesPerPixel = 3;
    let stripOffset = 0;

    for (let i = 0; i < numEntries; i++) {
      const entryPos = firstIfdOffset + 2 + i * 12;
      if (entryPos + 12 > buffer.byteLength) break;

      const tag = view.getUint16(entryPos, isLittleEndian);
      const val = view.getUint32(entryPos + 8, isLittleEndian);

      if (tag === 256) width = val; // ImageWidth
      else if (tag === 257) height = val; // ImageLength
      else if (tag === 273) stripOffset = val; // StripOffsets
      else if (tag === 277) samplesPerPixel = val & 0xffff; // SamplesPerPixel
    }

    if (width <= 0 || height <= 0 || stripOffset <= 0) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(width, height);
    const dst = imageData.data;

    let srcIdx = stripOffset;
    for (let i = 0; i < width * height; i++) {
      const dstIdx = i * 4;
      if (samplesPerPixel >= 3) {
        dst[dstIdx] = uint8[srcIdx] || 0; // R
        dst[dstIdx + 1] = uint8[srcIdx + 1] || 0; // G
        dst[dstIdx + 2] = uint8[srcIdx + 2] || 0; // B
        dst[dstIdx + 3] = samplesPerPixel >= 4 ? (uint8[srcIdx + 3] ?? 255) : 255; // A
        srcIdx += samplesPerPixel;
      } else {
        // Grayscale
        const gray = uint8[srcIdx] || 0;
        dst[dstIdx] = gray;
        dst[dstIdx + 1] = gray;
        dst[dstIdx + 2] = gray;
        dst[dstIdx + 3] = 255;
        srcIdx += 1;
      }
    }

    return imageData;
  } catch (err) {
    console.warn("[MediaForge] TIFF decode error:", err);
    return null;
  }
}

/**
 * Decodes a standard Windows BMP ArrayBuffer into ImageData.
 */
export function decodeBmpToImageData(buffer: ArrayBuffer): ImageData | null {
  try {
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);

    // Magic 'BM'
    if (view.getUint16(0, false) !== 0x424d) return null;

    const dataOffset = view.getUint32(10, true);
    const width = view.getInt32(18, true);
    const rawHeight = view.getInt32(22, true);
    const height = Math.abs(rawHeight);
    const isTopDown = rawHeight < 0;
    const bitCount = view.getUint16(28, true);

    if (width <= 0 || height <= 0 || (bitCount !== 24 && bitCount !== 32)) return null;

    const bytesPerPixel = bitCount / 8;
    const rowSize = Math.floor((width * bytesPerPixel * 8 + 31) / 32) * 4;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(width, height);
    const dst = imageData.data;

    for (let y = 0; y < height; y++) {
      const srcY = isTopDown ? y : height - 1 - y;
      const rowStart = dataOffset + srcY * rowSize;

      for (let x = 0; x < width; x++) {
        const srcPos = rowStart + x * bytesPerPixel;
        const dstPos = (y * width + x) * 4;

        const b = uint8[srcPos];
        const g = uint8[srcPos + 1];
        const r = uint8[srcPos + 2];
        const a = bitCount === 32 ? uint8[srcPos + 3] : 255;

        dst[dstPos] = r;
        dst[dstPos + 1] = g;
        dst[dstPos + 2] = b;
        dst[dstPos + 3] = a;
      }
    }

    return imageData;
  } catch (err) {
    console.warn("[MediaForge] BMP decode error:", err);
    return null;
  }
}

/**
 * Loads any image source (file, blob, or url) into an HTMLImageElement or Canvas.
 * Automatically creates PNG preview data URLs for TIFF and BMP formats that browsers
 * cannot render natively in standard <img> tags.
 */
export async function loadAndDecodeImage(
  urlOrFile: string | File | Blob,
  ext?: string,
): Promise<{
  imgElement: HTMLImageElement;
  width: number;
  height: number;
  previewUrl: string;
}> {
  const isTiff = ext === "tiff" || ext === "tif";
  const isBmp = ext === "bmp";

  // CASE 1: Explicit TIFF file
  if (isTiff && (urlOrFile instanceof File || urlOrFile instanceof Blob)) {
    const arrayBuf = await urlOrFile.arrayBuffer();
    const imageData = decodeTiffToImageData(arrayBuf);
    if (imageData) {
      const canvas = document.createElement("canvas");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(imageData, 0, 0);

      const previewPngUrl = canvas.toDataURL("image/png");
      const img = new Image();
      img.src = previewPngUrl;
      await new Promise((resolve) => (img.onload = resolve));

      return {
        imgElement: img,
        width: imageData.width,
        height: imageData.height,
        previewUrl: previewPngUrl,
      };
    }
  }

  // CASE 2: Standard Browser Image Loading with Fallback
  const srcUrl = typeof urlOrFile === "string" ? urlOrFile : URL.createObjectURL(urlOrFile);

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Browser <img> element failed to render format natively"));
      img.src = srcUrl;
    });

    const w = img.naturalWidth || img.width || 800;
    const h = img.naturalHeight || img.height || 600;

    // For BMP, convert to a guaranteed PNG preview URL so all browsers display it
    let preview = srcUrl;
    if (isBmp || isTiff) {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      preview = canvas.toDataURL("image/png");
    }

    return {
      imgElement: img,
      width: w,
      height: h,
      previewUrl: preview,
    };
  } catch (nativeErr) {
    // If native load failed and we have a File/Blob, try manual binary decoders
    if (urlOrFile instanceof File || urlOrFile instanceof Blob) {
      const arrayBuf = await urlOrFile.arrayBuffer();

      const tiffData = decodeTiffToImageData(arrayBuf);
      if (tiffData) {
        const canvas = document.createElement("canvas");
        canvas.width = tiffData.width;
        canvas.height = tiffData.height;
        const ctx = canvas.getContext("2d")!;
        ctx.putImageData(tiffData, 0, 0);

        const previewPngUrl = canvas.toDataURL("image/png");
        const img = new Image();
        img.src = previewPngUrl;
        await new Promise((r) => (img.onload = r));

        return {
          imgElement: img,
          width: tiffData.width,
          height: tiffData.height,
          previewUrl: previewPngUrl,
        };
      }

      const bmpData = decodeBmpToImageData(arrayBuf);
      if (bmpData) {
        const canvas = document.createElement("canvas");
        canvas.width = bmpData.width;
        canvas.height = bmpData.height;
        const ctx = canvas.getContext("2d")!;
        ctx.putImageData(bmpData, 0, 0);

        const previewPngUrl = canvas.toDataURL("image/png");
        const img = new Image();
        img.src = previewPngUrl;
        await new Promise((r) => (img.onload = r));

        return {
          imgElement: img,
          width: bmpData.width,
          height: bmpData.height,
          previewUrl: previewPngUrl,
        };
      }
    }

    throw new Error("Could not decode image: " + String(nativeErr));
  }
}
