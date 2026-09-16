import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  MediaPrism ambient background                                      */
/*                                                                     */
/*  A lightweight canvas scene that echoes the brand:                  */
/*   • glass prisms slowly rotating, one white beam entering and       */
/*     fanning out into the brand rainbow (indigo / white / pink)     */
/*   • drifting "photon" particles in the brand palette                */
/*   • occasional light streaks sweeping across the viewport           */
/*                                                                     */
/*  Runs on a single requestAnimationFrame loop, caps device pixel     */
/*  ratio at 2, scales particle count to viewport area, and renders    */
/*  a single static frame when the user prefers reduced motion.        */
/* ------------------------------------------------------------------ */

type Photon = {
  x: number;
  y: number;
  radius: number;
  glow: number;
  vx: number;
  vy: number;
  color: string;
  baseAlpha: number;
  phase: number;
  twinkleSpeed: number;
  wobbleAmp: number;
  wobbleSpeed: number;
};

type Streak = {
  x: number;
  y: number;
  length: number;
  angle: number;
  speed: number;
  width: number;
  color: string;
  baseAlpha: number;
  life: number;
  maxLife: number;
};

type Prism = {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  driftAmp: number;
  driftSpeed: number;
  driftPhase: number;
  beamLengths: [number, number, number];
};

const PHOTON_COLORS = [
  "129,140,248", // indigo
  "167,139,250", // violet
  "217,70,239", // fuchsia
  "245,208,254", // pink
  "34,211,238", // cyan
  "255,255,255", // white
];

/* Same trio as the header logo: indigo, white, pink */
const BEAM_COLORS = ["129,140,248", "255,255,255", "245,208,254"];

