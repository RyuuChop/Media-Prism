import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Heart,
  ImageIcon,
  Music,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud,
  Zap,
} from "lucide-react";
import Background from "./components/Background";
import Header from "./components/Header";
import UploadZone from "./components/UploadZone";
import FileQueue from "./components/FileQueue";
import PreviewPanel from "./components/PreviewPanel";
import AudioSettingsPanel from "./components/AudioSettingsPanel";
import ImageSettingsPanel from "./components/ImageSettingsPanel";
import ActionPanel from "./components/ActionPanel";
import HowItWorksFeatures from "./components/HowItWorksFeatures";
import SupportModal from "./components/SupportModal";
import Toasts from "./components/Toasts";
import type {
  Asset,
  AudioConvertSettings,
  BeforeInstallPromptEvent,
  ConvertResult,
  JobPhase,
  MediaKind,
  ToastItem,
} from "./types";
import {
  ALLOWED_EXTS,
  DEFAULT_AUDIO_SETTINGS,
  getOutputName,
} from "./lib/presets";
import { extOf, guessMime, isImageExt, uid } from "./lib/format";
import { convertAudio } from "./lib/audioEngine";
import { generateDemoAudio, generateDemoImage } from "./lib/demo";
import {
  convertImage,
  DEFAULT_IMAGE_SETTINGS,
  type ImageConvertSettings,
} from "./lib/imageEngine";
import { loadAndDecodeImage } from "./lib/imageDecoder";

/* ---------- Media probing (runs locally on blob URLs & native decoders) ---------- */

function probeAudioAsset(url: string): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    a.src = url;
    const timeout = window.setTimeout(() => {
      a.removeAttribute("src");
      a.load();
      resolve(0);
    }, 6000);
    a.onloadedmetadata = () => {
      window.clearTimeout(timeout);
      const d = Number.isFinite(a.duration) ? a.duration : 0;
      a.removeAttribute("src");
      a.load();
      resolve(d);
    };
    a.onerror = () => {
      window.clearTimeout(timeout);
      resolve(0);
    };
  });
}

async function probeAsset(a: Asset, update: (id: string, patch: Partial<Asset>) => void) {
  try {
    if (a.kind === "audio") {
      const d = await probeAudioAsset(a.url);
      update(a.id, { duration: d > 0 ? d : null });
    } else if (a.kind === "image") {
      try {
        const info = await loadAndDecodeImage(a.file || a.url, a.ext);
        update(a.id, {
          width: info.width > 0 ? info.width : null,
          height: info.height > 0 ? info.height : null,
          previewUrl: info.previewUrl,
          thumbnail: info.previewUrl,
        });
      } catch {
        // Fallback for image
      }
    }
  } catch {
    /* probing is best-effort */
  }
}

/* ---------- Feature Card for empty state ---------- */

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass group p-5 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/25 ring-1 ring-white/10 transition-transform duration-200 group-hover:scale-110">
        <Icon className="h-5 w-5 text-indigo-300" />
      </div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{desc}</p>
    </div>
  );
}

/* ---------- App component ---------- */

