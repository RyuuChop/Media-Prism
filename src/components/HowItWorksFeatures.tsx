import { useState } from "react";
import {
  CheckCircle2,
  Cpu,
  FileCheck,
  Gauge,
  ImageIcon,
  Maximize2,
  Music,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "../utils/cn";

const FEATURES = [
  {
    id: "images",
    icon: ImageIcon,
    accent: "from-emerald-500 to-teal-500",
    badge: "Designer & Photo Suite",
    title: "Image Studio for Creators",
    desc: "Convert PNG, JPG, JPEG, JPE, WEBP, ICO, GIF, BMP, SVG, and TIFF assets instantly. Features cubic multi-step progressive downsampling, exact pixel/percentage resizing with aspect-ratio preservation, quality sliders, and transparency controls.",
    bullets: [
      "PNG, JPG, JPEG, JPE, WEBP, ICO, GIF, BMP, SVG, TIFF",
      "Multi-resolution Windows .ICO container builder",
      "Aspect-ratio locking & progressive bicubic resampling",
    ],
  },
  {
    id: "audio",
    icon: Music,
    accent: "from-indigo-500 to-violet-500",
    badge: "Web Audio Studio",
    title: "Audio Studio & Remastering",
    desc: "Convert and remaster audio between MP3, WAV, AAC, OGG, M4A, and FLAC directly in your browser. Encodes with standard 44.1kHz/48kHz sample rates and customizable 128k to 320k bitrates for complete media player compatibility.",
    bullets: [
      "MP3, WAV, AAC, OGG, M4A, FLAC format suite",
      "Standard sample rates (44.1kHz / 48kHz) & valid headers",
      "Zero crackle soft-limiting & live spectrum visualizer",
    ],
  },
  {
    id: "scaling",
    icon: Maximize2,
    accent: "from-fuchsia-500 to-pink-500",
    badge: "Smart Dimensions",
    title: "Pixel-Perfect Resizing",
    desc: "Scale graphics to 4K (3840×2160), 1080p, 720p, Square (1080×1080), Icon (512×512), Favicon (64×64), or exact pixel values with zero stretching, distortion, or blurriness.",
    bullets: [
      "Proportional bounding-box scaling with zero distortion",
      "Preserve 32-bit RGBA alpha or fill custom background",
      "High-speed in-memory canvas & binary encoders",
    ],
  },
  {
    id: "performance",
    icon: Gauge,
    accent: "from-cyan-500 to-blue-500",
    badge: "Zero Latency",
    title: "100% Client-Side Engine",
    desc: "No heavy downloads, no WebAssembly freezing, and no server queues. Everything processes in client memory with native HTML5 Canvas & Web Audio acceleration for maximum site speed.",
    bullets: [
      "Zero server uploads · 100% private & offline-ready",
      "Instant conversion execution without browser freezing",
      "No file size caps, compression watermarks, or accounts",
    ],
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Drop or Synthesize Media",
    desc: "Drag & drop PNG, JPG, WEBP, ICO, GIF, BMP, SVG, TIFF, MP3, WAV, AAC, OGG, M4A, FLAC files or generate live sample assets.",
  },
  {
    step: "02",
    title: "Configure Studio Settings",
    desc: "Pick your target format, exact pixel dimensions, compression quality, alpha transparency, audio bitrates, and sample rates.",
  },
  {
    step: "03",
    title: "Instant Export & Download",
    desc: "Process with native browser acceleration and click Download. No watermarks, wait queues, or account logins needed.",
  },
];

export default function HowItWorksFeatures() {
  const [activeTab, setActiveTab] = useState<string>("images");

  return (
    <section className="mt-20 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          High-Speed Studio Capabilities
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-4xl tracking-tight">
          High-Performance Image & Audio Converter,{" "}
          <span className="text-gradient">purely in your browser</span>
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
          MediaPrism combines HTML5 Canvas, Web Audio API, and specialized binary encoders to provide
          creators, designers, and audio producers with a private, zero-compromise workstation.
        </p>
      </div>

      {/* 4 Feature Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const isActive = activeTab === f.id;
          return (
            <div
              key={f.id}
              onClick={() => setActiveTab(f.id)}
              className={cn(
                "glass group relative cursor-pointer overflow-hidden p-6 transition-all duration-300",
                isActive
                  ? "border-indigo-400/50 bg-white/[0.05] shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]"
                  : "hover:border-white/20 hover:bg-white/[0.04]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-white/15 shadow-lg transition-transform duration-300 group-hover:scale-110",
                    f.accent,
                  )}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  {f.badge}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">
                {f.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-400">{f.desc}</p>

              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                {f.bullets.map((b) => (
                  <div key={b} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-Step Visual Workflow */}
      <div className="glass p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Three-Step Conversion Workflow</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {WORKFLOW_STEPS.map((w, idx) => (
            <div key={w.step} className="relative rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-black text-indigo-400/60">{w.step}</span>
                {idx < 2 && (
                  <span className="hidden md:block text-slate-600 font-mono text-xs">→ Next</span>
                )}
              </div>
              <h4 className="mt-3 text-sm font-bold text-white">{w.title}</h4>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Guarantee Badges Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: ShieldCheck,
            title: "100% Private",
            desc: "Zero server uploads",
          },
          {
            icon: Zap,
            title: "Instant Export",
            desc: "Native browser acceleration",
          },
          {
            icon: Cpu,
            title: "Zero UI Lag",
            desc: "Pure client-side pipeline",
          },
          {
            icon: FileCheck,
            title: "Zero Watermarks",
            desc: "Clean studio output",
          },
        ].map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.title}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-center hover:bg-white/[0.04] transition-colors"
            >
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-indigo-300">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <h4 className="mt-2.5 text-xs font-bold text-white">{badge.title}</h4>
              <p className="mt-0.5 text-[11px] text-slate-500">{badge.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
