import type { Asset, AudioConvertSettings } from "../types";
import type { ImageConvertSettings } from "./imageEngine";
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
  trimStart: 0,
  trimEnd: 0,
  fadeIn: 0,
  fadeOut: 0,
  normalize: false,
  gainDb: 0,
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
  const end = settings.trimEnd > 0 ? Math.min(settings.trimEnd, asset.duration) : asset.duration;
  const start = Math.min(Math.max(0, settings.trimStart), end);
  const dur = Math.max(0.1, end - start);
  if (settings.format === "wav" || settings.format === "flac") {
    // 16-bit sample data: rate × channels × 2 bytes/s
    const rate = Number(settings.sampleRate) || 44100;
    const ch = Number(settings.channels) || 2;
    return Math.round(rate * ch * 2 * dur);
  }
  const abr = Number(settings.bitrate) || 192;
  return Math.round(((abr * 1000) / 8) * dur);
}

/* ---------- One-click preset profiles ---------- */

export interface ImagePresetProfile {
  id: string;
  label: string;
  emoji: string;
  hint: string;
  apply: Partial<ImageConvertSettings>;
}

export interface AudioPresetProfile {
  id: string;
  label: string;
  emoji: string;
  hint: string;
  apply: Partial<AudioConvertSettings>;
}

export const IMAGE_PRESETS: ImagePresetProfile[] = [
  {
    id: "favicon",
    label: "Favicon Pack",
    emoji: "🌐",
    hint: "ICO with 16/32/48 px frames",
    apply: { format: "ico", icoSizes: [16, 32, 48], transparencyMode: "preserve", resizeMode: "original" },
  },
  {
    id: "web-hero",
    label: "Web Hero",
    emoji: "🖥️",
    hint: "WEBP · fits 1920×1080 · 82%",
    apply: {
      format: "webp", quality: 82, resizeMode: "pixels",
      targetWidth: 1920, targetHeight: 1080,
      maintainAspectRatio: true, fitMode: "contain",
    },
  },
  {
    id: "social-square",
    label: "Social Square",
    emoji: "🟪",
    hint: "JPG · 1080×1080 cover-crop",
    apply: {
      format: "jpg", quality: 90, resizeMode: "pixels",
      targetWidth: 1080, targetHeight: 1080,
      maintainAspectRatio: false, fitMode: "cover",
    },
  },
  {
    id: "emoji",
    label: "Discord Emoji",
    emoji: "😀",
    hint: "PNG · 128×128 cover-crop",
    apply: {
      format: "png", resizeMode: "pixels",
      targetWidth: 128, targetHeight: 128,
      maintainAspectRatio: false, fitMode: "cover",
    },
  },
  {
    id: "half",
    label: "Half Size",
    emoji: "✂️",
    hint: "Keep format · 50% scale",
    apply: { resizeMode: "percentage", percentage: 50, maintainAspectRatio: true, fitMode: "contain" },
  },
];

export const AUDIO_PRESETS: AudioPresetProfile[] = [
  {
    id: "ringtone",
    label: "Ringtone",
    emoji: "🔔",
    hint: "MP3 · 192k — set trim below",
    apply: { format: "mp3", bitrate: "192", sampleRate: "44100", channels: "2", fadeIn: 0.5, fadeOut: 1 },
  },
  {
    id: "podcast",
    label: "Podcast",
    emoji: "🎙️",
    hint: "MP3 · 128k mono",
    apply: { format: "mp3", bitrate: "128", sampleRate: "44100", channels: "1" },
  },
  {
    id: "music-max",
    label: "Music Max",
    emoji: "🎧",
    hint: "MP3 · 320k stereo",
    apply: { format: "mp3", bitrate: "320", sampleRate: "44100", channels: "2" },
  },
  {
    id: "studio-wav",
    label: "Studio WAV",
    emoji: "🎚️",
    hint: "WAV · 48 kHz stereo",
    apply: { format: "wav", sampleRate: "48000", channels: "2" },
  },
  {
    id: "archive",
    label: "FLAC Archive",
    emoji: "💾",
    hint: "FLAC · 48 kHz stereo",
    apply: { format: "flac", sampleRate: "48000", channels: "2" },
  },
];