export default function App() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Batch selection — which assets the Convert button will process
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  // Conversion Settings for Audio & Image
  const [audioSettings, setAudioSettings] = useState<AudioConvertSettings>(DEFAULT_AUDIO_SETTINGS);
  const [imageSettings, setImageSettings] = useState<ImageConvertSettings>(DEFAULT_IMAGE_SETTINGS);

  // Conversion Execution State
  const [phase, setPhase] = useState<JobPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ConvertResult[]>([]);
  const [zipping, setZipping] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // First-Time Support Modal state
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // Demo generators state
  const [demoAudioLoading, setDemoAudioLoading] = useState(false);
  const [demoImageLoading, setDemoImageLoading] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const selected = assets.find((a) => a.id === selectedId) ?? null;
  const busy = phase === "converting";

  const handleInstall = useCallback(() => {
    if (!installPrompt) return;
    installPrompt.prompt().catch(() => {});
    setInstallPrompt(null);
  }, [installPrompt]);

  // Check and trigger first-time support popup helper
  const triggerFirstTimeSupportPopup = useCallback(() => {
    try {
      const alreadyShown = localStorage.getItem("mediaprism_support_modal_shown");
      if (!alreadyShown) {
        localStorage.setItem("mediaprism_support_modal_shown", "true");
        setSupportModalOpen(true);
      }
    } catch {
      // localStorage fallback
    }
  }, []);

  // Update targetWidth & targetHeight when selected image changes
  useEffect(() => {
    if (selected?.kind === "image" && selected.width && selected.height) {
      setImageSettings((prev) => ({
        ...prev,
        targetWidth: selected.width || 1920,
        targetHeight: selected.height || 1080,
      }));
    }
  }, [selected?.id, selected?.width, selected?.height, selected?.kind]);

  const addToast = useCallback((type: ToastItem["type"], title: string, message?: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, type, title, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4600);
  }, []);

  // PWA install prompt capture
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      addToast(
        "success",
        "MediaPrism installed",
        "Find it on your home screen or desktop — it works offline too.",
      );
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [addToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const updateAsset = useCallback((id: string, patch: Partial<Asset>) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const handleFiles = useCallback(
    (files: File[]) => {
      const valid: File[] = [];
      const rejected: string[] = [];
      for (const f of files) {
        const ext = extOf(f.name);
        if (ALLOWED_EXTS.has(ext)) valid.push(f);
        else rejected.push(f.name);
      }
      if (rejected.length > 0) {
        addToast(
          "error",
          "Unsupported file type",
          `${rejected.join(", ")} — supported: PNG, JPG, JPEG, JPE, WEBP, ICO, GIF, BMP, SVG, TIFF, MP3, WAV, AAC, OGG, M4A, FLAC.`,
        );
      }
      if (valid.length === 0) return;

      const created: Asset[] = valid.map((f) => {
        const ext = extOf(f.name);
        const kind: MediaKind = isImageExt(ext) ? "image" : "audio";

        return {
          id: uid(),
          file: f,
          name: f.name,
          size: f.size,
          mime: f.type || guessMime(ext),
          ext,
          kind,
          url: URL.createObjectURL(f),
          previewUrl: null,
          duration: null,
          width: null,
          height: null,
          thumbnail: null,
          status: "ready",
        };
      });

      setAssets((prev) => [...prev, ...created]);
      setSelectedId((prev) => prev ?? created[0].id);
      clearResults();
      created.forEach((a) => void probeAsset(a, updateAsset));
      addToast(
        "success",
        created.length > 1 ? `${created.length} files added` : `${created[0].name} added`,
        "Ready to convert — configure your parameters and hit Convert.",
      );
    },
    [addToast, updateAsset],
  );

  const removeAsset = useCallback(
    (id: string) => {
      setAssets((prev) => {
        const target = prev.find((a) => a.id === id);
        if (target) URL.revokeObjectURL(target.url);
        return prev.filter((a) => a.id !== id);
      });
      setSelectedId((prevId) => {
        if (prevId !== id) return prevId;
        return assets.find((a) => a.id !== id)?.id ?? null;
      });
      setCheckedIds((prev) => prev.filter((c) => c !== id));
      setResults((prev) => {
        const kept = prev.filter((r) => r.assetId !== id);
        prev
          .filter((r) => r.assetId === id)
          .forEach((r) => URL.revokeObjectURL(r.url));
        return kept;
      });
    },
    [assets],
  );

  const clearAll = useCallback(() => {
    assets.forEach((a) => URL.revokeObjectURL(a.url));
    setAssets([]);
    setSelectedId(null);
    setCheckedIds([]);
    clearResults();
  }, [assets]);

  const updateAudioSettings = useCallback((patch: Partial<AudioConvertSettings>) => {
    setAudioSettings((s) => ({ ...s, ...patch }));
    setPhase((p) => (p === "done" ? "idle" : p));
  }, []);

  const updateImageSettings = useCallback((patch: Partial<ImageConvertSettings>) => {
    setImageSettings((s) => ({ ...s, ...patch }));
    setPhase((p) => (p === "done" ? "idle" : p));
  }, []);

  const clearResults = useCallback(() => {
    setResults((prev) => {
      prev.forEach((r) => URL.revokeObjectURL(r.url));
      return [];
    });
  }, []);

  const toggleCheck = useCallback(
    (id: string) => {
      const target = assets.find((a) => a.id === id);
      if (!target) return;
      setCheckedIds((prev) => {
        if (prev.includes(id)) return prev.filter((c) => c !== id);
        // A batch can only hold one media kind — if this check would mix
        // kinds, start a fresh batch with just this file (defensive; the
        // UI disables the other kind's checkboxes).
        const prevKind = prev.length
          ? assets.find((a) => a.id === prev[0])?.kind
          : undefined;
        if (prevKind && prevKind !== target.kind) return [id];
        return [...prev, id];
      });
    },
    [assets],
  );

  const toggleCheckAll = useCallback(() => {
    setCheckedIds((prev) => {
      const checkedKind = prev.length
        ? (assets.find((a) => a.id === prev[0])?.kind ?? null)
        : null;
      // "Select all" applies to the active batch kind: the checked kind,
      // else the focused asset's kind, else the first asset's kind.
      const batchKind =
        checkedKind ??
        (assets.find((a) => a.id === selectedId)?.kind ??
          assets[0]?.kind ??
          null);
      if (!batchKind) return prev;

      const selectable = assets.filter((a) => a.kind === batchKind);
      const allChecked =
        prev.length === selectable.length &&
        selectable.every((a) => prev.includes(a.id));
      return allChecked ? [] : selectable.map((a) => a.id);
    });
  }, [assets, selectedId]);

  const handleConvert = useCallback(async () => {
    if (busy) return;

    // Batch = explicitly checked assets, falling back to the focused asset.
    let batch =
      checkedIds.length > 0
        ? assets.filter((a) => checkedIds.includes(a.id))
        : selected
          ? [selected]
          : [];
    if (batch.length === 0) return;

    // Safety: a batch must be a single media kind (image XOR audio).
    const batchKind = batch[0].kind;
    batch = batch.filter((a) => a.kind === batchKind);

    const total = batch.length;

    // Revoke previous run's object URLs before starting fresh.
    clearResults();
    setError(null);
    setPhase("converting");
    setProgress(0);

    const usedNames = new Set<string>();
    const collected: ConvertResult[] = [];
    const failures: { name: string; message: string }[] = [];

    const markStatus = (id: string, status: Asset["status"]) => {
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    };

    for (let i = 0; i < total; i++) {
      const asset = batch[i];
      const fileLabel =
        total > 1 ? `File ${i + 1}/${total} · ${asset.name}` : asset.name;

      markStatus(asset.id, "converting");

      try {
        let output: ConvertResult;

        if (asset.kind === "image") {
          setPhaseLabel(`${fileLabel} — encoding…`);
          await new Promise((r) => setTimeout(r, 30)); // Yield for smooth UI
          setProgress(Math.round(((i + 0.35) / total) * 100));
          setPhaseLabel(
            `${fileLabel} — encoding to ${imageSettings.format.toUpperCase()}…`,
          );

          const { blob, mime, ext, width, height, previewUrl } =
            await convertImage(
              asset.file || asset.url,
              imageSettings,
              asset.name,
              asset.ext,
            );

          let name = getOutputName(asset.name, ext);
          while (usedNames.has(name)) {
            const dot = name.lastIndexOf(".");
            name =
              dot === -1
                ? `${name} (copy)`
                : `${name.slice(0, dot)} (${usedNames.size + 1})${name.slice(dot)}`;
          }
          usedNames.add(name);

          output = {
            assetId: asset.id,
            url: URL.createObjectURL(blob),
            previewUrl,
            name,
            size: blob.size,
            mime,
            width,
            height,
          };
        } else {
          setPhaseLabel(`${fileLabel} — decoding audio…`);
          await new Promise((r) => setTimeout(r, 30));

          const { blob, mime, ext, duration } = await convertAudio(
            asset.file || asset.url,
            audioSettings,
            (pct) => setProgress(Math.round(((i + pct / 100) / total) * 100)),
            (label) =>
              setPhaseLabel(
                `${fileLabel} — ${label ?? "processing…"}`,
              ),
          );

          let name = getOutputName(asset.name, ext);
          while (usedNames.has(name)) {
            const dot = name.lastIndexOf(".");
            name =
              dot === -1
                ? `${name} (copy)`
                : `${name.slice(0, dot)} (${usedNames.size + 1})${name.slice(dot)}`;
          }
          usedNames.add(name);

          output = {
            assetId: asset.id,
            url: URL.createObjectURL(blob),
            name,
            size: blob.size,
            mime,
            duration,
          };
        }

        collected.push(output);
        markStatus(asset.id, "done");
        setResults((prev) => [...prev, output]);
        setProgress(Math.round(((i + 1) / total) * 100));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        failures.push({ name: asset.name, message: msg });
        markStatus(asset.id, "error");
      }
    }

    setPhaseLabel("");

    if (collected.length > 0) {
      setProgress(100);
      setPhase("done");
      addToast(
        "success",
        collected.length > 1
          ? `${collected.length} of ${total} files converted`
          : "Conversion Complete",
        collected.length > 1
          ? "Your batch is ready — download files individually or grab them all as a ZIP."
          : `${collected[0].name} is ready to download.`,
      );
      if (failures.length > 0) {
        addToast(
          "error",
          `${failures.length} file${failures.length > 1 ? "s" : ""} failed`,
          failures.map((f) => f.name).join(", "),
        );
      }
      triggerFirstTimeSupportPopup();
    } else {
      setPhase("error");
      setError(
        failures[0]?.message || "All conversions failed. Please try again.",
      );
      addToast(
        "error",
        "Batch conversion failed",
        failures[0]?.message ?? "No files could be converted.",
      );
    }
  }, [
    assets,
    checkedIds,
    selected,
    audioSettings,
    imageSettings,
    busy,
    addToast,
    triggerFirstTimeSupportPopup,
    clearResults,
  ]);

  const handleDownload = useCallback(
    (result: ConvertResult) => {
      const a = document.createElement("a");
      a.href = result.url;
      a.download = result.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      addToast("success", "Download started", result.name);

      // Also trigger Support Modal on first download click if not shown yet
      triggerFirstTimeSupportPopup();
    },
    [addToast, triggerFirstTimeSupportPopup],
  );

  const handleDownloadAll = useCallback(async () => {
    if (results.length === 0 || zipping) return;
    setZipping(true);
    try {
      const { createZipBlob } = await import("./lib/zipWriter");
      const entries = await Promise.all(
        results.map(async (r) => ({
          name: r.name,
          blob: await fetch(r.url).then((res) => res.blob()),
        })),
      );
      const zip = await createZipBlob(entries);
      const url = URL.createObjectURL(zip);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mediaprism-batch-${results.length}-files.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Give the browser a moment to start the download before revoking
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      addToast(
        "success",
        "ZIP download started",
        `${results.length} files · ${(zip.size / (1024 * 1024)).toFixed(zip.size > 1024 * 1024 ? 1 : 2)} MB`,
      );
      triggerFirstTimeSupportPopup();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addToast("error", "Could not build ZIP", msg);
    } finally {
      setZipping(false);
    }
  }, [results, zipping, addToast, triggerFirstTimeSupportPopup]);

  const handleReset = useCallback(() => {
    clearResults();
    setPhase("idle");
    setProgress(0);
    setPhaseLabel("");
    setError(null);
  }, [clearResults]);

  const handleDemoAudio = useCallback(async () => {
    if (demoAudioLoading || demoImageLoading) return;
    setDemoAudioLoading(true);
    try {
      const file = await generateDemoAudio();
      handleFiles([file]);
      addToast(
        "success",
        "Sample audio track synthesized",
        "A melodic audio clip was generated in your browser — try converting it to MP3, AAC, FLAC, or OGG!",
      );
    } catch {
      addToast("error", "Demo unavailable", "Audio synthesis failed.");
    } finally {
      setDemoAudioLoading(false);
    }
  }, [demoAudioLoading, demoImageLoading, handleFiles, addToast]);

  const handleDemoImage = useCallback(async () => {
    if (demoImageLoading || demoAudioLoading) return;
    setDemoImageLoading(true);
    try {
      const file = await generateDemoImage();
      handleFiles([file]);
      addToast(
        "success",
        "Sample graphic generated",
        "A high-res transparent badge (1200×1200 PNG) was created live. Test resizing & format conversion!",
      );
    } catch {
      addToast("error", "Demo unavailable", "Graphic generation failed.");
    } finally {
      setDemoImageLoading(false);
    }
  }, [demoImageLoading, demoAudioLoading, handleFiles, addToast]);

  const hasAssets = assets.length > 0;
  const isImageSelected = selected?.kind === "image";

  return (
    <div className="relative min-h-screen font-sans text-slate-200">
      <Background />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Header
          onOpenSupport={() => setSupportModalOpen(true)}
          canInstall={installPrompt !== null}
          onInstall={handleInstall}
        />

        <main>
          {/* Hero Banner */}
          <div className="animate-fade-up mx-auto mt-8 max-w-3xl text-center sm:mt-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-indigo-300">
              <Zap className="h-3.5 w-3.5" />
              100% In-Browser Image Studio & Audio Converter · Zero Server Lag
            </span>

            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
              Transform your media assets,{" "}
              <span className="text-gradient">purely in your browser</span>
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-400">
              Convert, resize, and remaster images (PNG, JPG, WEBP, ICO, GIF, BMP, SVG, TIFF, JPE) and audio (MP3, WAV, AAC, OGG, M4A, FLAC). Lightning-fast, private, and zero latency.
            </p>
          </div>

          {/* Upload Zone */}
          <div className="animate-fade-up mt-8" style={{ animationDelay: "0.08s" }}>
            <UploadZone
              onFiles={handleFiles}
              onDemoAudio={handleDemoAudio}
              onDemoImage={handleDemoImage}
              demoAudioLoading={demoAudioLoading}
              demoImageLoading={demoImageLoading}
            />
          </div>

          {/* Active Asset Workstation */}
          {hasAssets ? (
            <div className="animate-fade-up mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-7">
                <PreviewPanel
                  asset={selected}
                  result={results.find((r) => r.assetId === selected?.id) ?? null}
                  busy={busy}
                />
                <FileQueue
                  assets={assets}
                  selectedId={selectedId}
                  checkedIds={checkedIds}
                  onSelect={setSelectedId}
                  onToggleCheck={toggleCheck}
                  onToggleCheckAll={toggleCheckAll}
                  onRemove={removeAsset}
                  onClear={clearAll}
                  busy={busy}
                />
              </div>

              <div className="space-y-6 lg:col-span-5">
                {/* Dynamically switch between Image Studio and Audio Studio Settings */}
                {isImageSelected ? (
                  <ImageSettingsPanel
                    asset={selected}
                    settings={imageSettings}
                    onChange={updateImageSettings}
                    disabled={busy}
                  />
                ) : (
                  <AudioSettingsPanel
                    asset={selected}
                    settings={audioSettings}
                    onChange={updateAudioSettings}
                    disabled={busy}
                  />
                )}

                <ActionPanel
                  asset={selected}
                  batchFiles={
                    checkedIds.length > 0
                      ? assets.filter((a) => checkedIds.includes(a.id))
                      : selected
                        ? [selected]
                        : []
                  }
                  audioSettings={audioSettings}
                  imageSettings={imageSettings}
                  phase={phase}
                  progress={progress}
                  phaseLabel={phaseLabel}
                  error={error}
                  results={results}
                  zipping={zipping}
                  onConvert={handleConvert}
                  onDownload={handleDownload}
                  onDownloadAll={handleDownloadAll}
                  onReset={handleReset}
                />
              </div>
            </div>
          ) : (
            <div className="animate-fade-up mt-10" style={{ animationDelay: "0.16s" }}>
              <div className="grid gap-4 sm:grid-cols-3">
                <FeatureCard
                  icon={UploadCloud}
                  title="Drop Images or Audio"
                  desc="Drop PNG, JPG, WEBP, ICO, GIF, BMP, SVG, TIFF, MP3, WAV, AAC, OGG, M4A, FLAC files — or synthesize sample media."
                />
                <FeatureCard
                  icon={SlidersHorizontal}
                  title="Fine-Tune Settings"
                  desc="Set exact pixel dimensions, aspect ratio locks, compression quality, alpha channels, audio bitrates (128k–320k), and sample rates."
                />
                <FeatureCard
                  icon={Zap}
                  title="Instant Local Export"
                  desc="Hardware-accelerated in-memory execution via HTML5 Canvas & Web Audio API. Zero wait queues, ready to download instantly."
                />
              </div>

              <div className="mt-6 flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-xs leading-relaxed text-slate-400">
                  Your files never leave your device. All image transformations and audio remastering
                  happen 100% locally in browser memory with zero server lag.
                </p>
              </div>
            </div>
          )}

          {/* 'How It Works & Features' Info Section */}
          <HowItWorksFeatures />
        </main>

        {/* Footer with Persistent Social Support Badge */}
        <footer className="mt-20 border-t border-white/5 pt-8 pb-6 text-center text-xs leading-relaxed text-slate-500 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5 text-fuchsia-400" /> Image Studio Suite
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Music className="h-3.5 w-3.5 text-indigo-400" /> Audio Studio
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-emerald-400" /> 100% Client-Side
            </span>
          </div>

          {/* Creator Support Persistent Footer Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-indigo-400/20 bg-white/[0.02] px-5 py-2.5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setSupportModalOpen(true)}
              className="flex items-center gap-1.5 font-medium text-slate-300 hover:text-pink-300 transition-colors"
            >
              <Heart className="h-4 w-4 text-pink-400 fill-pink-400/80" />
              <span>Supported by</span>
              <span className="font-mono text-pink-400 font-bold hover:underline">@X_RyuuChop_X</span>
            </button>

            <span className="text-slate-600">|</span>

            <div className="flex items-center gap-3">
              <a
                href="https://youtube.com/@X_RYUUCHOP_X"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors"
                title="YouTube: @X_RYUUCHOP_X"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="font-mono text-[11px]">YouTube</span>
              </a>

              <a
                href="https://tiktok.com/@x_ryuuchop_x"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
                title="TikTok: x_ryuuchop_x"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
                <span className="font-mono text-[11px]">TikTok</span>
              </a>

              <a
                href="https://instagram.com/X_RyuuChop_X"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-400 hover:text-pink-400 transition-colors"
                title="Instagram: X_RyuuChop_X"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span className="font-mono text-[11px]">Instagram</span>
              </a>
            </div>
          </div>

          <div>
            MediaPrism · 100% In-Browser HTML5 Canvas & Web Audio API Processing · Zero Server Uploads
          </div>
        </footer>
      </div>

      {/* First-Time Support Modal */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
