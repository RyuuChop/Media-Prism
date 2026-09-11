/* ────────────────────────────────────────────────────────────────
   MediaPrism monetization config — THIS IS THE ONLY FILE YOU EDIT
   ────────────────────────────────────────────────────────────────

   1) DONATIONS (works today, even with zero visitors)
      • Create a free page at https://ko-fi.com — takes ~2 minutes
        (just an email + PayPal account).
      • Optionally also https://buymeacoffee.com and https://paypal.me
      • Paste your links below. Any link left as "" stays hidden.

   2) ADS (enable AFTER Google AdSense approves your site)
      • Apply at https://adsense.google.com with your live site URL.
        Approval usually takes days–weeks and needs real traffic.
      • When approved, AdSense gives you:
          – a publisher ID, like "ca-pub-1234567890123456"
          – ad unit IDs (numbers) for each placement you create
      • Paste the publisher ID + slot IDs below, rebuild and redeploy.
      • While adsenseClientId is "", NO ad script loads at all — the
        app stays 100% clean, fast and private.
   ──────────────────────────────────────────────────────────────── */

export const SUPPORT_LINKS = {
  /** Ko-fi URL — not set up (PayPal/Stripe payouts don't work in Pakistan). Keep "". */
  kofi: "",
  /** Patreon page URL — pays out via Payoneer (works in Pakistan). */
  patreon: "https://www.patreon.com/Mediaprism",
  /** Buy Me a Coffee URL — Stripe payouts only (no Pakistan). Keep "". */
  buymeacoffee: "",
  /** PayPal.me link — PayPal doesn't operate in Pakistan. Keep "". */
  paypal: "",
};

export const ADS = {
  /** Google AdSense publisher ID, e.g. "ca-pub-1234567890123456".
   *  Keep "" to keep ads completely disabled. */
  adsenseClientId: "",
  /** Ad unit IDs from your AdSense dashboard (one per placement). */
  slots: {
    /** Wide responsive banner under the upload zone */
    leaderboard: "0000000000",
    /** Rectangle in the settings column of the workstation */
    sidebar: "0000000000",
  },
};
