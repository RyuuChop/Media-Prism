import { useEffect, useRef } from "react";

/**
 * Live spectrum visualizer for audio previews using the Web Audio API.
 * Falls back to an idle animated waveform if AudioContext is unavailable.
 */
export default function AudioVisualizer({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let data: Uint8Array<ArrayBuffer> | null = null;
    let raf = 0;

    const setup = () => {
      try {
        const AC =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctx = new AC();
        source = ctx.createMediaElementSource(audio);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.82;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        data = new Uint8Array(analyser.frequencyBinCount);
      } catch {
        ctx = null;
        analyser = null;
        data = null;
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const g = canvas.getContext("2d");
      if (!g) return;
      const w = canvas.width;
      const h = canvas.height;
      g.clearRect(0, 0, w, h);

      if (analyser && data) analyser.getByteFrequencyData(data);

      const bars = 48;
      const gap = Math.max(2, Math.round(w / bars / 12));
      const bw = (w - gap * (bars - 1)) / bars;
      const grad = g.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0, "#6366f1");
      grad.addColorStop(0.6, "#a855f7");
      grad.addColorStop(1, "#e879f9");

      const barRect = (x: number, y: number, bw2: number, bh: number) => {
        if (typeof g.roundRect === "function") {
          g.beginPath();
          g.roundRect(x, y, bw2, bh, Math.min(bw2 / 2, 4));
          g.fill();
        } else {
          g.fillRect(x, y, bw2, bh);
        }
      };

      const now = performance.now();
      const isPlaying = playingRef.current;
      for (let i = 0; i < bars; i++) {
        let v = 0;
        if (analyser && data) {
          const idx = Math.min(
            data.length - 1,
            Math.floor(Math.pow(i / bars, 1.7) * data.length),
          );
          v = data[idx] / 255;
        } else if (isPlaying) {
          v = 0.18 + 0.5 * Math.abs(Math.sin(i * 0.45 + now / 260));
        } else {
          v = 0.07;
        }
        const bh = Math.max(3, v * h * 0.94);
        g.globalAlpha = 0.3 + v * 0.7;
        g.fillStyle = grad;
        barRect(i * (bw + gap), h - bh, bw, bh);
      }
      g.globalAlpha = 1;
    };
    draw();

    const onPlay = () => {
      playingRef.current = true;
      ctx?.resume().catch(() => undefined);
    };
    const onPause = () => {
      playingRef.current = false;
    };
    const onEnded = () => {
      playingRef.current = false;
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    setup();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      try {
        source?.disconnect();
      } catch {
        /* noop */
      }
      try {
        ctx?.close();
      } catch {
        /* noop */
      }
    };
  }, [url]);

  return (
    <div className="flex flex-col gap-3">
      <canvas ref={canvasRef} className="h-36 w-full" />
      <audio ref={audioRef} src={url} controls className="h-10 w-full" preload="metadata" />
    </div>
  );
}
