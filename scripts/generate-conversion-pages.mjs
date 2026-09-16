/**
 * Post-build step: generates a dedicated landing page for every conversion
 * route (e.g. /png-to-ico) from the built single-file index.html.
 *
 * Each generated page gets:
 *  - unique <title>, meta description, canonical URL
 *  - unique Open Graph + Twitter card tags
 *  - unique JSON-LD structured data
 *  - static pre-render fallback content inside #root (visible to crawlers
 *    that don't run JavaScript; replaced by the app once it mounts)
 *
 * Also rewrites dist/sitemap.xml with every page URL.
 *
 * Netlify serves dist/<slug>/index.html for /<slug> automatically, and
 * public/_redirects falls back everything else to the app.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");
const SITE = "https://media-prism.netlify.app";

/* Route list — kept in sync with src/lib/routes.ts */
const IMAGE_PAIRS = [
  ["PNG", "JPG"], ["JPG", "PNG"], ["PNG", "WEBP"], ["WEBP", "PNG"],
  ["JPG", "WEBP"], ["WEBP", "JPG"], ["PNG", "ICO"], ["JPG", "ICO"],
  ["GIF", "PNG"], ["PNG", "GIF"], ["BMP", "PNG"], ["PNG", "BMP"],
  ["TIFF", "PNG"], ["PNG", "TIFF"],
];
const AUDIO_PAIRS = [
  ["WAV", "MP3"], ["MP3", "WAV"], ["M4A", "MP3"], ["MP3", "M4A"],
  ["OGG", "MP3"], ["MP3", "OGG"], ["FLAC", "MP3"], ["WAV", "FLAC"],
  ["MP3", "FLAC"], ["WAV", "M4A"], ["M4A", "WAV"], ["AAC", "MP3"],
  ["OGG", "WAV"], ["WAV", "OGG"],
];
const ROUTES = [...IMAGE_PAIRS, ...AUDIO_PAIRS].map(([from, to]) => ({
  slug: `${from}-to-${to}`.toLowerCase(),
  from,
  to,
  title: `${from} to ${to} Converter — Free, No Upload | MediaPrism`,
  description: `Convert ${from} to ${to} online for free. 100% in your browser — no uploads, no sign-up, no watermarks, no limits. Your files never leave your device.`,
}));

const baseHtml = readFileSync(join(DIST, "index.html"), "utf8");

/* ---- static fallback injected into #root (replaced by React on mount) ---- */
function fallbackHtml(route) {
  return (
    `<div id="root"><div style="min-height:100vh;background:#04050c;color:#e2e8f0;` +
    `font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:48px 24px">` +
    `<div style="max-width:640px;text-align:center">` +
    `<h1 style="font-size:34px;margin:0 0 16px">${route.from} to ${route.to} Converter</h1>` +
    `<p style="color:#94a3b8;line-height:1.65;margin:0 0 12px">${route.description}</p>` +
    `<p style="color:#64748b;font-size:14px;margin:0">Loading MediaPrism… (requires JavaScript)</p>` +
    `</div></div></div>`
  );
}

function generatePage(route) {
  const url = `${SITE}/${route.slug}/`;
  let html = baseHtml;

  // Absolute asset paths (the build emits "./icon.png", which breaks in subfolders)
  html = html.replaceAll('href="./', 'href="/').replaceAll('src="./', 'src="/');

  const replacements = [
    [`<title>MediaPrism — Free Image & Audio Converter, 100% Private</title>`, `<title>${route.title}</title>`],
    [`content="Convert PNG, JPG, WEBP, ICO, GIF, BMP, SVG, TIFF images and MP3, WAV, AAC, OGG, M4A, FLAC audio — free, no upload, no sign-up, no limits. 100% in-browser processing keeps your files private."`, `content="${route.description}"`],
    [`<link rel="canonical" href="${SITE}/" />`, `<link rel="canonical" href="${url}" />`],
    [`content="MediaPrism — One file in, every format out"`, `content="${route.from} to ${route.to} Converter — Free, Private"`],
    [`content="Free in-browser image & audio converter. No uploads — your files never leave your device. No limits, no sign-up, works offline."`, `content="${route.description}"`],
    [`content="Free in-browser image & audio converter. No uploads, no limits, works offline."`, `content="${route.description}"`],
    [`content="${SITE}/"`, `content="${url}"`],
    [`"name": "MediaPrism",`, `"name": "${route.from} to ${route.to} Converter | MediaPrism",`],
    [`"url": "${SITE}/",`, `"url": "${url}",`],
    [`"description": "Free online image and audio converter that runs 100% in your browser. Convert PNG, JPG, WEBP, ICO, GIF, BMP, SVG, TIFF, MP3, WAV, AAC, OGG, M4A and FLAC without uploading files anywhere.",`, `"description": "${route.description}",`],
    [`<div id="root"></div>`, fallbackHtml(route)],
  ];

  for (const [find, replace] of replacements) {
    if (!html.includes(find)) {
      console.warn(`  ⚠️ could not find: ${find.slice(0, 60)}…`);
      continue;
    }
    html = html.split(find).join(replace);
  }

  const outDir = join(DIST, route.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
}

/* ---- sitemap with every page ---- */
function generateSitemap() {
  const urls = [
    `${SITE}/`,
    ...ROUTES.map((r) => `${SITE}/${r.slug}/`),
  ];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${u === `${SITE}/` ? "1.0" : "0.8"}</priority>\n  </url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;
  writeFileSync(join(DIST, "sitemap.xml"), xml);
}

for (const route of ROUTES) generatePage(route);
generateSitemap();
console.log(`✅ Generated ${ROUTES.length} conversion pages + sitemap (${ROUTES.length + 1} URLs)`);
