import { Scissors, Volume2, Waves } from "lucide-react";
import type { Asset, AudioConvertSettings } from "../types";
import { cn } from "../utils/cn";
import { formatDuration } from "../lib/format";

export type AudioToolId = "trim" | "fades" | "loudness";

function ToolRow({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-medium text-slate-400">{label}</span>
        <span className="font-mono font-bold text-indigo-300">{value}</span>
      </div>
      {children}
    </div>
  );
}

/**
 * Compact editing panels for the Live Preview area: trim, fades, loudness.
 * One panel renders at a time, chosen by the active tool button.
 */
export default function AudioTools({
  tool,
  asset,
  settings,
  onChange,
  disabled,
}: {
  tool: AudioToolId;
  asset: Asset;
  settings: AudioConvertSettings;
  onChange: (patch: Partial<AudioConvertSettings>) => void;
  disabled: boolean;
}) {
  const duration = asset.duration ?? 0;
  const hasDuration = duration > 0.2;
  const effStart = hasDuration ? Math.min(settings.trimStart, duration) : 0;
  const effEnd = hasDuration
    ? settings.trimEnd > 0
      ? Math.min(settings.trimEnd, duration)
      : duration
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
    const end = v >= duration - 0.05 ? 0 : Math.max(settings.trimStart + 0.5, v);
    onChange({ trimEnd: Math.min(end, duration) });
  };

  if (tool === "trim") {
    return (
      <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Scissors className="h-3.5 w-3.5 text-indigo-400" />
            Trim Audio
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400">
              keeps {formatDuration(effDuration)} of {formatDuration(duration)}
            </span>
            {(settings.trimStart > 0 || settings.trimEnd > 0) && (
              <button
                type="button"
                onClick={() => onChange({ trimStart: 0, trimEnd: 0 })}
                disabled={disabled}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 transition-colors hover:text-white disabled:opacity-40"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        {hasDuration ? (
          <div className="space-y-2.5">
            <ToolRow label="Start" value={formatDuration(effStart)}>
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
            </ToolRow>
            <ToolRow
              label="End"
              value={settings.trimEnd > 0 ? formatDuration(settings.trimEnd) : "Full"}
            >
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
            </ToolRow>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500">Duration is still being analyzed…</p>
        )}
      </div>
    );
  }

  if (tool === "fades") {
    return (
      <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Waves className="h-3.5 w-3.5 text-indigo-400" />
          Fades — smooth, click-free edges
        </span>
        <div className="space-y-2.5">
          <ToolRow
            label="Fade in"
            value={settings.fadeIn > 0 ? `${settings.fadeIn.toFixed(1)}s` : "Off"}
          >
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
          </ToolRow>
          <ToolRow
            label="Fade out"
            value={settings.fadeOut > 0 ? `${settings.fadeOut.toFixed(1)}s` : "Off"}
          >
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
          </ToolRow>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
          Loudness
        </span>
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
      <ToolRow
        label="Manual gain"
        value={`${settings.gainDb > 0 ? "+" : ""}${settings.gainDb.toFixed(1)} dB`}
      >
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
      </ToolRow>
      <p className="text-[10px] leading-relaxed text-slate-500">
        {settings.normalize
          ? "Peak normalization lifts quiet audio to a healthy level before gain."
          : "Normalize boosts quiet tracks to ~98% peak; gain fine-tunes up or down."}
      </p>
    </div>
  );
}
