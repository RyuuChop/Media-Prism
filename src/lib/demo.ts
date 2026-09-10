import { audioBufferToWavBlob } from "./audioEngine";

/**
 * Generates a pleasant, melodic 4-second audio track in the browser using OfflineAudioContext.
 * Zero assets/network required — synthesizes chords, arpeggios, and soft percussion.
 */
export async function generateDemoAudio(): Promise<File> {
  const sampleRate = 44100;
  const duration = 4.0;
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  // Master Gain
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.7, 0);
  master.connect(ctx.destination);

  // Notes frequencies (C major 7th / F maj9 arpeggios)
  const notes = [
    { freq: 261.63, time: 0.0, dur: 1.2 },  // C4
    { freq: 329.63, time: 0.3, dur: 1.2 },  // E4
    { freq: 392.00, time: 0.6, dur: 1.2 },  // G4
    { freq: 493.88, time: 0.9, dur: 1.5 },  // B4
    { freq: 523.25, time: 1.4, dur: 1.8 },  // C5
    { freq: 440.00, time: 2.0, dur: 1.4 },  // A4
    { freq: 349.23, time: 2.4, dur: 1.4 },  // F4
    { freq: 392.00, time: 2.8, dur: 1.6 },  // G4
    { freq: 523.25, time: 3.2, dur: 0.8 },  // C5
  ];

  notes.forEach(({ freq, time, dur }) => {
    // Oscillator 1 (Warm Triangle)
    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(freq, time);

    // Oscillator 2 (Soft Sine sub)
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 0.5, time);

    // Envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.35, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    // Panning for wide stereo sound
    const pan = ctx.createStereoPanner();
    pan.pan.setValueAtTime((Math.random() - 0.5) * 0.7, time);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(pan);
    pan.connect(master);

    osc1.start(time);
    osc1.stop(time + dur);
    osc2.start(time);
    osc2.stop(time + dur);
  });

  // Render synthesized audio buffer
  const renderedBuffer = await ctx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer, sampleRate, 2);

  return new File([wavBlob], "mediaforge-melody-sample.wav", { type: "audio/wav" });
}

/**
 * Generates a high-res sample graphic with transparent alpha channels,
 * rich gradient artwork, shapes, and crisp typography.
 */
export async function generateDemoImage(): Promise<File> {
  const width = 1200;
  const height = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Clear transparent background
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  // Outer glowing aura
  const aura = ctx.createRadialGradient(cx, cy, 100, cx, cy, 540);
  aura.addColorStop(0, "rgba(99, 102, 241, 0.45)");
  aura.addColorStop(0.5, "rgba(217, 70, 239, 0.25)");
  aura.addColorStop(1, "rgba(99, 102, 241, 0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, 540, 0, Math.PI * 2);
  ctx.fill();

  // Glassmorphic rounded hexagon / badge
  const radius = 340;
  ctx.save();
  ctx.translate(cx, cy);

  // Soft badge shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;

  const bgGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
  bgGrad.addColorStop(0, "rgba(30, 27, 75, 0.95)");
  bgGrad.addColorStop(0.5, "rgba(88, 28, 135, 0.92)");
  bgGrad.addColorStop(1, "rgba(15, 23, 42, 0.96)");
  ctx.fillStyle = bgGrad;

  // Draw rounded super-ellipse
  ctx.beginPath();
  ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 80);
  ctx.fill();

  // Badge border ring
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const borderGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
  borderGrad.addColorStop(0, "rgba(165, 180, 252, 0.8)");
  borderGrad.addColorStop(0.5, "rgba(244, 114, 182, 0.6)");
  borderGrad.addColorStop(1, "rgba(129, 140, 248, 0.4)");
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 10;
  ctx.stroke();

  // Floating spheres
  const iconGrad = ctx.createLinearGradient(-120, -120, 120, 120);
  iconGrad.addColorStop(0, "#818cf8");
  iconGrad.addColorStop(0.5, "#c084fc");
  iconGrad.addColorStop(1, "#f472b6");
  ctx.fillStyle = iconGrad;

  ctx.beginPath();
  ctx.arc(-140, -110, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(150, -80, 45, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(232, 121, 249, 0.85)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-120, 130, 40, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(99, 102, 241, 0.8)";
  ctx.fill();

  // Center glowing orb
  const orbGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 130);
  orbGrad.addColorStop(0, "#ffffff");
  orbGrad.addColorStop(0.25, "#818cf8");
  orbGrad.addColorStop(0.7, "#d946ef");
  orbGrad.addColorStop(1, "#4338ca");
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(0, -10, 110, 0, Math.PI * 2);
  ctx.fill();

  // Star spark in center
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, -10, 24, 0, Math.PI * 2);
  ctx.fill();

  // Typography
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 64px Inter, system-ui, sans-serif";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 20;
  ctx.fillText("MEDIAFORGE", 0, 175);

  ctx.shadowBlur = 0;
  ctx.font = "600 24px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(226, 232, 240, 0.8)";
  ctx.fillText("TRANSPARENT SAMPLE ASSET", 0, 218);

  ctx.font = "500 18px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(165, 180, 252, 0.9)";
  ctx.fillText("PNG · Alpha Transparency · 1200×1200", 0, 254);

  ctx.restore();

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), "image/png");
  });

  return new File([blob], "mediaforge-badge-sample.png", { type: "image/png" });
}
