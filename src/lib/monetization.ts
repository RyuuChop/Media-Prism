/* ────────────────────────────────────────────────────────────────
   MediaPrism monetization config — THIS IS THE ONLY FILE YOU EDIT
   ────────────────────────────────────────────────────────────────

   ⚠️ PAKISTAN REALITY CHECK (why some fields are empty):

   • PayPal      — does NOT operate in Pakistan. Keep "".
   • Stripe      — does NOT support Pakistan payouts. Keep "".
   • Ko-fi       — pays out ONLY through PayPal/Stripe → dead end in
                   Pakistan. Keep "".
   • BuyMeaCoffee— Stripe payouts only → dead end in Pakistan. Keep "".

   ✅ WHAT ACTUALLY WORKS IN PAKISTAN:

   • Patreon     — pays out via Payoneer, which fully supports Pakistan.
                   Create a page at https://patreon.com (free), set a $1
                   tier, and paste your page URL below.
   • Payoneer    — the standard for Pakistani creators/freelancers.
                   Sign up with just your ID (no bank needed to start);
                   withdraw to any Pakistani bank (1–3 days) or to a
                   JazzCash mobile wallet (instant, ~PKR 50k/day limit).
   • AdSense     — pays to Pakistani banks via international wire
                   transfer once you reach the $100 threshold.
   ──────────────────────────────────────────────────────────────── */

export const SUPPORT_LINKS = {
  /** Ko-fi URL — dead end in Pakistan (PayPal/Stripe payouts). Keep "". */
  kofi: "",
  /** Patreon page URL — the recommended tip/support link for Pakistan.
   *  e.g. "https://www.patreon.com/yourname" */
  patreon: "", // TODO: create your page at patreon.com and paste the URL
  /** Buy Me a Coffee URL — Stripe only (no Pakistan). Keep "". */
  buymeacoffee: "",
  /** PayPal.me link — PayPal doesn't operate in Pakistan. Keep "". */
  paypal: "",
};

/** First configured tip link — used for the footer Tip button. */
export function getPrimaryTipLink(): string | null {
  const { kofi, patreon, buymeacoffee, paypal } = SUPPORT_LINKS;
  return kofi || patreon || buymeacoffee || paypal || null;
}

export const ADS = {
  /** Google AdSense publisher ID, e.g. "ca-pub-1234567890123456".
   *  Keep "" to keep ads completely disabled. AdSense DOES support
   *  Pakistan (wire-transfer payouts to local banks, $100 threshold). */
  adsenseClientId: "",
  /** Ad unit IDs from your AdSense dashboard (one per placement). */
  slots: {
    /** Wide responsive banner under the upload zone */
    leaderboard: "0000000000",
    /** Rectangle in the settings column of the workstation */
    sidebar: "0000000000",
  },
};
