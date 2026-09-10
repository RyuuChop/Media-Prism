import { useState } from "react";
import { Loader2, Music, Trash2, X } from "lucide-react";
import type { Asset } from "../types";
import { cn } from "../utils/cn";
import { formatBytes, formatDuration } from "../lib/format";

export default function FileQueue({
  assets,
  selectedId,
  onSelect,
  onRemove,
  onClear,
  busy,
}: {
  assets: Asset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  busy: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "image" | "audio">("all");

  const filteredAssets = assets.filter((a) => {
    if (filter === "all") return true;
    return a.kind === filter;
  });

  const counts = {
    all: assets.length,
    image: assets.filter((a) => a.kind === "image").length,
    audio: assets.filter((a) => a.kind === "audio").length,
  };

  return (
    <section className="glass p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Asset Library</h3>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
            {assets.length}
          </span>
        </div>

        {/* Filter Pills if multiple kinds exist */}
        {(counts.image > 0 || counts.audio > 0) && (
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-md px-2.5 py-1 font-semibold transition-colors",
                filter === "all" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-white",
              )}
            >
              All ({counts.all})
            </button>
            {counts.image > 0 && (
              <button
                type="button"
                onClick={() => setFilter("image")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-semibold transition-colors",
                  filter === "image" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-white",
                )}
              >
                Images ({counts.image})
              </button>
            )}
            {counts.audio > 0 && (
              <button
                type="button"
                onClick={() => setFilter("audio")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-semibold transition-colors",
                  filter === "audio" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-white",
                )}
              >
                Audio ({counts.audio})
              </button>
            )}
          </div>
        )}

        {assets.length > 1 && (
          <button
            onClick={onClear}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-rose-300 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {filteredAssets.map((a) => {
          const active = a.id === selectedId;
          return (
            <div
              key={a.id}
              role="button"
              tabIndex={0}
              onClick={() => !busy && onSelect(a.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!busy) onSelect(a.id);
                }
              }}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-xl border text-left transition-all duration-200",
                active
                  ? "border-indigo-400/70 bg-indigo-500/10 ring-2 ring-indigo-400/30"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
              )}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black/60 flex items-center justify-center">
                {a.kind === "image" ? (
                  <img
                    src={a.previewUrl || a.url}
                    alt={a.name}
                    className="h-full w-full object-cover bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)] bg-[length:16px_16px]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                      <Music className="h-5 w-5" />
                    </div>
                  </div>
                )}

                <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 backdrop-blur-sm">
                  {a.ext}
                </span>

                <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 backdrop-blur-sm">
                  {a.kind === "image"
                    ? a.width && a.height
                      ? `${a.width}×${a.height}`
                      : "Image"
                    : formatDuration(a.duration)}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(a.id);
                  }}
                  disabled={busy}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-slate-400 opacity-0 backdrop-blur-sm transition-all hover:bg-rose-500/80 hover:text-white focus:opacity-100 group-hover:opacity-100 disabled:opacity-0"
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {busy && a.id === selectedId && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-300" />
                  </div>
                )}
              </div>

              <div className="px-2.5 py-2">
                <p className="truncate text-xs font-semibold text-slate-200">{a.name}</p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                  {formatBytes(a.size)}
                  {a.width && a.height ? ` · ${a.width}×${a.height}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
