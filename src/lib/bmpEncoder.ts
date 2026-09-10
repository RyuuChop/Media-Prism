/**
 * Pure JavaScript BMP (Bitmap) Encoder supporting 24-bit RGB and 32-bit RGBA.
 * Produces valid Windows Bitmap files compatible with all image viewers and OSes.
 */

export function encodeBmp(imageData: ImageData, withAlpha = true): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const bytesPerPixel = withAlpha ? 4 : 3;
  // Each scanline in BMP must be padded to a multiple of 4 bytes
  const rowSize = Math.floor((width * bytesPerPixel * 8 + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const headerSize = 14; // BITMAPFILEHEADER
  const infoHeaderSize = withAlpha ? 108 : 40; // BITMAPV4HEADER for alpha, BITMAPINFOHEADER for RGB
  const fileHeaderOffset = headerSize + infoHeaderSize;
  const fileSize = fileHeaderOffset + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // 1. BITMAPFILEHEADER (14 bytes)
  view.setUint16(0, 0x4d42, false); // 'BM'
  view.setUint32(2, fileSize, true); // File size
  view.setUint16(6, 0, true); // Reserved
  view.setUint16(8, 0, true); // Reserved
  view.setUint32(10, fileHeaderOffset, true); // Offset to pixel data

  // 2. Info Header
  view.setUint32(14, infoHeaderSize, true); // Header size
  view.setInt32(18, width, true); // Width
  view.setInt32(22, height, true); // Positive height = bottom-up (standard BMP)
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, bytesPerPixel * 8, true); // Bit count (24 or 32)
  view.setUint32(30, withAlpha ? 3 : 0, true); // 3 = BI_BITFIELDS (for 32-bit RGBA), 0 = BI_RGB
  view.setUint32(34, pixelArraySize, true); // Image data size
  view.setInt32(38, 2835, true); // ~72 DPI (Pixels per meter)
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true); // Colors in color table
  view.setUint32(50, 0, true); // Important color count

  if (withAlpha) {
    // Channel masks for BITMAPV4HEADER (RGBA)
    view.setUint32(54, 0x00ff0000, true); // Red mask
    view.setUint32(58, 0x0000ff00, true); // Green mask
    view.setUint32(62, 0x000000ff, true); // Blue mask
    view.setUint32(66, 0xff000000, true); // Alpha mask
    view.setUint32(70, 0x73524742, false); // CSType: 'sRGB'
  }

  // 3. Pixel Data (Bottom-to-Top, BGR / BGRA order)
  let dstOffset = fileHeaderOffset;
  for (let y = height - 1; y >= 0; y--) {
    const rowStart = dstOffset;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      const a = data[srcIdx + 3];

      uint8[dstOffset++] = b;
      uint8[dstOffset++] = g;
      uint8[dstOffset++] = r;
      if (withAlpha) {
        uint8[dstOffset++] = a;
      }
    }
    // Pad row to 4-byte boundary
    while (dstOffset - rowStart < rowSize) {
      uint8[dstOffset++] = 0;
    }
  }

  return new Blob([buffer], { type: "image/bmp" });
}
