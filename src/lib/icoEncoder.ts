/**
 * Standard ICO file generator supporting PNG-encoded icon frames.
 * Windows and modern browsers support PNG-encoded icons within .ico containers,
 * preserving full 32-bit RGBA alpha transparency.
 */

export interface IcoFrame {
  width: number;
  height: number;
  pngData: Uint8Array;
}

export function createIcoFile(frames: IcoFrame[]): Blob {
  const headerSize = 6;
  const entrySize = 16;
  const numImages = frames.length;

  let totalSize = headerSize + numImages * entrySize;
  for (const frame of frames) {
    totalSize += frame.pngData.length;
  }

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // 1. ICONDIR Header
  view.setUint16(0, 0, true); // Reserved (must be 0)
  view.setUint16(2, 1, true); // 1 = ICO format
  view.setUint16(4, numImages, true); // Number of images

  // 2. ICONDIRENTRY list and Image Data offset tracking
  let currentOffset = headerSize + numImages * entrySize;

  frames.forEach((frame, i) => {
    const entryOffset = headerSize + i * entrySize;

    // Width & Height (0 means 256px)
    view.setUint8(entryOffset + 0, frame.width >= 256 ? 0 : frame.width);
    view.setUint8(entryOffset + 1, frame.height >= 256 ? 0 : frame.height);
    view.setUint8(entryOffset + 2, 0); // Palette colors (0 = no palette)
    view.setUint8(entryOffset + 3, 0); // Reserved
    view.setUint16(entryOffset + 4, 1, true); // Color planes
    view.setUint16(entryOffset + 6, 32, true); // Bits per pixel (32-bit RGBA)
    view.setUint32(entryOffset + 8, frame.pngData.length, true); // Size of PNG data
    view.setUint32(entryOffset + 12, currentOffset, true); // Offset of PNG data

    // Copy PNG data into buffer
    uint8.set(frame.pngData, currentOffset);
    currentOffset += frame.pngData.length;
  });

  return new Blob([buffer], { type: "image/x-icon" });
}
