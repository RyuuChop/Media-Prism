import { ArrowRight } from "lucide-react";
import { AUDIO_ROUTES, IMAGE_ROUTES } from "../lib/routes";

function LinkGroup({ title, routes }: { title: string; routes: typeof IMAGE_ROUTES }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {routes.map((r) => (
          <a
            key={r.slug}
            href={`/${r.slug}`}
            className="group flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] font-semibold text-slate-300 transition-all hover:border-indigo-400/50 hover:bg-indigo-500/15 hover:text-white"
          >
            {r.from}
            <ArrowRight className="h-3 w-3 text-indigo-400 transition-transform group-hover:translate-x-0.5" />
            {r.to}
          </a>
        ))}
      </div>
    </div>
  );
}

/** Internal links to every dedicated conversion page (also helps search crawlers). */
export default function ConversionLinks() {
  return (
    <section className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-sm font-semibold text-white">Popular Conversions</h2>
      <p className="mt-1 text-xs text-slate-500">
        Jump straight to the conversion you need:
      </p>
      <div className="mt-5 space-y-5">
        <LinkGroup title="Image" routes={IMAGE_ROUTES} />
        <LinkGroup title="Audio" routes={AUDIO_ROUTES} />
      </div>
    </section>
  );
}
