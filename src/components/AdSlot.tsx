import { useEffect } from "react";
import { ADS } from "../lib/monetization";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let scriptInjected = false;

/** Injects the AdSense loader once, only when ads are enabled. */
function injectAdSenseScript(clientId: string) {
  if (scriptInjected) return;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  document.head.appendChild(s);
  scriptInjected = true;
}

/**
 * Tasteful, dormant-until-enabled ad slot.
 *
 * While ADS.adsenseClientId is "" (see src/lib/monetization.ts) this
 * renders NOTHING: no script loads, no layout shift, no visual
 * footprint — the app stays exactly as clean as it is today.
 *
 * Once the publisher ID is set, it mounts a responsive AdSense unit
 * inside a subtle labelled container. Placements were chosen to never
 * interrupt the convert workflow.
 */
export default function AdSlot({
  slotId,
  label = "Advertisement",
  className = "",
}: {
  slotId: string;
  label?: string;
  className?: string;
}) {
  useEffect(() => {
    if (!ADS.adsenseClientId) return;
    injectAdSenseScript(ADS.adsenseClientId);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ad blocker or script not ready — ignore silently */
    }
  }, []);

  if (!ADS.adsenseClientId) return null;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] ${className}`}
      role="complementary"
      aria-label={label}
    >
      <p className="px-3 pt-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
        {label}
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADS.adsenseClientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
