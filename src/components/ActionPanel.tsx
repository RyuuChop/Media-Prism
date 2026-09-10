import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { Asset, AudioConvertSettings, ConvertResult, JobPhase } from "../types";
import { cn } from "../utils/cn";
import { getFormatDef } from "../lib/presets";
import { formatBytes, formatDuration } from "../lib/format";
import type { ImageConvertSettings } from "../lib/imageEngine";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 truncate font-mono text-xs font-bold text-slate-200">{value}</p>
    </div>
  );
}

export default function ActionPanel({
  asset,
  audioSettings,
  imageSettings,
  phase,
  progress,
  phaseLabel,
  error,
  result,
  onConvert,
  onDownload,
  onReset,
}: {
  asset: Asset | null;
  audioSettings: AudioConvertSettings;
  imageSettings: ImageConvertSettings;
  phase: JobPhase;
  progress: number;
  phaseLabel: string;
  error: string | null;
  result: ConvertResult | null;
  onConvert: () => void;
  onDownload: () => void;
  onReset: () => void;
}) {
  const isImage = asset?.kind === "image";
  const activeFormat = isImage ? imageSettings.format : audioSettings.format;
  const fmt = getFormatDef(activeFormat);
  const hasResult = !!result && result.assetId === asset?.id;

  return (
    <section className="glass p-5">
      {asset && phase === "idle" && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <Stat label="Source" value={formatBytes(asset.size)} />
          <Stat
            label={isImage ? "Dimensions" : "Duration"}
            value={
              isImage
                ? asset.width && asset.height
                  ? `${asset.width}×${asset.height}`
                  : "Image"
                : formatDuration(asset.duration)
            }
          />
          <Stat label="Target" value={fmt.label} />
        </div>
      )}

      {phase === "idle" && (
        <>
          <button
            type="button"
            onClick={onConvert}
            disabled={!asset}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-950/50 transition-all duration-200 hover:shadow-[0_8px_40px_-8px_rgba(139,92,246,0.6)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Wand2 className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
              Convert to {fmt.label.toUpperCase()}
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>

          <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-400">
            {isImage
              ? "Pure client-side canvas and binary encoders. High-fidelity lossless & custom sizing."
              : "Pure client-side Web Audio & stream processing. Instant encoding with zero network lag."}
          </p>
        </>
      )}

      {phase === "converting" && (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Processing
              </p>
              <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-white">
                {progress > 0 ? `${progress}%` : "…"}
              </p>
            </div>
            <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-indigo-400" />
              <span className="truncate">{phaseLabel || "Processing…"}</span>
            </div>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            {progress > 0 ? (
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="animate-shimmer absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.45)_50%,transparent_70%)] bg-[length:200%_100%]" />
              </div>
            ) : (
              <div className="animate-shimmer relative h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-[length:200%_100%]" />
            )}
          </div>
        </div>
      )}

      {phase === "done" && hasResult && result && (
        <div className="animate-fade-up space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3.5">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">Conversion complete</p>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  <Sparkles className="h-3 w-3" />
                  Ready
                </span>
              </div>
              <p className="truncate font-mono text-xs text-emerald-300/90 mt-0.5">{result.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {formatBytes(result.size)}
                {result.width && result.height ? ` · ${result.width}×${result.height} px` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDownload}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/50 transition-all duration-200 hover:shadow-[0_8px_40px_-8px_rgba(16,185,129,0.55)] hover:brightness-110 active:scale-[0.98]"
          >
            <Download className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-y-0.5" />
            Download {fmt.label.toUpperCase()} · {formatBytes(result.size)}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:border-white/20 hover:text-white active:scale-[0.98]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Convert another file
          </button>
        </div>
      )}

      {phase === "error" && (
        <div className="animate-fade-up space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="text-sm font-bold text-white">Conversion failed</p>
              <p className="mt-0.5 text-xs leading-relaxed text-rose-200/80">
                {error ?? "Something went wrong. Please try again."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onConvert}
            className={cn(
              "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200",
              "transition-colors hover:border-white/20 hover:text-white active:scale-[0.98]",
            )}
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
