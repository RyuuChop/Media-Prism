import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { ToastItem } from "../types";
import { cn } from "../utils/cn";

const ICONS = {
  success: { icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-400/30" },
  error: { icon: AlertTriangle, cls: "bg-rose-500/15 text-rose-400 border-rose-400/30" },
  info: { icon: Info, cls: "bg-indigo-500/15 text-indigo-400 border-indigo-400/30" },
} as const;

export default function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
      {toasts.map((t) => {
        const cfg = ICONS[t.type];
        const Icon = cfg.icon;
        return (
          <div
            key={t.id}
            className="animate-toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0b0e1c]/90 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <div
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
                cfg.cls,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{t.title}</p>
              {t.message && <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{t.message}</p>}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
