import { useEffect, useState } from "react";
import {
  FileQuestion,
  Grid,
  Layers,
  Loader2,
  Maximize,
  Minimize,
} from "lucide-react";
import type { Asset, ConvertResult } from "../types";
import { cn } from "../utils/cn";
import { formatBytes, formatDuration } from "../lib/format";
import AudioVisualizer from "./AudioVisualizer";

type View = "source" | "output";

function TabBtn({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
        active
          ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow"
          : "text-slate-400 hover:text-white",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 truncate font-mono text-xs font-semibold text-slate-200">{value}</p>
    </div>
  );
}

export default function PreviewPanel({
  asset,
  result,
  busy,
}: {
  asset: Asset | null;
  result: ConvertResult | null;
  busy: boolean;
}) {
  const [view, setView] = useState<View>("source");
  const [checkerboard, setCheckerboard] = useState(true);
  const [zoomFit, setZoomFit] = useState<"contain" | "cover">("contain");

  const hasResult = !!result && result.assetId === asset?.id;
  const isImage = asset?.kind === "image";
  const showOutput = view === "output" && hasResult;
  const resultIsImage = result?.mime.startsWith("image/");

  useEffect(() => {
    if (hasResult) setView("output");
  }, [hasResult]);

  useEffect(() => {
    setView("source");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

  return (
    <section className="glass overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Live Preview</h3>
          {busy && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isImage && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCheckerboard((c) => !c)}
                title={checkerboard ? "Transparency grid enabled" : "Dark backdrop enabled"}
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors",
                  checkerboard
                    ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-300"
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
                )}
              >
                <Grid className="h-3 w-3" />
                <span className="hidden sm:inline">Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setZoomFit((z) => (z === "contain" ? "cover" : "contain"))}
                title={zoomFit === "contain" ? "Fit to frame" : "Fill frame"}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-white"
              >
                {zoomFit === "contain" ? (
                  <Maximize className="h-3 w-3" />
                ) : (
                  <Minimize className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">
                  {zoomFit === "contain" ? "Fit" : "Fill"}
                </span>
              </button>
            </div>
          )}

          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            <TabBtn active={view === "source"} onClick={() => setView("source")}>
              Source
            </TabBtn>
            <TabBtn
              active={view === "output"}
              disabled={!hasResult}
              onClick={() => setView("output")}
            >
              Output
            </TabBtn>
          </div>
        </div>
      </div>

      <div className="p-5">
        {!asset ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-black/20 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <FileQuestion className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-400">No media asset loaded</p>
            <p className="max-w-xs text-xs text-slate-600">
              Upload an image or audio file above to see its live preview here.
            </p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "relative aspect-video overflow-hidden rounded-xl border border-white/10 flex items-center justify-center transition-colors",
                checkerboard && (isImage || resultIsImage)
                  ? "bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)] bg-[length:24px_24px]"
                  : "bg-black/75",
              )}
            >
              {showOutput ? (
                resultIsImage ? (
                  <img
                    key={result!.url}
                    src={result?.previewUrl || result!.url}
                    alt={result!.name}
                    className={cn(
                      "h-full w-full transition-all",
                      zoomFit === "contain" ? "object-contain" : "object-cover",
                      // ICO frames are tiny — show crisp pixels instead of
                      // an upscaled blur when previewed larger than 100%.
                      result?.mime === "image/x-icon" && "pixelated-preview",
                    )}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-6">
                    <div className="w-full">
                      <AudioVisualizer url={result!.url} key={result!.url} />
                    </div>
                  </div>
                )
              ) : isImage ? (
                <img
                  key={asset.id}
                  src={asset.previewUrl || asset.url}
                  alt={asset.name}
                  className={cn(
                    "h-full w-full transition-all",
                    zoomFit === "contain" ? "object-contain" : "object-cover",
                  )}
                />
              ) : (
                <div className="flex h-full items-center justify-center gap-10 px-6">
                  <div className="relative hidden shrink-0 sm:block">
                    <div className="h-40 w-40 rounded-full bg-[radial-gradient(circle,#1e293b_0%,#0f172a_45%,#020617_100%)] shadow-2xl ring-1 ring-white/10" />
                    <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
                    <div className="absolute inset-4 rounded-full border border-white/[0.06]" />
                    <div className="absolute inset-8 rounded-full border border-white/[0.06]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 opacity-90 shadow-lg" />
                      <div className="absolute h-3 w-3 rounded-full bg-black/80" />
                    </div>
                  </div>
                  <div className="w-full max-w-md">
                    <AudioVisualizer url={asset.url} key={asset.id} />
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <span
                className={cn(
                  "absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm",
                  showOutput
                    ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/30"
                    : "bg-black/60 text-slate-300 border border-white/10",
                )}
              >
                {showOutput ? "Converted Output" : asset.ext.toUpperCase()}
              </span>
            </div>

            {/* Metadata metrics strip */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Meta
                label="Format"
                value={
                  showOutput
                    ? result?.mime?.split("/")[1]?.toUpperCase() || "OUTPUT"
                    : asset.ext.toUpperCase()
                }
              />
              <Meta
                label="File Size"
                value={formatBytes(showOutput && result ? result.size : asset.size)}
              />
              <Meta
                label={isImage || resultIsImage ? "Dimensions" : "Duration"}
                value={
                  isImage || resultIsImage
                    ? showOutput && result?.width
                      ? `${result.width} × ${result.height} px`
                      : asset.width
                        ? `${asset.width} × ${asset.height} px`
                        : "Auto"
                    : formatDuration(asset.duration)
                }
              />
              <Meta
                label="Type / Mode"
                value={
                  isImage
                    ? asset.ext === "svg"
                      ? "Vector SVG"
                      : asset.ext === "ico"
                        ? "Icon Container"
                        : "Image Studio"
                    : "Audio Track"
                }
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
