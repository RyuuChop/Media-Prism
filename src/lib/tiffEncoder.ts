/**
 * Pure JavaScript TIFF 6.0 Encoder.
 * Generates standard baseline uncompressed Little-Endian TIFF files (RGB or RGBA).
 */

export function encodeTiff(imageData: ImageData, withAlpha = true): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const samplesPerPixel = withAlpha ? 4 : 3;
  const bytesPerPixel = samplesPerPixel;
  const imageBytes = width * height * bytesPerPixel;

  const numEntries = 12; // Number of IFD directory tags
  const headerSize = 8;
  const ifdOffset = headerSize;
  const ifdSize = 2 + numEntries * 12 + 4; // count + entries + next_ifd_offset

  // Extra data offset (for arrays like BitsPerSample, XResolution, YResolution)
  const extraOffset = ifdOffset + ifdSize;
  // BitsPerSample takes 4 * 2 = 8 bytes (or 3 * 2 = 6 bytes)
  // XResolution takes 8 bytes (rational)
  // YResolution takes 8 bytes (rational)
  const bitsPerSampleOffset = extraOffset;
  const xResOffset = bitsPerSampleOffset + samplesPerPixel * 2;
  const yResOffset = xResOffset + 8;
  const dataOffset = yResOffset + 8;

  const totalSize = dataOffset + imageBytes;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // 1. TIFF Header (8 bytes)
  view.setUint16(0, 0x4949, false); // 'II' (Little Endian)
  view.setUint16(2, 42, true); // TIFF magic number
  view.setUint32(4, ifdOffset, true); // Offset to 1st IFD

  // 2. IFD Entry Writer Helper
  let entryIndex = 0;
  const writeEntry = (tag: number, type: number, count: number, valueOrOffset: number) => {
    const pos = ifdOffset + 2 + entryIndex * 12;
    view.setUint16(pos, tag, true);
    view.setUint16(pos + 2, type, true); // 3 = SHORT, 4 = LONG, 5 = RATIONAL
    view.setUint32(pos + 4, count, true);
    view.setUint32(pos + 8, valueOrOffset, true);
    entryIndex++;
  };

  view.setUint16(ifdOffset, numEntries, true);

  writeEntry(256, 4, 1, width); // ImageWidth
  writeEntry(257, 4, 1, height); // ImageLength / Height
  writeEntry(258, 3, samplesPerPixel, bitsPerSampleOffset); // BitsPerSample
  writeEntry(259, 3, 1, 1); // Compression (1 = uncompressed)
  writeEntry(262, 3, 1, 2); // PhotometricInterpretation (2 = RGB)
  writeEntry(273, 4, 1, dataOffset); // StripOffsets
  writeEntry(277, 3, 1, samplesPerPixel); // SamplesPerPixel
  writeEntry(278, 4, 1, height); // RowsPerStrip
  writeEntry(279, 4, 1, imageBytes); // StripByteCounts
  writeEntry(282, 5, 1, xResOffset); // XResolution (Rational)
  writeEntry(283, 5, 1, yResOffset); // YResolution (Rational)
  writeEntry(296, 3, 1, 2); // ResolutionUnit (2 = inch)

  // Next IFD offset = 0 (no more IFDs)
  view.setUint32(ifdOffset + 2 + numEntries * 12, 0, true);

  // 3. Write Extra Data
  // BitsPerSample values (8, 8, 8, 8)
  for (let i = 0; i < samplesPerPixel; i++) {
    view.setUint16(bitsPerSampleOffset + i * 2, 8, true);
  }

  // XResolution: 72 / 1
  view.setUint32(xResOffset, 72, true);
  view.setUint32(xResOffset + 4, 1, true);

  // YResolution: 72 / 1
  view.setUint32(yResOffset, 72, true);
  view.setUint32(yResOffset + 4, 1, true);

  // 4. Pixel Data (RGB / RGBA)
  let dst = dataOffset;
  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * 4;
    uint8[dst++] = data[srcIdx]; // R
    uint8[dst++] = data[srcIdx + 1]; // G
    uint8[dst++] = data[srcIdx + 2]; // B
    if (withAlpha) {
      uint8[dst++] = data[srcIdx + 3]; // A
    }
  }

  return new Blob([buffer], { type: "image/tiff" });
}
