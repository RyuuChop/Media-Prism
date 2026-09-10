import { useEffect, useState } from "react";
import {
  Crop,
  FileQuestion,
  FlipHorizontal,
  FlipVertical,
  Grid,
  Layers,
  Loader2,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Scissors,
  Volume2,
  Waves,
} from "lucide-react";
import type { Asset, AudioConvertSettings, ConvertResult } from "../types";
import { cn } from "../utils/cn";
import { formatBytes, formatDuration } from "../lib/format";
import { applyTransforms, type ImageConvertSettings } from "../lib/imageEngine";
import AudioVisualizer from "./AudioVisualizer";
import CropOverlay from "./CropOverlay";
import AudioTools, { type AudioToolId } from "./AudioTools";

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

function ToolButton({
  active,
  disabled,
  onClick,
  title,
  children,
  dot,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "relative flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-40",
        active
          ? "border-indigo-400/50 bg-indigo-500/20 text-indigo-200"
          : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
      )}
    >
      {children}
      {dot && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-fuchsia-400 shadow" />
      )}
    </button>
  );
}

export default function PreviewPanel({
  asset,
  result,
  busy,
  imageSettings,
  onImageChange,
  audioSettings,
  onAudioChange,
}: {
  asset: Asset | null;
  result: ConvertResult | null;
  busy: boolean;
  imageSettings: ImageConvertSettings;
  onImageChange: (patch: Partial<ImageConvertSettings>) => void;
  audioSettings: AudioConvertSettings;
  onAudioChange: (patch: Partial<AudioConvertSettings>) => void;
}) {
  const [view, setView] = useState<View>("source");
  const [checkerboard, setCheckerboard] = useState(true);
  const [zoomFit, setZoomFit] = useState<"contain" | "cover">("contain");
  const [cropMode, setCropMode] = useState(false);
  const [audioTool, setAudioTool] = useState<AudioToolId | null>(null);
  const [transformedUrl, setTransformedUrl] = useState<string | null>(null);

  const hasResult = !!result && result.assetId === asset?.id;
  const isImage = asset?.kind === "image";
  const showOutput = view === "output" && hasResult;
  const resultIsImage = result?.mime.startsWith("image/");

  const imageTransformed =
    isImage &&
    (imageSettings.rotate !== 0 || imageSettings.flipH || imageSettings.flipV);

  useEffect(() => {
    if (hasResult) setView("output");
  }, [hasResult]);

  useEffect(() => {
    setView("source");
    setCropMode(false);
    setAudioTool(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

  // Build a source preview that reflects rotate/flip transforms instantly
  useEffect(() => {
    if (!asset || asset.kind !== "image" || !imageTransformed) {
      setTransformedUrl(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const t = applyTransforms(img, imageSettings);
      setTransformedUrl(
        t instanceof HTMLCanvasElement ? t.toDataURL("image/png") : img.src,
      );
    };
    img.src = asset.url;
    return () => {
      cancelled = true;
      img.onload = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    asset?.id,
    imageTransformed,
    imageSettings.rotate,
    imageSettings.flipH,
    imageSettings.flipV,
  ]);

  /* ---------------- transform actions (image) ---------------- */

  const rotateBy = (dir: 1 | -1) => {
    const next = (((imageSettings.rotate + dir * 90) % 360) + 360) % 360;
    onImageChange({
      rotate: next as ImageConvertSettings["rotate"],
      crop: null, // crop coordinates live in the rotated space — reset
    });
  };

  const flip = (axis: "h" | "v") => {
    if (axis === "h") onImageChange({ flipH: !imageSettings.flipH, crop: null });
    else onImageChange({ flipV: !imageSettings.flipV, crop: null });
  };

  const hasCrop = isImage && Boolean(imageSettings.crop);
  const audioDirty =
    !isImage &&
    (audioSettings.trimStart > 0 ||
      audioSettings.trimEnd > 0 ||
      audioSettings.fadeIn > 0 ||
      audioSettings.fadeOut > 0 ||
      audioSettings.normalize ||
      audioSettings.gainDb !== 0);

  return (
    <section className="glass overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/10 px-5 py-3.5">
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

        <div className="flex flex-wrap items-center gap-1.5">
          {/* ---- Image tools: rotate / flip / crop ---- */}
          {isImage && !showOutput && (
            <div className="flex items-center gap-1.5">
              <ToolButton
                onClick={() => rotateBy(-1)}
                disabled={busy}
                title="Rotate 90° left"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </ToolButton>
              <ToolButton
                onClick={() => rotateBy(1)}
                disabled={busy}
                title="Rotate 90° right"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </ToolButton>
              <ToolButton
                onClick={() => flip("h")}
                disabled={busy}
                title="Flip horizontal"
                active={imageSettings.flipH}
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
              </ToolButton>
              <ToolButton
                onClick={() => flip("v")}
                disabled={busy}
                title="Flip vertical"
                active={imageSettings.flipV}
              >
                <FlipVertical className="h-3.5 w-3.5" />
              </ToolButton>
              <ToolButton
                onClick={() => setCropMode((c) => !c)}
                disabled={busy}
                title="Crop"
                active={cropMode}
                dot={hasCrop && !cropMode}
              >
                <Crop className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Crop</span>
              </ToolButton>
            </div>
          )}

          {/* ---- Audio tools: trim / fades / loudness ---- */}
          {!isImage && asset && (
            <div className="flex items-center gap-1.5">
              <ToolButton
                onClick={() => setAudioTool((t) => (t === "trim" ? null : "trim"))}
                disabled={busy}
                title="Trim audio"
                active={audioTool === "trim"}
                dot={
                  (audioSettings.trimStart > 0 || audioSettings.trimEnd > 0) &&
                  audioTool !== "trim"
                }
              >
                <Scissors className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Trim</span>
              </ToolButton>
              <ToolButton
                onClick={() => setAudioTool((t) => (t === "fades" ? null : "fades"))}
                disabled={busy}
                title="Fade in / out"
                active={audioTool === "fades"}
                dot={
                  (audioSettings.fadeIn > 0 || audioSettings.fadeOut > 0) &&
                  audioTool !== "fades"
                }
              >
                <Waves className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Fades</span>
              </ToolButton>
              <ToolButton
                onClick={() =>
                  setAudioTool((t) => (t === "loudness" ? null : "loudness"))
                }
                disabled={busy}
                title="Normalize & gain"
                active={audioTool === "loudness"}
                dot={
                  (audioSettings.normalize || audioSettings.gainDb !== 0) &&
                  audioTool !== "loudness"
                }
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Loudness</span>
              </ToolButton>
            </div>
          )}

          {isImage && !cropMode && (
            <div className="flex items-center gap-1.5">
              <ToolButton
                onClick={() => setCheckerboard((c) => !c)}
                title={checkerboard ? "Transparency grid enabled" : "Dark backdrop enabled"}
                active={checkerboard}
              >
                <Grid className="h-3 w-3" />
                <span className="hidden sm:inline">Grid</span>
              </ToolButton>

              <ToolButton
                onClick={() => setZoomFit((z) => (z === "contain" ? "cover" : "contain"))}
                title={zoomFit === "contain" ? "Fit to frame" : "Fill frame"}
              >
                {zoomFit === "contain" ? (
                  <Maximize className="h-3 w-3" />
                ) : (
                  <Minimize className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">
                  {zoomFit === "contain" ? "Fit" : "Fill"}
                </span>
              </ToolButton>
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
        ) : cropMode && isImage ? (
          /* ---------------- CROP EDITOR (dims only the preview) ---------------- */
          <CropOverlay
            asset={asset}
            settings={imageSettings}
            onChange={onImageChange}
            onDone={() => setCropMode(false)}
            disabled={busy}
          />
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
                  key={asset.id + (transformedUrl ? "-t" : "")}
                  src={transformedUrl || asset.previewUrl || asset.url}
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

              {/* Active edit badge */}
              {!showOutput && (imageTransformed || hasCrop || audioDirty) && (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-fuchsia-400/30 bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-200 backdrop-blur-md">
                  Edited
                </span>
              )}
            </div>

            {/* Audio tool panel (trim / fades / loudness) */}
            {!isImage && audioTool && (
              <div className="mt-4">
                <AudioTools
                  tool={audioTool}
                  asset={asset}
                  settings={audioSettings}
                  onChange={onAudioChange}
                  disabled={busy}
                />
              </div>
            )}

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
