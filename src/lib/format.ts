const EXT_MIME: Record<string, string> = {
  // Audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aac: "audio/aac",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  m4a: "audio/mp4",
  flac: "audio/flac",
  opus: "audio/opus",
  weba: "audio/webm",
  // Images
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jpe: "image/jpeg",
  webp: "image/webp",
  ico: "image/x-icon",
  gif: "image/gif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  tiff: "image/tiff",
  tif: "image/tiff",
  avif: "image/avif",
};

export const AUDIO_EXTS = new Set([
  "mp3",
  "wav",
  "aac",
  "ogg",
  "oga",
  "m4a",
  "flac",
  "opus",
  "weba",
]);

export const IMAGE_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "jpe",
  "webp",
  "ico",
  "gif",
  "bmp",
  "svg",
  "tiff",
  "tif",
  "avif",
]);

export function extOf(name: string): string {
  return (name.split(".").pop() ?? "").toLowerCase();
}

export function guessMime(ext: string): string {
  return EXT_MIME[ext] ?? "application/octet-stream";
}

export function isAudioExt(ext: string): boolean {
  return AUDIO_EXTS.has(ext);
}

export function isImageExt(ext: string): boolean {
  return IMAGE_EXTS.has(ext);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  const decimals = i === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[i]}`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "—";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function stemOf(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}
