/**
 * High-Quality GIF89a Encoder with Balanced Gradient Dithering
 * and Perceptual Color Quantization.
 * Prevents over-dithering, noise speckles, and color banding.
 */

interface PaletteResult {
  palette: number[];
  indices: Uint8Array;
  transparentIndex: number;
}

/**
 * Builds a clean, representative 256-color palette and applies balanced
 * error-damped dithering so gradients remain silky smooth without grain.
 */
function quantizeWithBalancedDither(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): PaletteResult {
  const numPixels = width * height;
  const palette: number[] = [];
  const colorMap = new Map<number, number>();
  let transparentIndex = -1;

  // Step 1: Collect dominant colors with 5-bit color quantization
  for (let i = 0; i < numPixels; i++) {
    const a = data[i * 4 + 3];
    if (a < 64) {
      if (transparentIndex === -1) {
        transparentIndex = palette.length / 3;
        palette.push(0, 0, 0); // Transparent placeholder
      }
      continue;
    }

    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    const qr = (r >> 3) << 3;
    const qg = (g >> 3) << 3;
    const qb = (b >> 3) << 3;
    const key = (qr << 16) | (qg << 8) | qb;

    if (!colorMap.has(key)) {
      if (palette.length / 3 < 256) {
        colorMap.set(key, palette.length / 3);
        palette.push(r, g, b);
      }
    }
  }

  // Ensure minimum palette entries
  if (palette.length === 0) {
    palette.push(0, 0, 0, 255, 255, 255);
  }

  // Pad palette to exactly 256 colors (768 bytes)
  while (palette.length < 256 * 3) {
    palette.push(0, 0, 0);
  }

  const numPaletteColors = 256;
  const indices = new Uint8Array(numPixels);

  // Perceptual nearest color matching
  const findNearestColor = (r: number, g: number, b: number): { index: number; dist: number } => {
    let minDist = Infinity;
    let bestIndex = 0;
    const start = transparentIndex === 0 ? 1 : 0;

    for (let p = start; p < numPaletteColors; p++) {
      if (p === transparentIndex) continue;
      const pr = palette[p * 3];
      const pg = palette[p * 3 + 1];
      const pb = palette[p * 3 + 2];

      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      // Perceptual weighting: Human eye is most sensitive to green, then red, then blue
      const dist = dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;
      if (dist < minDist) {
        minDist = dist;
        bestIndex = p;
        if (dist === 0) break;
      }
    }
    return { index: bestIndex, dist: minDist };
  };

  // Step 2: Damped Error Diffusion (Damping factor 0.65 to prevent over-dithering/noise)
  const rErr = new Float32Array(width * height);
  const gErr = new Float32Array(width * height);
  const bErr = new Float32Array(width * height);

  for (let i = 0; i < numPixels; i++) {
    rErr[i] = data[i * 4];
    gErr[i] = data[i * 4 + 1];
    bErr[i] = data[i * 4 + 2];
  }

  const DAMPING = 0.65; // Prevents speckling in flat/gradient areas
  const ERROR_CLAMP = 32; // Limit max error carry to avoid noise streaks

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const origAlpha = data[idx * 4 + 3];

      if (origAlpha < 64 && transparentIndex !== -1) {
        indices[idx] = transparentIndex;
        continue;
      }

      const r = Math.max(0, Math.min(255, Math.round(rErr[idx])));
      const g = Math.max(0, Math.min(255, Math.round(gErr[idx])));
      const b = Math.max(0, Math.min(255, Math.round(bErr[idx])));

      const match = findNearestColor(r, g, b);
      indices[idx] = match.index;

      const palR = palette[match.index * 3];
      const palG = palette[match.index * 3 + 1];
      const palB = palette[match.index * 3 + 2];

      let errR = (r - palR) * DAMPING;
      let errG = (g - palG) * DAMPING;
      let errB = (b - palB) * DAMPING;

      // Clamp error diffusion to prevent speckled artifacts
      errR = Math.max(-ERROR_CLAMP, Math.min(ERROR_CLAMP, errR));
      errG = Math.max(-ERROR_CLAMP, Math.min(ERROR_CLAMP, errG));
      errB = Math.max(-ERROR_CLAMP, Math.min(ERROR_CLAMP, errB));

      // Floyd-Steinberg error distribution:
      // (x+1, y): 7/16, (x-1, y+1): 3/16, (x, y+1): 5/16, (x+1, y+1): 1/16
      if (x + 1 < width) {
        const right = idx + 1;
        rErr[right] += (errR * 7) / 16;
        gErr[right] += (errG * 7) / 16;
        bErr[right] += (errB * 7) / 16;
      }
      if (y + 1 < height) {
        if (x > 0) {
          const downLeft = (y + 1) * width + (x - 1);
          rErr[downLeft] += (errR * 3) / 16;
          gErr[downLeft] += (errG * 3) / 16;
          bErr[downLeft] += (errB * 3) / 16;
        }
        const down = (y + 1) * width + x;
        rErr[down] += (errR * 5) / 16;
        gErr[down] += (errG * 5) / 16;
        bErr[down] += (errB * 5) / 16;

        if (x + 1 < width) {
          const downRight = (y + 1) * width + (x + 1);
          rErr[downRight] += (errR * 1) / 16;
          gErr[downRight] += (errG * 1) / 16;
          bErr[downRight] += (errB * 1) / 16;
        }
      }
    }
  }

  return { palette, indices, transparentIndex };
}

