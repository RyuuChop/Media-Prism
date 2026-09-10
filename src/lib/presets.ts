import type { Asset, AudioConvertSettings } from "../types";
import { stemOf } from "./format";

export interface FormatDef {
  id: string;
  label: string;
  hint: string;
  ext: string;
  mime: string;
}

export const AUDIO_FORMATS: FormatDef[] = [
  { id: "mp3", label: "MP3", hint: "Universal audio · Compact", ext: "mp3", mime: "audio/mpeg" },
  { id: "wav", label: "WAV", hint: "Lossless 16-bit PCM", ext: "wav", mime: "audio/wav" },
  { id: "aac", label: "AAC", hint: "Advanced Audio Coding", ext: "aac", mime: "audio/aac" },
  { id: "ogg", label: "OGG", hint: "Vorbis open audio", ext: "ogg", mime: "audio/ogg" },
  { id: "m4a", label: "M4A", hint: "AAC in MP4 audio container", ext: "m4a", mime: "audio/mp4" },
  { id: "flac", label: "FLAC", hint: "Free Lossless Audio Codec", ext: "flac", mime: "audio/flac" },
];

export const IMAGE_FORMATS: FormatDef[] = [
  { id: "png", label: "PNG", hint: "Lossless · Alpha channel", ext: "png", mime: "image/png" },
  { id: "jpg", label: "JPG", hint: "Standard photo compression", ext: "jpg", mime: "image/jpeg" },
  { id: "jpeg", label: "JPEG", hint: "Standard JPEG photo format", ext: "jpeg", mime: "image/jpeg" },
  { id: "webp", label: "WEBP", hint: "Modern web · High compression", ext: "webp", mime: "image/webp" },
  { id: "ico", label: "ICO", hint: "Windows icon & Favicon bundle", ext: "ico", mime: "image/x-icon" },
  { id: "gif", label: "GIF", hint: "Smooth 256-color image", ext: "gif", mime: "image/gif" },
  { id: "bmp", label: "BMP", hint: "Uncompressed Windows Bitmap", ext: "bmp", mime: "image/bmp" },
  { id: "svg", label: "SVG", hint: "Scalable Vector Graphic", ext: "svg", mime: "image/svg+xml" },
  { id: "tiff", label: "TIFF", hint: "Tagged Image File Format (Print)", ext: "tiff", mime: "image/tiff" },
];

export const AUDIO_BITRATES: { id: string; label: string }[] = [
  { id: "128", label: "128 kbps (Standard)" },
  { id: "192", label: "192 kbps (High Quality)" },
  { id: "256", label: "256 kbps (Studio)" },
  { id: "320", label: "320 kbps (Maximum)" },
];

export const SAMPLE_RATES: { id: "44100" | "48000"; label: string }[] = [
  { id: "44100", label: "44.1 kHz (CD Quality)" },
  { id: "48000", label: "48.0 kHz (Studio Quality)" },
];

export const DEFAULT_AUDIO_SETTINGS: AudioConvertSettings = {
  format: "mp3",
  bitrate: "192",
  sampleRate: "44100",
  channels: "2",
};

export const ALLOWED_EXTS = new Set([
  // Audio
  "mp3", "wav", "aac", "ogg", "oga", "m4a", "flac", "opus", "weba",
  // Image
  "png", "jpg", "jpeg", "jpe", "webp", "ico", "gif", "bmp", "svg", "tiff", "tif", "avif",
]);

export function getFormatDef(id: string): FormatDef {
  return (
    [...AUDIO_FORMATS, ...IMAGE_FORMATS].find((f) => f.id === id) ??
    AUDIO_FORMATS[0]
  );
}

export function formatsFor(kind: "audio" | "image"): FormatDef[] {
  if (kind === "audio") return AUDIO_FORMATS;
  return IMAGE_FORMATS;
}

export function getOutputName(assetName: string, ext: string): string {
  return `${stemOf(assetName)}.${ext}`;
}

export function estimateAudioBytes(asset: Asset, settings: AudioConvertSettings): number | null {
  if (!asset.duration) return null;
  const dur = asset.duration;
  if (settings.format === "wav" || settings.format === "flac") {
    // 16-bit stereo 44.1kHz = 176.4 KB/s
    const rate = Number(settings.sampleRate) || 44100;
    const ch = Number(settings.channels) || 2;
    return Math.round(rate * ch * 2 * dur);
  }
  const abr = Number(settings.bitrate) || 192;
  return Math.round(((abr * 1000) / 8) * dur);
}
