import React from "react";
import {
  AudioLines,
  Gauge,
  Music,
  Radio,
  RefreshCw,
  Scissors,
  Sliders,
  Volume2,
  Waves,
  Zap,
} from "lucide-react";
import type { Asset, AudioConvertSettings } from "../types";
import { cn } from "../utils/cn";
import {
  AUDIO_BITRATES,
  AUDIO_FORMATS,
  AUDIO_PRESETS,
  DEFAULT_AUDIO_SETTINGS,
  estimateAudioBytes,
  SAMPLE_RATES,
} from "../lib/presets";
import { formatBytes, formatDuration } from "../lib/format";

function SectionHeader({
  icon: Icon,
  title,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  badge?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Icon className="h-3.5 w-3.5 text-indigo-400" />
        <span>{title}</span>
      </div>
      {badge && (
        <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
          {badge}
        </span>
      )}
    </div>
  );
}

export default function AudioSettingsPanel({
  asset,
  settings,
  onChange,
  disabled,
}: {
  asset: Asset | null;
  settings: AudioConvertSettings;
  onChange: (patch: Partial<AudioConvertSettings>) => void;
  disabled: boolean;
}) {
  const est = asset ? estimateAudioBytes(asset, settings) : null;
  const duration = asset?.duration ?? 0;
  const hasDuration = duration > 0.2;
  const effStart = hasDuration ? Math.min(settings.trimStart, duration) : 0;
  const effEnd = hasDuration
    ? (settings.trimEnd > 0 ? Math.min(settings.trimEnd, duration) : duration)
    : 0;
  const effDuration = Math.max(0, effEnd - effStart);
  const fadeMax = Math.max(0.5, effDuration / 2);

  const setTrimStart = (v: number) => {
    if (!hasDuration) return;
    const maxStart = Math.max(0, (settings.trimEnd > 0 ? settings.trimEnd : duration) - 0.5);
    onChange({ trimStart: Math.max(0, Math.min(v, maxStart)) });
  };

  const setTrimEnd = (v: number) => {
    if (!hasDuration) return;
    // 0 or >= duration means "until the end"
    const end = v >= duration - 0.05 ? 0 : Math.max(settings.trimStart + 0.5, v);
    onChange({ trimEnd: Math.min(end, duration) });
  };

  return (
    <section className="glass p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Audio Studio Settings</h3>
        </div>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_AUDIO_SETTINGS)}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="space-y-6">
        {/* One-Click Preset Profiles */}
        <div>
          <SectionHeader icon={Zap} title="Quick Presets" />
          <div className="flex flex-wrap gap-1.5">
            {AUDIO_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.hint}
                onClick={() => onChange(p.apply)}
                disabled={disabled}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition-all hover:border-indigo-400/50 hover:bg-indigo-500/15 hover:text-white active:scale-95 disabled:opacity-40"
              >
                <span>{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Output Format selection */}
        <div>
          <SectionHeader icon={Music} title="Target Audio Format" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AUDIO_FORMATS.map((f) => {
              const active = settings.format === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChange({ format: f.id as AudioConvertSettings["format"] })}
                  disabled={disabled}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all duration-200 disabled:opacity-40",
                    active
                      ? "border-indigo-400/60 bg-indigo-500/15 shadow-[0_0_24px_-6px_rgba(99,102,241,0.45)]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-mono text-sm font-extrabold",
                        active ? "text-white" : "text-slate-300",
                      )}
                    >
                      {f.label}
                    </span>
                  </div>
                  <span className="mt-1 block text-[10px] leading-tight text-slate-400">
                    {f.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bitrate Selection */}
        <div>
          <SectionHeader
            icon={Gauge}
            title="Audio Bitrate"
            badge={`${settings.bitrate} kbps`}
          />
          <div className="grid grid-cols-2 gap-2">
            {AUDIO_BITRATES.map((b) => {
              const active = settings.bitrate === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onChange({ bitrate: b.id })}
                  disabled={disabled}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left transition-all duration-150 disabled:opacity-40",
                    active
                      ? "border-indigo-400/60 bg-indigo-500/20 text-white shadow-[0_0_16px_-4px_rgba(99,102,241,0.5)]"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white",
                  )}
                >
                  <span className="font-mono text-xs font-bold block">{b.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sample Rate */}
        <div>
          <SectionHeader
            icon={Radio}
            title="Sample Rate"
            badge={`${Number(settings.sampleRate) / 1000} kHz`}
          />
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_RATES.map((sr) => {
              const active = settings.sampleRate === sr.id;
              return (
                <button
                  key={sr.id}
                  type="button"
                  onClick={() => onChange({ sampleRate: sr.id })}
                  disabled={disabled}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left transition-all duration-150 disabled:opacity-40",
                    active
                      ? "border-indigo-400/60 bg-indigo-500/20 text-white shadow-[0_0_16px_-4px_rgba(99,102,241,0.5)]"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white",
                  )}
                >
                  <span className="font-mono text-xs font-bold block">{sr.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Channels (Stereo / Mono) */}
        <div>
          <SectionHeader icon={AudioLines} title="Audio Channels" />
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => onChange({ channels: "2" })}
              disabled={disabled}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors",
                settings.channels === "2"
                  ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow"
                  : "text-slate-400 hover:text-white",
              )}
            >
              Stereo (2 Ch)
            </button>
            <button
              type="button"
              onClick={() => onChange({ channels: "1" })}
              disabled={disabled}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors",
                settings.channels === "1"
                  ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow"
                  : "text-slate-400 hover:text-white",
              )}
            >
              Mono (1 Ch)
            </button>
          </div>
        </div>

        {/* Trim (Start / End) */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Scissors className="h-4 w-4 text-indigo-400" />
              <span>Trim Audio</span>
            </div>
            {(settings.trimStart > 0 || settings.trimEnd > 0) && (
              <button
                type="button"
                onClick={() => onChange({ trimStart: 0, trimEnd: 0 })}
                disabled={disabled}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 transition-colors hover:text-white disabled:opacity-40"
              >
                Reset trim
              </button>
            )}
          </div>

          {hasDuration ? (
            <>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-400">Start</span>
                    <span className="font-mono font-bold text-indigo-300">
                      {formatDuration(effStart)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.floor(duration * 10) / 10}
                    step={0.1}
                    value={effStart}
                    onChange={(e) => setTrimStart(Number(e.target.value))}
                    disabled={disabled}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-400">End</span>
                    <span className="font-mono font-bold text-indigo-300">
                      {settings.trimEnd > 0 ? formatDuration(settings.trimEnd) : "Full"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.floor(duration * 10) / 10}
                    step={0.1}
                    value={settings.trimEnd > 0 ? settings.trimEnd : duration}
                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                    disabled={disabled}
                    className="w-full"
                  />
                </div>
              </div>
              <p className="mt-2.5 text-[10px] text-slate-500">
                Keeps{" "}
                <span className="font-mono font-semibold text-slate-300">
                  {formatDuration(effDuration)}
                </span>{" "}
                of {formatDuration(duration)} — drag End all the way right for "until the end".
              </p>
            </>
          ) : (
            <p className="text-[10px] text-slate-500">
              Duration is still being analyzed — trim unlocks in a moment.
            </p>
          )}
        </div>

        {/* Fades */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Waves className="h-4 w-4 text-indigo-400" />
            <span>Fades</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-400">Fade in</span>
                <span className="font-mono font-bold text-indigo-300">
                  {settings.fadeIn > 0 ? `${settings.fadeIn.toFixed(1)}s` : "Off"}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.min(10, fadeMax)}
                step={0.1}
                value={Math.min(settings.fadeIn, Math.min(10, fadeMax))}
                onChange={(e) => onChange({ fadeIn: Number(e.target.value) })}
                disabled={disabled || !hasDuration}
                className="w-full"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-400">Fade out</span>
                <span className="font-mono font-bold text-indigo-300">
                  {settings.fadeOut > 0 ? `${settings.fadeOut.toFixed(1)}s` : "Off"}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.min(10, fadeMax)}
                step={0.1}
                value={Math.min(settings.fadeOut, Math.min(10, fadeMax))}
                onChange={(e) => onChange({ fadeOut: Number(e.target.value) })}
                disabled={disabled || !hasDuration}
                className="w-full"
              />
            </div>
          </div>
          <p className="mt-2.5 text-[10px] text-slate-500">
            Smooth cosine ramps — click-free ringtone & clip edges.
          </p>
        </div>

        {/* Loudness: Normalize & Gain */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Volume2 className="h-4 w-4 text-indigo-400" />
              <span>Loudness</span>
            </div>
            <button
              type="button"
              onClick={() => onChange({ normalize: !settings.normalize })}
              disabled={disabled}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors disabled:opacity-40",
                settings.normalize
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
              )}
            >
              {settings.normalize ? "NORMALIZE ON" : "NORMALIZE OFF"}
            </button>
          </div>

          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-400">Manual gain</span>
            <span className="font-mono font-bold text-indigo-300">
              {settings.gainDb > 0 ? "+" : ""}
              {settings.gainDb.toFixed(1)} dB
            </span>
          </div>
          <input
            type="range"
            min={-12}
            max={12}
            step={0.5}
            value={settings.gainDb}
            onChange={(e) => onChange({ gainDb: Number(e.target.value) })}
            disabled={disabled}
            className="w-full"
          />
          <p className="mt-2.5 text-[10px] leading-relaxed text-slate-500">
            {settings.normalize
              ? "Peak normalization lifts quiet audio to a healthy level before gain."
              : "Normalize boosts quiet tracks to ~98% peak; gain fine-tunes up or down."}
          </p>
        </div>

        {/* Estimated File Size Strip */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-transparent to-fuchsia-500/10 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-400">Estimated Output Size</span>
            <span className="font-mono text-sm font-bold text-white">
              {est ? formatBytes(est) : "Calculating…"}
            </span>
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
            {asset?.duration
              ? `Estimated from ${settings.bitrate} kbps × ${formatDuration(asset.duration)} duration.`
              : "Standard studio audio export without loss of fidelity."}
          </p>
        </div>
      </div>
    </section>
  );
}
