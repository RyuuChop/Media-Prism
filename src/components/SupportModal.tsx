import { useState } from "react";
import {
  Heart,
  Sparkles,
  X,
  ExternalLink,
  Check,
} from "lucide-react";

export const SOCIAL_LINKS = [
  {
    name: "YouTube",
    handle: "@X_RYUUCHOP_X",
    url: "https://youtube.com/@X_RYUUCHOP_X",
    color: "from-red-500/20 to-rose-600/20 border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: () => (
      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    handle: "x_ryuuchop_x",
    url: "https://tiktok.com/@x_ryuuchop_x",
    color: "from-cyan-500/20 to-fuchsia-500/20 border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300 hover:text-cyan-200",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    icon: () => (
      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    handle: "X_RyuuChop_X",
    url: "https://instagram.com/X_RyuuChop_X",
    color: "from-pink-500/20 to-purple-600/20 border-pink-500/30 hover:border-pink-500/60 text-pink-400 hover:text-pink-300",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    icon: () => (
      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

export default function SupportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [visited, setVisited] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleLinkClick = (name: string) => {
    setVisited((prev) => ({ ...prev, [name]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="animate-fade-up relative w-full max-w-lg overflow-hidden rounded-[28px] border border-indigo-400/30 bg-[#0b0e1c] p-6 sm:p-8 shadow-[0_0_80px_-15px_rgba(99,102,241,0.5)] z-10">
        {/* Glow ambient backdrops */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-fuchsia-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-indigo-600/30 blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header content */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-500 opacity-60 blur-lg" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-950/60">
              <Heart className="h-7 w-7 text-white fill-white/80 animate-pulse" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-pink-400/30 bg-pink-500/15 px-3 py-1 text-[11px] font-bold tracking-wide text-pink-300">
            <Sparkles className="h-3.5 w-3.5" />
            Creator Support
          </div>

          <h3 className="mt-3 text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Thank you for using <span className="text-gradient">MediaForge!</span>
          </h3>

          <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-md">
            If you want to support this little creator, you can follow me on my accounts!
          </p>
        </div>

        {/* Social Accounts Grid */}
        <div className="mt-6 space-y-3">
          {SOCIAL_LINKS.map((s) => {
            const Icon = s.icon;
            const isDone = visited[s.name];

            return (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(s.name)}
                className={`group relative flex items-center justify-between overflow-hidden rounded-2xl border bg-gradient-to-r p-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] ${s.color}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 shadow-inner group-hover:scale-110 transition-transform">
                    <Icon />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">
                        {s.name}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.badgeColor}`}
                      >
                        Follow
                      </span>
                    </div>
                    <p className="truncate font-mono text-xs text-slate-300 mt-0.5">
                      {s.handle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold shrink-0 pl-2">
                  {isDone ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-mono text-xs">
                      <Check className="h-4 w-4" /> Visited
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <span>Visit</span>
                      <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/60 transition-all hover:brightness-110 hover:shadow-indigo-500/30 active:scale-[0.98]"
          >
            Continue to Download / App
          </button>
        </div>

        <p className="mt-3.5 text-center text-[11px] text-slate-400">
          This message only appears once. Thank you for your support! ❤️
        </p>
      </div>
    </div>
  );
}
