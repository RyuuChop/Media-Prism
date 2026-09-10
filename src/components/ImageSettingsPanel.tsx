import React from "react";
import {
  Check,
  CheckSquare,
  Gauge,
  ImageIcon,
  Layers,
  Link,
  Maximize2,
  PaintBucket,
  Percent,
  RefreshCw,
  Sliders,
  Square,
  Unlink,
} from "lucide-react";
import type { Asset } from "../types";
import { cn } from "../utils/cn";
import {
  calculateDimensions,
  ICO_SIZE_PRESETS,
  IMAGE_FORMAT_DEFS,
  type ImageConvertSettings,
  PRESET_BG_COLORS,
} from "../lib/imageEngine";

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

export default function ImageSettingsPanel({
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
  const originalWidth = asset?.width || 1200;
  const originalHeight = asset?.height || 800;
  const aspect = originalWidth > 0 && originalHeight > 0 ? originalWidth / originalHeight : 1.5;

  const dims = calculateDimensions(originalWidth, originalHeight, settings);

  const handleWidthChange = (val: number) => {
    const safeW = Math.max(1, val);
    if (settings.maintainAspectRatio) {
      const newHeight = Math.max(1, Math.round(safeW / aspect));
      onChange({ targetWidth: safeW, targetHeight: newHeight });
    } else {
      onChange({ targetWidth: safeW });
    }
  };

  const handleHeightChange = (val: number) => {
    const safeH = Math.max(1, val);
    if (settings.maintainAspectRatio) {
      const newWidth = Math.max(1, Math.round(safeH * aspect));
      onChange({ targetHeight: safeH, targetWidth: newWidth });
    } else {
      onChange({ targetHeight: safeH });
    }
  };

  const handlePresetClick = (pw: number, ph: number) => {
    if (settings.maintainAspectRatio && originalWidth > 0 && originalHeight > 0) {
      // Proportional fit within target bounding box
      const scale = Math.min(pw / originalWidth, ph / originalHeight);
      const fitW = Math.max(1, Math.round(originalWidth * scale));
      const fitH = Math.max(1, Math.round(originalHeight * scale));
      onChange({
        targetWidth: fitW,
        targetHeight: fitH,
        resizeMode: "pixels",
      });
    } else {
      onChange({
        targetWidth: pw,
        targetHeight: ph,
        resizeMode: "pixels",
      });
    }
  };

  const toggleIcoSize = (size: number) => {
    const current = settings.icoSizes || [16, 32, 48, 64, 128, 256];
    if (current.includes(size)) {
      if (current.length === 1) return; // keep at least one
      onChange({ icoSizes: current.filter((s) => s !== size) });
    } else {
      onChange({ icoSizes: [...current, size].sort((a, b) => a - b) });
    }
  };

  return (
    <section className="glass p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Image Studio Settings</h3>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              format: "png",
              quality: 90,
              resizeMode: "original",
              targetWidth: originalWidth,
              targetHeight: originalHeight,
              percentage: 100,
              maintainAspectRatio: true,
              transparencyMode: "preserve",
              backgroundColor: "#ffffff",
              icoSizes: [16, 32, 48, 64, 128, 256],
            })
          }
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="space-y-6">
        {/* Output Format selection */}
        <div>
          <SectionHeader icon={ImageIcon} title="Target Image Format" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {IMAGE_FORMAT_DEFS.map((f) => {
              const active = settings.format === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChange({ format: f.id as ImageConvertSettings["format"] })}
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
                    {active && <Check className="h-3.5 w-3.5 text-indigo-300" />}
                  </div>
                  <span className="mt-1 block text-[10px] leading-tight text-slate-400">
                    {f.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality Slider (JPG, JPEG & WEBP) */}
        {(settings.format === "jpg" || settings.format === "jpeg" || settings.format === "webp") && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Gauge className="h-4 w-4 text-indigo-400" />
                <span>Compression Quality</span>
              </div>
              <span className="font-mono text-xs font-bold text-indigo-300">
                {settings.quality}%
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="100"
              step="1"
              value={settings.quality}
              onChange={(e) => onChange({ quality: Number(e.target.value) })}
              disabled={disabled}
              className="w-full"
            />

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {[
                { label: "Max (100%)", val: 100 },
                { label: "High (90%)", val: 90 },
                { label: "Balanced (80%)", val: 80 },
                { label: "Web (65%)", val: 65 },
                { label: "Compact (45%)", val: 45 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => onChange({ quality: p.val })}
                  disabled={disabled}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
                    settings.quality === p.val
                      ? "border-indigo-400/40 bg-indigo-500/20 text-white"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ICO Icon Sizes Selector */}
        {settings.format === "ico" && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <SectionHeader
              icon={Layers}
              title="Included Icon Resolutions"
              badge={`${settings.icoSizes?.length || 6} sizes`}
            />
            <p className="mb-3 text-xs text-slate-400">
              Select which resolution frames to bundle inside this .ICO container:
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ICO_SIZE_PRESETS.map((p) => {
                const checked = (settings.icoSizes || [16, 32, 48, 64, 128, 256]).includes(p.size);
                return (
                  <button
                    key={p.size}
                    type="button"
                    onClick={() => toggleIcoSize(p.size)}
                    disabled={disabled}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors",
                      checked
                        ? "border-indigo-400/50 bg-indigo-500/15 text-white"
                        : "border-white/10 bg-white/[0.02] text-slate-500 hover:text-slate-300",
                    )}
                  >
                    {checked ? (
                      <CheckSquare className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                    )}
                    <span className="font-mono font-medium truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Image Resizing Controls */}
        <div>
          <SectionHeader
            icon={Maximize2}
            title="Image Resizing"
            badge={`${dims.width} × ${dims.height} px`}
          />

          <div className="mb-3 flex rounded-xl border border-white/10 bg-white/5 p-1">
            {(
              [
                { id: "original", label: "Original Size" },
                { id: "pixels", label: "Exact Pixels" },
                { id: "percentage", label: "Percentage" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onChange({
                    resizeMode: tab.id,
                    targetWidth: settings.targetWidth || originalWidth,
                    targetHeight: settings.targetHeight || originalHeight,
                  });
                }}
                disabled={disabled}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all",
                  settings.resizeMode === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow"
                    : "text-slate-400 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {settings.resizeMode === "pixels" && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16000"
                    value={settings.targetWidth || originalWidth}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    disabled={disabled}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:border-indigo-400"
                  />
                </div>

                <button
                  type="button"
                  title={
                    settings.maintainAspectRatio
                      ? "Aspect ratio locked (Proportional scaling)"
                      : "Aspect ratio unlocked"
                  }
                  onClick={() => {
                    const nextMaintain = !settings.maintainAspectRatio;
                    if (nextMaintain) {
                      const newH = Math.max(1, Math.round((settings.targetWidth || originalWidth) / aspect));
                      onChange({ maintainAspectRatio: true, targetHeight: newH });
                    } else {
                      onChange({ maintainAspectRatio: false });
                    }
                  }}
                  disabled={disabled}
                  className={cn(
                    "mt-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                    settings.maintainAspectRatio
                      ? "border-indigo-400/50 bg-indigo-500/20 text-indigo-300"
                      : "border-white/10 bg-white/5 text-slate-500 hover:text-slate-300",
                  )}
                >
                  {settings.maintainAspectRatio ? (
                    <Link className="h-4 w-4" />
                  ) : (
                    <Unlink className="h-4 w-4" />
                  )}
                </button>

                <div className="flex-1">
                  <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16000"
                    value={settings.targetHeight || originalHeight}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    disabled={disabled}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Quick Dimension Presets - Maintains Aspect Ratio without distortion */}
              <div className="pt-2">
                <p className="mb-1.5 text-[10px] uppercase font-semibold text-slate-500">
                  Target Resolution Presets (Proportional Fit)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "4K (3840×2160)", w: 3840, h: 2160 },
                    { label: "1080p (1920×1080)", w: 1920, h: 1080 },
                    { label: "720p (1280×720)", w: 1280, h: 720 },
                    { label: "Square (1080×1080)", w: 1080, h: 1080 },
                    { label: "Icon (512×512)", w: 512, h: 512 },
                    { label: "Favicon (64×64)", w: 64, h: 64 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handlePresetClick(p.w, p.h)}
                      disabled={disabled}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-slate-300 transition-colors hover:border-white/20 hover:text-white active:scale-95"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {settings.resizeMode === "percentage" && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Percent className="h-3.5 w-3.5 text-indigo-400" />
                  Scale Factor
                </span>
                <span className="font-mono text-sm font-bold text-indigo-300">
                  {settings.percentage}%
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={settings.percentage}
                onChange={(e) => onChange({ percentage: Number(e.target.value) })}
                disabled={disabled}
                className="w-full"
              />

              <div className="flex flex-wrap gap-1.5">
                {[25, 50, 75, 100, 150, 200].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onChange({ percentage: pct })}
                    disabled={disabled}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors",
                      settings.percentage === pct
                        ? "border-indigo-400/60 bg-indigo-500/20 text-white"
                        : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
                    )}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background & Transparency Controls */}
        <div>
          <SectionHeader icon={PaintBucket} title="Transparency & Background" />

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            {settings.format === "jpg" || settings.format === "jpeg" ? (
              <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                <span className="font-semibold">Note:</span> JPG does not support alpha
                transparency. Transparent regions are filled with the chosen background color.
              </div>
            ) : (
              <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => onChange({ transparencyMode: "preserve" })}
                  disabled={disabled}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
                    settings.transparencyMode === "preserve"
                      ? "bg-indigo-500 text-white shadow"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  Keep Transparent Alpha
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ transparencyMode: "fill" })}
                  disabled={disabled}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
                    settings.transparencyMode === "fill"
                      ? "bg-indigo-500 text-white shadow"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  Fill Solid Background
                </button>
              </div>
            )}

            {(settings.format === "jpg" ||
              settings.format === "jpeg" ||
              settings.transparencyMode === "fill") && (
              <div className="pt-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Background Color</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: settings.backgroundColor || "#ffffff" }}
                    />
                    <span className="font-mono text-xs font-bold uppercase text-slate-300">
                      {settings.backgroundColor}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {PRESET_BG_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.name}
                      onClick={() => onChange({ backgroundColor: c.value })}
                      disabled={disabled}
                      className={cn(
                        "group relative flex h-8 w-full items-center justify-center rounded-lg border transition-all",
                        settings.backgroundColor.toLowerCase() === c.value.toLowerCase()
                          ? "border-indigo-400 ring-2 ring-indigo-400/40"
                          : "border-white/10 hover:border-white/30",
                      )}
                      style={{ backgroundColor: c.value }}
                    >
                      {settings.backgroundColor.toLowerCase() === c.value.toLowerCase() && (
                        <Check
                          className={cn(
                            "h-3.5 w-3.5",
                            c.value === "#ffffff" ? "text-black" : "text-white",
                          )}
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.backgroundColor || "#ffffff"}
                    onChange={(e) => onChange({ backgroundColor: e.target.value })}
                    disabled={disabled}
                    className="h-8 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={settings.backgroundColor}
                    onChange={(e) => onChange({ backgroundColor: e.target.value })}
                    disabled={disabled}
                    placeholder="#ffffff"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Output Dimensions & Specs Summary */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-transparent to-fuchsia-500/10 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-400">Target Output Specifications</span>
            <span className="font-mono text-sm font-bold text-white">
              {dims.width} × {dims.height} px
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
            <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-slate-300">
              Format: {settings.format.toUpperCase()}
            </span>
            {(settings.format === "jpg" ||
              settings.format === "jpeg" ||
              settings.format === "webp") && (
              <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-slate-300">
                Quality: {settings.quality}%
              </span>
            )}
            <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-slate-300">
              Alpha:{" "}
              {settings.format === "jpg" || settings.format === "jpeg"
                ? "Solid (No Alpha)"
                : settings.transparencyMode === "preserve"
                  ? "Preserved"
                  : "Filled"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
