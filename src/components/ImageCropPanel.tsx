import { useEffect, useMemo, useRef, useState } from "react";
import {
  Crop as CropIcon,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
  Undo2,
} from "lucide-react";
import type { Asset } from "../types";
import { cn } from "../utils/cn";
import {
  applyTransforms,
  getSourceSize,
  type CropRect,
  type ImageConvertSettings,
} from "../lib/imageEngine";

type DragMode = "move" | "nw" | "ne" | "sw" | "se";

interface DragState {
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  startCrop: CropRect;
}

const ASPECT_OPTIONS = [
  { id: "free", label: "Free", value: null },
  { id: "1:1", label: "1:1", value: 1 },
  { id: "4:3", label: "4:3", value: 4 / 3 },
  { id: "16:9", label: "16:9", value: 16 / 9 },
] as const;

const MIN_CROP = 16; // px in source space

/**
 * Visual transform editor: rotate (90° steps), flip, and a draggable /
 * resizable crop box. Crop coordinates are stored in the rotated+flipped
 * source space — exactly what the conversion engine applies.
 */
export default function ImageCropPanel({
  asset,
  settings,
  onChange,
  disabled,
}: {
  asset: Asset | null;
  settings: ImageConvertSettings;
  onChange: (patch: Partial<ImageConvertSettings>) => void;
  disabled: boolean;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [aspectId, setAspectId] = useState<string>("free");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  /** Dimensions after rotation (crop space). */
  const tdims = useMemo(() => {
    if (!img) return { w: 0, h: 0 };
    const swap = settings.rotate === 90 || settings.rotate === 270;
    const { width, height } = getSourceSize(img);
    return { w: swap ? height : width, h: swap ? width : height };
  }, [img, settings.rotate]);

  // Load the source image once per asset
  useEffect(() => {
    if (!asset) return;
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = asset.url;
    return () => {
      image.onload = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

  // Rebuild the transformed (rotate/flip) preview
  useEffect(() => {
    if (!img) return;
    const result = applyTransforms(img, settings);
    setPreviewUrl(
      result instanceof HTMLCanvasElement ? result.toDataURL("image/png") : img.src,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, settings.rotate, settings.flipH, settings.flipV]);

  const clampCrop = (c: CropRect): CropRect => {
    const w = Math.max(MIN_CROP, Math.min(Math.round(c.width), tdims.w));
    const h = Math.max(MIN_CROP, Math.min(Math.round(c.height), tdims.h));
    return {
      width: w,
      height: h,
      x: Math.max(0, Math.min(Math.round(c.x), tdims.w - w)),
      y: Math.max(0, Math.min(Math.round(c.y), tdims.h - h)),
    };
  };

  const fullCrop: CropRect = { x: 0, y: 0, width: tdims.w, height: tdims.h };
  const crop = clampCrop(settings.crop ?? fullCrop);
  const hasCrop = Boolean(settings.crop);
  const aspectValue = ASPECT_OPTIONS.find((a) => a.id === aspectId)?.value ?? null;

  /* ---------------- pointer interactions ---------------- */

  const onPointerDown = (e: React.PointerEvent, mode: DragMode) => {
    if (disabled || tdims.w === 0) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startCrop: { ...crop },
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !containerRef.current) return;
    const scale = containerRef.current.clientWidth / Math.max(1, tdims.w);
    if (scale <= 0) return;

    const dx = (e.clientX - drag.startClientX) / scale;
    const dy = (e.clientY - drag.startClientY) / scale;
    const s = drag.startCrop;
    let next: CropRect;

    if (drag.mode === "move") {
      next = { ...s, x: s.x + dx, y: s.y + dy };
    } else {
      let x1 = s.x;
      let y1 = s.y;
      let x2 = s.x + s.width;
      let y2 = s.y + s.height;
      if (drag.mode === "nw") {
        x1 += dx;
        y1 += dy;
      } else if (drag.mode === "ne") {
        x2 += dx;
        y1 += dy;
      } else if (drag.mode === "sw") {
        x1 += dx;
        y2 += dy;
      } else {
        x2 += dx;
        y2 += dy;
      }
      if (x2 < x1) [x1, x2] = [x2, x1];
      if (y2 < y1) [y1, y2] = [y2, y1];
      let w = x2 - x1;
      let h = y2 - y1;

      if (aspectValue != null) {
        // Fixed anchor = the corner opposite the one being dragged
        const ax = drag.mode.includes("w") ? s.x + s.width : s.x;
        const ay = drag.mode.includes("n") ? s.y + s.height : s.y;
        w = Math.max(MIN_CROP, w);
        h = w / aspectValue;
        if (h < MIN_CROP) {
          h = MIN_CROP;
          w = h * aspectValue;
        }
        if (w > tdims.w) {
          w = tdims.w;
          h = w / aspectValue;
        }
        if (h > tdims.h) {
          h = tdims.h;
          w = h * aspectValue;
        }
        x1 = drag.mode.includes("w") ? ax - w : ax;
        y1 = drag.mode.includes("n") ? ay - h : ay;
      }

      next = { x: x1, y: y1, width: Math.max(MIN_CROP, w), height: Math.max(MIN_CROP, h) };
    }

    onChange({ crop: clampCrop(next) });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    dragRef.current = null;
  };

  /* ---------------- transform actions ---------------- */

  const rotateBy = (dir: 1 | -1) => {
    const next = (((settings.rotate + dir * 90) % 360) + 360) % 360;
    onChange({
      rotate: next as ImageConvertSettings["rotate"],
      crop: null, // crop coordinates live in the rotated space — reset
    });
  };

  const flip = (axis: "h" | "v") => {
    if (axis === "h") onChange({ flipH: !settings.flipH, crop: null });
    else onChange({ flipV: !settings.flipV, crop: null });
  };

  const applyAspect = (id: string, value: number | null) => {
    setAspectId(id);
    if (value == null || tdims.w === 0) return;
    // Snap the current crop to the chosen aspect, centered on its middle
    const cx = crop.x + crop.width / 2;
    const cy = crop.y + crop.height / 2;
    let w = crop.width;
    let h = w / value;
    if (h > crop.height) {
      h = crop.height;
      w = h * value;
    }
    if (w > tdims.w) {
      w = tdims.w;
      h = w / value;
    }
    if (h > tdims.h) {
      h = tdims.h;
      w = h * value;
    }
    onChange({ crop: clampCrop({ x: cx - w / 2, y: cy - h / 2, width: w, height: h }) });
  };

  if (!asset) return null;

  const pct = (v: number, total: number) => `${(v / Math.max(1, total)) * 100}%`;
  const activeTransform =
    settings.rotate !== 0 || settings.flipH || settings.flipV || hasCrop;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <CropIcon className="h-3.5 w-3.5 text-indigo-400" />
          <span>Rotate · Flip · Crop</span>
        </div>
        <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
          {hasCrop ? `${Math.round(crop.width)}×${Math.round(crop.height)} px` : "Full image"}
        </span>
      </div>

      {/* Transform quick actions */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {[
          {
            key: "rotl",
            icon: RotateCcw,
            title: "Rotate 90° left",
            onClick: () => rotateBy(-1),
            active: false,
          },
          {
            key: "rotr",
            icon: RotateCw,
            title: "Rotate 90° right",
            onClick: () => rotateBy(1),
            active: false,
          },
          {
            key: "fliph",
            icon: FlipHorizontal,
            title: "Flip horizontal",
            onClick: () => flip("h"),
            active: settings.flipH,
          },
          {
            key: "flipv",
            icon: FlipVertical,
            title: "Flip vertical",
            onClick: () => flip("v"),
            active: settings.flipV,
          },
        ].map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={b.onClick}
            disabled={disabled}
            title={b.title}
            aria-label={b.title}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40",
              b.active
                ? "border-indigo-400/50 bg-indigo-500/20 text-indigo-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
            )}
          >
            <b.icon className="h-3.5 w-3.5" />
          </button>
        ))}

        <div className="mx-1 h-5 w-px bg-white/10" />

        {/* Aspect ratio locks */}
        {ASPECT_OPTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => applyAspect(a.id, a.value)}
            disabled={disabled}
            className={cn(
              "rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors disabled:opacity-40",
              aspectId === a.id
                ? "border-indigo-400/50 bg-indigo-500/20 text-white"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
            )}
          >
            {a.label}
          </button>
        ))}

        {activeTransform && (
          <button
            type="button"
            onClick={() => onChange({ rotate: 0, flipH: false, flipV: false, crop: null })}
            disabled={disabled}
            title="Reset all transforms"
            className="ml-auto flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-400 transition-colors hover:text-rose-300 disabled:opacity-40"
          >
            <Undo2 className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Visual crop editor */}
      {previewUrl ? (
        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative w-fit touch-none select-none rounded-lg"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img
              src={previewUrl}
              alt="Crop preview"
              draggable={false}
              className="block max-h-64 max-w-full rounded-lg border border-white/10 bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)] bg-[length:16px_16px]"
            />

            {/* Crop overlay */}
            <div
              className={cn(
                "absolute cursor-move rounded-[2px] border-2 border-indigo-400/90 shadow-[0_0_0_9999px_rgba(2,4,12,0.6)]",
                disabled && "pointer-events-none opacity-70",
              )}
              style={{
                left: pct(crop.x, tdims.w),
                top: pct(crop.y, tdims.h),
                width: pct(crop.width, tdims.w),
                height: pct(crop.height, tdims.h),
              }}
              onPointerDown={(e) => onPointerDown(e, "move")}
            >
              {/* Rule-of-thirds guides */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/3 top-0 h-full w-px bg-white/25" />
                <div className="absolute left-2/3 top-0 h-full w-px bg-white/25" />
                <div className="absolute left-0 top-1/3 h-px w-full bg-white/25" />
                <div className="absolute left-0 top-2/3 h-px w-full bg-white/25" />
              </div>

              {/* Corner handles */}
              {(
                [
                  { m: "nw", cls: "-left-1.5 -top-1.5 cursor-nwse-resize" },
                  { m: "ne", cls: "-right-1.5 -top-1.5 cursor-nesw-resize" },
                  { m: "sw", cls: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
                  { m: "se", cls: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
                ] as const
              ).map((h) => (
                <button
                  key={h.m}
                  type="button"
                  onPointerDown={(e) => onPointerDown(e, h.m)}
                  aria-label={`Resize crop from ${h.m.toUpperCase()} corner`}
                  className={cn(
                    "absolute h-3.5 w-3.5 rounded-sm border border-indigo-950/60 bg-indigo-300 shadow",
                    h.cls,
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-xs text-slate-500">
          Loading image…
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[10px] leading-relaxed text-slate-500">
          Drag the box or corners to crop. In batch mode the crop is applied to every selected
          image (clamped to each image's size).
        </p>
        {hasCrop && (
          <button
            type="button"
            onClick={() => onChange({ crop: null })}
            disabled={disabled}
            className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-400 transition-colors hover:text-white disabled:opacity-40"
          >
            Clear crop
          </button>
        )}
      </div>
    </div>
  );
}
