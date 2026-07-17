'use client';

import { useEffect, useRef } from 'react';

/**
 * Renders the rich 3D background:
 * - Animated glowing orb / glass sphere (like the MotionSites gold orb)
 * - Camera lens aperture rings + rotating blades
 * - Floating dust motes
 * - Ambient colour wash
 * All drawn with rAF canvas — zero DOM overhead.
 */
export default function CinematicBackground({ variant = 'hero' }: { variant?: 'hero' | 'services' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Motes
    const makeMotes = () => Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.3,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.45 + 0.05,
      gold: Math.random() > 0.38,
    }));
    let motes = makeMotes();

    const draw = () => {
      t += 0.005;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = H * 0.46;

      // ── 1. Deep ambient gradient background ──────────────────────────────
      const bg = ctx.createRadialGradient(cx, cy * 0.7, 0, cx, cy, W * 0.9);
      bg.addColorStop(0,   'rgba(40, 20, 5, 0.85)');
      bg.addColorStop(0.3, 'rgba(15, 8, 2, 0.6)');
      bg.addColorStop(1,   'rgba(4,  3, 6, 0.0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── 2. The glowing orb / glass sphere ───────────────────────────────
      const orbR = Math.min(W, H) * (variant === 'hero' ? 0.32 : 0.28);
      const orbX = cx + Math.sin(t * 0.4) * orbR * 0.04;
      const orbY = cy + Math.cos(t * 0.3) * orbR * 0.03;

      // Outer glow halo
      const halo = ctx.createRadialGradient(orbX, orbY, orbR * 0.6, orbX, orbY, orbR * 2.2);
      halo.addColorStop(0,   'rgba(200,144,26,0.22)');
      halo.addColorStop(0.4, 'rgba(180,100,10,0.08)');
      halo.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Sphere base — dark glossy glass
      const sphere = ctx.createRadialGradient(
        orbX - orbR * 0.28, orbY - orbR * 0.28, orbR * 0.05,
        orbX, orbY, orbR
      );
      sphere.addColorStop(0,    'rgba(255,200,80,0.28)');
      sphere.addColorStop(0.18, 'rgba(200,130,30,0.18)');
      sphere.addColorStop(0.5,  'rgba(60,30,5,0.55)');
      sphere.addColorStop(0.82, 'rgba(10,6,2,0.82)');
      sphere.addColorStop(1,    'rgba(5,3,1,0.92)');
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
      ctx.fillStyle = sphere;
      ctx.fill();

      // Specular highlight (top-left)
      const spec = ctx.createRadialGradient(
        orbX - orbR * 0.3, orbY - orbR * 0.35, 0,
        orbX - orbR * 0.2, orbY - orbR * 0.2, orbR * 0.55
      );
      spec.addColorStop(0,   'rgba(255,230,150,0.55)');
      spec.addColorStop(0.4, 'rgba(220,160,60,0.18)');
      spec.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();

      // Bottom reflection (warm amber)
      const refl = ctx.createRadialGradient(
        orbX + orbR * 0.2, orbY + orbR * 0.55, 0,
        orbX, orbY + orbR * 0.5, orbR * 0.7
      );
      refl.addColorStop(0,   'rgba(220,140,20,0.35)');
      refl.addColorStop(0.5, 'rgba(160,80,10,0.12)');
      refl.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
      ctx.fillStyle = refl;
      ctx.fill();

      // Blue/purple rim light (right edge, cold contrast)
      const rim = ctx.createRadialGradient(
        orbX + orbR * 0.72, orbY + orbR * 0.1, 0,
        orbX + orbR * 0.5, orbY, orbR * 0.6
      );
      rim.addColorStop(0,   'rgba(80,60,180,0.28)');
      rim.addColorStop(0.5, 'rgba(50,30,120,0.08)');
      rim.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
      ctx.fillStyle = rim;
      ctx.fill();

      // Animated swirl streaks inside the orb
      for (let s = 0; s < 5; s++) {
        const angle = t * (0.3 + s * 0.07) + (s / 5) * Math.PI * 2;
        const sr = orbR * (0.3 + s * 0.1);
        const sx1 = orbX + Math.cos(angle) * sr;
        const sy1 = orbY + Math.sin(angle) * sr * 0.6;
        const sx2 = orbX + Math.cos(angle + 1.2) * sr * 0.7;
        const sy2 = orbY + Math.sin(angle + 1.2) * sr * 0.5;
        ctx.save();
        ctx.beginPath();
        ctx.arc(orbX, orbY, orbR * 0.97, 0, Math.PI * 2);
        ctx.clip();
        const sl = ctx.createLinearGradient(sx1, sy1, sx2, sy2);
        sl.addColorStop(0,   `rgba(220,160,40,${0.08 + s * 0.02})`);
        sl.addColorStop(0.5, `rgba(160,90,15,0.04)`);
        sl.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.quadraticCurveTo(orbX + Math.sin(angle) * sr * 0.4, orbY + Math.cos(angle) * sr * 0.3, sx2, sy2);
        ctx.lineWidth = orbR * 0.08;
        ctx.strokeStyle = sl;
        ctx.stroke();
        ctx.restore();
      }

      // Sphere border ring
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
      const border = ctx.createLinearGradient(orbX - orbR, orbY - orbR, orbX + orbR, orbY + orbR);
      border.addColorStop(0,    'rgba(255,200,80,0.55)');
      border.addColorStop(0.35, 'rgba(200,140,30,0.18)');
      border.addColorStop(0.65, 'rgba(80,50,10,0.06)');
      border.addColorStop(1,    'rgba(200,150,50,0.3)');
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // ── 3. Lens aperture overlay (on top of orb) ─────────────────────────
      const lensR = orbR * 1.45;
      const blades = 9;
      for (let b = 0; b < blades; b++) {
        const angle = (b / blades) * Math.PI * 2 + t * 0.12;
        const innerR = lensR * 0.22;
        const x0 = cx + Math.cos(angle) * innerR;
        const y0 = cy + Math.sin(angle) * innerR;
        const x1 = cx + Math.cos(angle + Math.PI * 0.52) * lensR;
        const y1 = cy + Math.sin(angle + Math.PI * 0.52) * lensR;
        const cpx = cx + Math.cos(angle + 0.55) * lensR * 0.65;
        const cpy = cy + Math.sin(angle + 0.55) * lensR * 0.65;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(cpx, cpy, x1, y1);
        ctx.strokeStyle = 'rgba(200,144,26,0.05)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Concentric lens focus rings
      [0.55, 0.72, 0.88, 1.05, 1.22, 1.42].forEach((frac, i) => {
        const r = lensR * frac * (1 + Math.sin(t * 0.8 + i * 0.5) * 0.008);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,144,26,${0.07 - i * 0.009})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Outer tick ring
      const outerR = lensR * 1.5;
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2 + t * 0.03;
        const major = i % 9 === 0;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (outerR),     cy + Math.sin(a) * (outerR));
        ctx.lineTo(cx + Math.cos(a) * (outerR + (major ? 10 : 5)), cy + Math.sin(a) * (outerR + (major ? 10 : 5)));
        ctx.strokeStyle = `rgba(200,144,26,${major ? 0.2 : 0.07})`;
        ctx.lineWidth = major ? 0.9 : 0.4;
        ctx.stroke();
      }

      // Crosshair
      const ch = 14;
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx, sy]) => {
        const px = cx + sx * 26; const py = cy + sy * 26;
        ctx.beginPath();
        ctx.moveTo(px, py - sy * ch); ctx.lineTo(px, py); ctx.lineTo(px - sx * ch, py);
        ctx.strokeStyle = 'rgba(200,144,26,0.32)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,144,26,0.5)';
      ctx.fill();

      // ── 4. Light leak streaks ────────────────────────────────────────────
      for (let s = 0; s < 4; s++) {
        const a = (s / 4) * Math.PI * 2 + t * 0.05;
        const len = lensR * (0.9 + s * 0.12);
        const lgx = cx + Math.cos(a) * len;
        const lgy = cy + Math.sin(a) * len;
        const lg = ctx.createLinearGradient(cx, cy, lgx, lgy);
        lg.addColorStop(0, 'rgba(200,144,26,0.1)');
        lg.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(lgx, lgy);
        ctx.strokeStyle = lg; ctx.lineWidth = 1.5; ctx.stroke();
      }

      // ── 5. Floating motes ────────────────────────────────────────────────
      motes.forEach(m => {
        m.x += m.vx; m.y += m.vy;
        if (m.x < 0) m.x = W;  if (m.x > W) m.x = 0;
        if (m.y < 0) m.y = H;  if (m.y > H) m.y = 0;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = m.gold
          ? `rgba(200,144,26,${m.alpha})`
          : `rgba(232,232,232,${m.alpha * 0.25})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
