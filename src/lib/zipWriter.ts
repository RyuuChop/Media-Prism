/**
 * Minimal ZIP archive writer (STORE method — no compression).
 *
 * Media files (PNG / JPG / MP3 / …) are already compressed, so storing them
 * without deflate is both fast and produces archives the same size as the
 * sum of their files. This keeps "Download All" dependency-free and 100%
 * client-side, in the spirit of the custom binary encoders in this project.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  name: string;
  blob: Blob;
}

/** DOS date/time pair for 2024-01-01 00:00 (fixed — ordering info only). */
const DOS_TIME = 0;
const DOS_DATE = ((2024 - 1980) << 9) | (1 << 5) | 1;

export async function createZipBlob(entries: ZipEntry[]): Promise<Blob> {
  if (entries.length === 0) {
    throw new Error("Nothing to archive — the batch is empty.");
  }

  const encoder = new TextEncoder();
  const files = await Promise.all(
    entries.map(async (e) => ({
      name: encoder.encode(e.name),
      data: new Uint8Array(await e.blob.arrayBuffer()),
    })),
  );

  // 30-byte local header + name + data per file, 46-byte central record +
  // name per file, 22-byte end-of-central-directory record.
  const totalSize = files.reduce(
    (sum, f) => sum + 30 + f.name.length + f.data.length + 46 + f.name.length,
    22,
  );

  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);
  const central: { name: Uint8Array; crc: number; size: number; headerOffset: number }[] = [];

  let offset = 0;
  for (const f of files) {
    const crc = crc32(f.data);
    const headerOffset = offset;

    // ---- Local file header ----
    view.setUint32(offset, 0x04034b50, true); // signature
    view.setUint16(offset + 4, 20, true); // version needed to extract
    view.setUint16(offset + 6, 0, true); // general purpose flags
    view.setUint16(offset + 8, 0, true); // compression method: 0 = store
    view.setUint16(offset + 10, DOS_TIME, true); // mod time
    view.setUint16(offset + 12, DOS_DATE, true); // mod date
    view.setUint32(offset + 14, crc, true); // crc-32
    view.setUint32(offset + 18, f.data.length, true); // compressed size
    view.setUint32(offset + 22, f.data.length, true); // uncompressed size
    view.setUint16(offset + 26, f.name.length, true); // file name length
    view.setUint16(offset + 28, 0, true); // extra field length
    offset += 30;

    out.set(f.name, offset);
    offset += f.name.length;
    out.set(f.data, offset);
    offset += f.data.length;

    central.push({ name: f.name, crc, size: f.data.length, headerOffset });
  }

  const centralStart = offset;
  for (const c of central) {
    // ---- Central directory file header ----
    view.setUint32(offset, 0x02014b50, true); // signature
    view.setUint16(offset + 4, 20, true); // version made by
    view.setUint16(offset + 6, 20, true); // version needed to extract
    view.setUint16(offset + 8, 0, true); // flags
    view.setUint16(offset + 10, 0, true); // method: store
    view.setUint16(offset + 12, DOS_TIME, true);
    view.setUint16(offset + 14, DOS_DATE, true);
    view.setUint32(offset + 16, c.crc, true);
    view.setUint32(offset + 20, c.size, true); // compressed
    view.setUint32(offset + 24, c.size, true); // uncompressed
    view.setUint16(offset + 28, c.name.length, true);
    view.setUint16(offset + 30, 0, true); // extra length
    view.setUint16(offset + 32, 0, true); // comment length
    view.setUint16(offset + 34, 0, true); // disk number start
    view.setUint16(offset + 36, 0, true); // internal attrs
    view.setUint32(offset + 38, 0, true); // external attrs
    view.setUint32(offset + 42, c.headerOffset, true); // local header offset
    offset += 46;

    out.set(c.name, offset);
    offset += c.name.length;
  }

  // ---- End of central directory record ----
  view.setUint32(offset, 0x06054b50, true); // signature
  view.setUint16(offset + 4, 0, true); // disk number
  view.setUint16(offset + 6, 0, true); // disk with central dir
  view.setUint16(offset + 8, central.length, true); // entries on this disk
  view.setUint16(offset + 10, central.length, true); // total entries
  view.setUint32(offset + 12, offset - centralStart, true); // central dir size
  view.setUint32(offset + 16, centralStart, true); // central dir offset
  view.setUint16(offset + 20, 0, true); // comment length

  return new Blob([out], { type: "application/zip" });
}