const TAU = Math.PI * 2;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function spawnPhoton(width: number, height: number, anywhere: boolean): Photon {
  return {
    x: rand(0, width),
    y: anywhere ? rand(0, height) : height + 24,
    radius: rand(0.8, 2.4),
    glow: rand(4, 11),
    vx: rand(2, 11),
    vy: -rand(4, 15),
    color: PHOTON_COLORS[Math.floor(Math.random() * PHOTON_COLORS.length)],
    baseAlpha: rand(0.22, 0.62),
    phase: rand(0, TAU),
    twinkleSpeed: rand(0.6, 2.2),
    wobbleAmp: rand(6, 26),
    wobbleSpeed: rand(0.15, 0.6),
  };
}

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let raf = 0;
    let lastTime = performance.now();
    let nextStreakAt = 2.5;

    let photons: Photon[] = [];
    let prisms: Prism[] = [];
    let streaks: Streak[] = [];

    /* ---------------- scene construction ---------------- */

    const buildScene = () => {
      const scale = Math.max(0.55, Math.min(1, width / 1440));

      const count = Math.round(Math.min(110, (width * height) / 16000));
      photons = Array.from({ length: count }, () =>
        spawnPhoton(width, height, true),
      );

      prisms = [
        {
          x: width * 0.14,
          y: height * 0.22,
          size: 115 * scale,
          rotation: rand(0, TAU),
          rotSpeed: 0.05,
          driftAmp: 26,
          driftSpeed: 0.13,
          driftPhase: rand(0, TAU),
          beamLengths: [1.9, 2.4, 1.7],
        },
        {
          x: width * 0.86,
          y: height * 0.56,
          size: 155 * scale,
          rotation: rand(0, TAU),
          rotSpeed: -0.035,
          driftAmp: 34,
          driftSpeed: 0.1,
          driftPhase: rand(0, TAU),
          beamLengths: [2.1, 2.6, 1.9],
        },
        {
          x: width * 0.3,
          y: height * 0.9,
          size: 92 * scale,
          rotation: rand(0, TAU),
          rotSpeed: 0.045,
          driftAmp: 22,
          driftSpeed: 0.16,
          driftPhase: rand(0, TAU),
          beamLengths: [1.8, 2.2, 1.6],
        },
      ];
    };

    /* ---------------- drawing helpers ---------------- */

    const drawPrism = (p: Prism, t: number) => {
      const cx = p.x + Math.sin(t * p.driftSpeed + p.driftPhase) * p.driftAmp;
      const cy =
        p.y + Math.cos(t * p.driftSpeed * 0.8 + p.driftPhase) * p.driftAmp * 0.7;
      const rot = p.rotation + t * p.rotSpeed;
      const pulse = 0.8 + 0.2 * Math.sin(t * 0.5 + p.driftPhase);

      /* Equilateral triangle vertices */
      const vx: number[] = [];
      const vy: number[] = [];
      for (let i = 0; i < 3; i++) {
        const theta = rot - Math.PI / 2 + (i * TAU) / 3;
        vx.push(cx + p.size * Math.cos(theta));
        vy.push(cy + p.size * Math.sin(theta));
      }

      /* Glass body */
      ctx.beginPath();
      ctx.moveTo(vx[0], vy[0]);
      ctx.lineTo(vx[1], vy[1]);
      ctx.lineTo(vx[2], vy[2]);
      ctx.closePath();
      ctx.fillStyle = "rgba(129,140,248,0.05)";
      ctx.fill();
      ctx.strokeStyle = `rgba(199,210,254,${0.2 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* Midpoint of the upper-right edge — where light exits */
      const ex = (vx[0] + vx[2]) / 2;
      const ey = (vy[0] + vy[2]) / 2;

      /* One white beam entering from the left face */
      const mx = (vx[0] + vx[1]) / 2;
      const my = (vy[0] + vy[1]) / 2;
      const inLen = p.size * 1.5;
      const inEndX = mx - Math.cos(rot) * inLen;
      const inEndY = my - Math.sin(rot) * inLen;
      const inGrad = ctx.createLinearGradient(inEndX, inEndY, mx, my);
      inGrad.addColorStop(0, "rgba(255,255,255,0)");
      inGrad.addColorStop(1, `rgba(255,255,255,${0.08 * pulse})`);
      ctx.strokeStyle = inGrad;
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(inEndX, inEndY);
      ctx.lineTo(mx, my);
      ctx.stroke();

      /* The refracted fan — same trio as the logo */
      const fanAngles = [rot - 0.3, rot, rot + 0.3];
      for (let i = 0; i < 3; i++) {
        const a = fanAngles[i];
        const len = p.size * p.beamLengths[i];
        const bx = ex + Math.cos(a) * len;
        const by = ey + Math.sin(a) * len;
        const alpha = (0.1 + 0.05 * Math.sin(t * 0.8 + i * 1.7)) * pulse;

        const grad = ctx.createLinearGradient(ex, ey, bx, by);
        grad.addColorStop(0, `rgba(${BEAM_COLORS[i]},${alpha})`);
        grad.addColorStop(1, `rgba(${BEAM_COLORS[i]},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      /* Soft glow at the exit point */
      const glowR = p.size * 0.09;
      const glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, glowR);
      glow.addColorStop(0, `rgba(255,255,255,${0.22 * pulse})`);
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ex, ey, glowR, 0, TAU);
      ctx.fill();
    };

    const drawPhoton = (p: Photon, t: number) => {
      const alpha =
        p.baseAlpha * (0.55 + 0.45 * Math.sin(t * p.twinkleSpeed + p.phase));
      const x = p.x + Math.sin(t * p.wobbleSpeed + p.phase) * p.wobbleAmp;

      ctx.fillStyle = `rgba(${p.color},${alpha * 0.16})`;
      ctx.beginPath();
      ctx.arc(x, p.y, p.glow, 0, TAU);
      ctx.fill();

      ctx.fillStyle = `rgba(${p.color},${alpha})`;
      ctx.beginPath();
      ctx.arc(x, p.y, p.radius, 0, TAU);
      ctx.fill();
    };

    const drawStreak = (s: Streak) => {
      const progress = s.life / s.maxLife;
      const envelope = Math.min(
        1,
        progress / 0.12,
        (1 - progress) / 0.3,
      );
      const alpha = Math.max(0, Math.min(1, envelope)) * s.baseAlpha;
      if (alpha <= 0.004) return;

      const dx = Math.cos(s.angle);
      const dy = Math.sin(s.angle);
      const tailX = s.x - dx * s.length;
      const tailY = s.y - dy * s.length;

      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, `rgba(${s.color},0)`);
      grad.addColorStop(1, `rgba(${s.color},${alpha})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = s.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    };

    /* ---------------- simulation ---------------- */

    const updatePhotons = (dt: number) => {
      for (const p of photons) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y < -24 || p.x > width + 24) {
          const fresh = spawnPhoton(width, height, false);
          Object.assign(p, fresh, { y: rand(0, height) + height * 0.1 });
        }
      }
    };

    const spawnStreak = () => {
      const angle = rand(0.3, 0.55);
      const speed = rand(130, 230);
      const startX = -80;
      const startY = rand(height * 0.05, height * 0.8);
      const travel = (width + 260) / (speed * Math.cos(angle));
      streaks.push({
        x: startX,
        y: startY,
        length: rand(180, 420),
        angle,
        speed,
        width: rand(1, 2),
        color:
          Math.random() < 0.3
            ? "34,211,238"
            : BEAM_COLORS[Math.floor(Math.random() * BEAM_COLORS.length)],
        baseAlpha: rand(0.1, 0.2),
        life: 0,
        maxLife: travel,
      });
    };

    const updateStreaks = (dt: number, t: number) => {
      if (t > nextStreakAt && streaks.length < 3) {
        spawnStreak();
        nextStreakAt = t + rand(4, 9);
      }
      for (const s of streaks) {
        s.life += dt;
        s.x += Math.cos(s.angle) * s.speed * dt;
        s.y += Math.sin(s.angle) * s.speed * dt;
      }
      streaks = streaks.filter((s) => s.life < s.maxLife);
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const prism of prisms) drawPrism(prism, t);
      for (const streak of streaks) drawStreak(streak);
      for (const photon of photons) drawPhoton(photon, t);
    };

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = now / 1000;

      updatePhotons(dt);
      updateStreaks(dt, t);
      render(t);

      raf = requestAnimationFrame(frame);
    };

    /* ---------------- lifecycle ---------------- */

    const resize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      const widthChanged = newWidth !== width;
      const heightChanged = Math.abs(newHeight - height) > 140;

      width = newWidth;
      height = newHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (widthChanged || heightChanged) {
        buildScene();
        if (reducedMotion) render(0);
      }
    };

    buildScene();
    resize();

    if (reducedMotion) {
      render(0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#04050c]" />
      <div className="animate-grid-pan bg-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black_30%,transparent_78%)]" />
      <div className="animate-float-slow absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-indigo-600/25 blur-[130px]" />
      <div className="animate-float-slower absolute -right-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/20 blur-[130px]" />
      <div className="animate-float-slow absolute -bottom-48 left-1/3 h-[32rem] w-[32rem] rounded-full bg-cyan-500/15 blur-[130px]" />

      {/* Animated prism scene */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(2,4,12,0.75))]" />
    </div>
  );
}
