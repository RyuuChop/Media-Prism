# MediaPrism 🌈

**One file in. Every format out.**

A 100% in-browser media converter — no uploads, no servers, no limits. Installable
as an app (PWA) and works fully offline.

## Features

- **Images:** PNG, JPG, WEBP, ICO, GIF, BMP, SVG, TIFF, JPE
- **Audio:** MP3, WAV, AAC, OGG, M4A, FLAC
- **Batch conversion** — select multiple files of one type, convert together, download as ZIP
- **Crop, rotate & flip** — visual crop editor with aspect-ratio locks
- **Fit modes** — Fit (letterbox), Fill (cover-crop), Stretch
- **Target file size** — auto-tune quality to land under a size limit (JPG/WEBP)
- **One-click presets** — Favicon Pack, Web Hero, Social Square, Discord Emoji, Ringtone, Podcast…
- **Audio trimmer** — cut start/end with smooth cosine fade-in/fade-out
- **Loudness** — peak normalization + manual gain (±12 dB)
- **PWA** — install on desktop/mobile, works offline via service worker

Everything runs locally using HTML5 Canvas, the Web Audio API, and custom binary
encoders — your files never leave your device.

## 💰 Monetization setup

Everything is controlled from **one file: `src/lib/monetization.ts`**.

### Donations (works at any traffic level)

1. Create a free page at [ko-fi.com](https://ko-fi.com) (~2 minutes, email + PayPal)
2. Paste your page URL into `SUPPORT_LINKS.kofi`
3. Optionally add `buymeacoffee` / `paypal` links (leave `""` to hide)
4. Rebuild & redeploy

The tip buttons appear in the Support modal and a small ☕ Tip link appears in
the footer.

### Ads (enable after AdSense approval)

1. Deploy the site, then apply at [adsense.google.com](https://adsense.google.com)
   with your live URL (approval takes days–weeks and needs some real traffic)
2. When approved, copy your publisher ID (`ca-pub-…`) and create two display ad
   units; copy their slot IDs
3. Paste them into `ADS.adsenseClientId` and `ADS.slots.*` in `src/lib/monetization.ts`
4. Rebuild & redeploy

While `adsenseClientId` is empty, **no ad code loads at all** — zero scripts,
zero requests, zero layout impact. Two tasteful slots exist: a leaderboard
under the upload zone and a rectangle in the settings column (never mid-workflow).

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
```
