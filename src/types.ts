export type MediaKind = "image" | "audio";

/** PWA install prompt event (not in the standard TS DOM lib). */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface Asset {
  id: string;
  file: File;
  name: string;
  size: number;
  mime: string;
  ext: string;
  kind: MediaKind;
  url: string;
  previewUrl?: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  thumbnail: string | null;
  status: "ready" | "converting" | "done" | "error";
}

export interface AudioConvertSettings {
  format: "mp3" | "wav" | "aac" | "ogg" | "m4a" | "flac";
  bitrate: string; // "128", "192", "256", "320"
  sampleRate: "44100" | "48000";
  channels: "2" | "1"; // stereo / mono
  // Trim (seconds). trimEnd = 0 means "until the end".
  trimStart: number;
  trimEnd: number;
  // Fade lengths in seconds (0 = disabled)
  fadeIn: number;
  fadeOut: number;
  // Loudness
  normalize: boolean; // peak-normalize to ~98%
  gainDb: number; // -12 .. +12 dB
}

export interface ConvertResult {
  assetId: string;
  url: string;
  previewUrl?: string;
  name: string;
  size: number;
  mime: string;
  width?: number;
  height?: number;
  duration?: number;
}

export type JobPhase = "idle" | "converting" | "done" | "error";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
}
