/**
 * Dedicated conversion landing pages (e.g. /png-to-ico, /wav-to-mp3).
 *
 * Each route gets a statically generated page (scripts/generate-conversion-pages.mjs)
 * with its own title/description/canonical/structured data for search engines,
 * while the app itself uses the route to preselect the target format and show
 * a matching hero.
 */

export interface ConversionRoute {
  slug: string;
  from: string;
  to: string;
  kind: "image" | "audio";
  toFormat: string;
  title: string;
  description: string;
}

function makeRoute(from: string, to: string, kind: "image" | "audio"): ConversionRoute {
  return {
    slug: `${from}-to-${to}`.toLowerCase(),
    from,
    to,
    kind,
    toFormat: to.toLowerCase(),
    title: `${from} to ${to} Converter — Free, No Upload | MediaPrism`,
    description: `Convert ${from} to ${to} online for free. 100% in your browser — no uploads, no sign-up, no watermarks, no limits. Your files never leave your device.`,
  };
}

const IMAGE_PAIRS: Array<[string, string]> = [
  ["PNG", "JPG"],
  ["JPG", "PNG"],
  ["PNG", "WEBP"],
  ["WEBP", "PNG"],
  ["JPG", "WEBP"],
  ["WEBP", "JPG"],
  ["PNG", "ICO"],
  ["JPG", "ICO"],
  ["GIF", "PNG"],
  ["PNG", "GIF"],
  ["BMP", "PNG"],
  ["PNG", "BMP"],
  ["TIFF", "PNG"],
  ["PNG", "TIFF"],
];

const AUDIO_PAIRS: Array<[string, string]> = [
  ["WAV", "MP3"],
  ["MP3", "WAV"],
  ["M4A", "MP3"],
  ["MP3", "M4A"],
  ["OGG", "MP3"],
  ["MP3", "OGG"],
  ["FLAC", "MP3"],
  ["WAV", "FLAC"],
  ["MP3", "FLAC"],
  ["WAV", "M4A"],
  ["M4A", "WAV"],
  ["AAC", "MP3"],
  ["OGG", "WAV"],
  ["WAV", "OGG"],
];

export const IMAGE_ROUTES: ConversionRoute[] = IMAGE_PAIRS.map(([f, t]) =>
  makeRoute(f, t, "image"),
);
export const AUDIO_ROUTES: ConversionRoute[] = AUDIO_PAIRS.map(([f, t]) =>
  makeRoute(f, t, "audio"),
);
export const CONVERSION_ROUTES: ConversionRoute[] = [...IMAGE_ROUTES, ...AUDIO_ROUTES];

const ROUTE_BY_SLUG = new Map(CONVERSION_ROUTES.map((r) => [r.slug, r]));

/** Match a pathname like "/png-to-ico/" to its route (null = homepage). */
export function getRouteFromPath(pathname: string): ConversionRoute | null {
  const clean = pathname.replace(/\/+$/, "").replace(/^\/+/, "");
  if (!clean || clean.includes("/")) return null;
  return ROUTE_BY_SLUG.get(clean.toLowerCase()) ?? null;
}
