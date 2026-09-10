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

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
```