// LZW Compression for GIF Data
function lzwEncode(minCodeSize: number, pixelIndices: Uint8Array): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const maxCode = 4096;

  const output: number[] = [];
  let curBit = 0;
  let curVal = 0;

  const emit = (code: number) => {
    curVal |= code << curBit;
    curBit += codeSize;
    while (curBit >= 8) {
      output.push(curVal & 0xff);
      curVal >>= 8;
      curBit -= 8;
    }
  };

  const flush = () => {
    if (curBit > 0) {
      output.push(curVal & 0xff);
    }
  };

  const dictionary = new Map<string, number>();

  const resetDict = () => {
    dictionary.clear();
    for (let i = 0; i < clearCode; i++) {
      dictionary.set(String(i), i);
    }
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
  };

  emit(clearCode);
  resetDict();

  let curPrefix = "";

  for (let i = 0; i < pixelIndices.length; i++) {
    const val = pixelIndices[i];
    const newPrefix = curPrefix === "" ? String(val) : curPrefix + "," + val;

    if (dictionary.has(newPrefix)) {
      curPrefix = newPrefix;
    } else {
      emit(dictionary.get(curPrefix)!);
      if (nextCode < maxCode) {
        dictionary.set(newPrefix, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        emit(clearCode);
        resetDict();
      }
      curPrefix = String(val);
    }
  }

  if (curPrefix !== "") {
    emit(dictionary.get(curPrefix)!);
  }
  emit(eoiCode);
  flush();

  // Package into GIF sub-blocks (max 255 bytes each)
  const blocks: number[] = [];
  let idx = 0;
  while (idx < output.length) {
    const chunkSize = Math.min(255, output.length - idx);
    blocks.push(chunkSize);
    for (let i = 0; i < chunkSize; i++) {
      blocks.push(output[idx + i]);
    }
    idx += chunkSize;
  }
  blocks.push(0); // Block terminator

  return new Uint8Array(blocks);
}

export function encodeGif(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const { palette, indices, transparentIndex } = quantizeWithBalancedDither(
    imageData.data,
    width,
    height,
  );

  const bytes: number[] = [];

  // 1. Header & Logical Screen Descriptor
  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61); // "GIF89a"
  bytes.push(width & 0xff, (width >> 8) & 0xff); // Width
  bytes.push(height & 0xff, (height >> 8) & 0xff); // Height
  bytes.push(0xf7); // Global color table flag (256 colors, 8 bits/pixel)
  bytes.push(0x00); // Background color index
  bytes.push(0x00); // Pixel aspect ratio

  // 2. Global Color Table (768 bytes)
  for (let i = 0; i < 256 * 3; i++) {
    bytes.push(palette[i] || 0);
  }

  // 3. Graphic Control Extension (for transparency)
  if (transparentIndex !== -1) {
    bytes.push(0x21, 0xf9, 0x04); // Extension introducer & label
    bytes.push(0x01); // Transparency flag set
    bytes.push(0x00, 0x00); // Delay time
    bytes.push(transparentIndex); // Transparent color index
    bytes.push(0x00); // Block terminator
  }

  // 4. Image Descriptor
  bytes.push(0x2c); // Image separator
  bytes.push(0x00, 0x00, 0x00, 0x00); // Left, Top
  bytes.push(width & 0xff, (width >> 8) & 0xff); // Width
  bytes.push(height & 0xff, (height >> 8) & 0xff); // Height
  bytes.push(0x00); // No local color table

  // 5. Image Data (LZW compressed)
  const lzwMinCodeSize = 8;
  bytes.push(lzwMinCodeSize);
  const compressed = lzwEncode(lzwMinCodeSize, indices);
  for (let i = 0; i < compressed.length; i++) {
    bytes.push(compressed[i]);
  }

  // 6. GIF Trailer
  bytes.push(0x3b);

  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}
