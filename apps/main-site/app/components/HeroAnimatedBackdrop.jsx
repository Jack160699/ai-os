"use client";

import { useEffect, useRef } from "react";

/**
 * Slow, restrained motion: drifting nodes + faint neural links + soft vignette.
 * No rAF loop when prefers-reduced-motion.
 */
export function HeroAnimatedBackdrop() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const particlesRef = useRef([]);
  const reducedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let t0 = performance.now();

    const BG = "#06080f";
    const NODE_DIM = "rgba(148,163,184,0.32)";
    const ACCENT = "rgba(147,197,253,0.52)";

    function initParticles() {
      const area = w * h;
      const n = Math.min(78, Math.max(36, Math.floor(area / 16000)));
      particlesRef.current = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.45 + Math.random() * 1.35,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        phase: Math.random() * Math.PI * 2,
        accent: Math.random() < 0.1,
      }));
    }

    function resize() {
      const parent = canvas.parentElement;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent?.clientWidth || window.innerWidth;
      h = parent?.clientHeight || window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
      if (reducedRef.current) {
        t0 = performance.now();
        paint(t0);
      }
    }

    function paint(t) {
      const elapsed = (t - t0) / 1000;
      const pts = particlesRef.current;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      const gx = ctx.createRadialGradient(w * 0.45, h * 0.28, 0, w * 0.45, h * 0.28, Math.max(w, h) * 0.72);
      gx.addColorStop(0, "rgba(37,99,235,0.055)");
      gx.addColorStop(0.45, "transparent");
      gx.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = gx;
      ctx.fillRect(0, 0, w, h);

      for (const p of pts) {
        p.x += p.vx + Math.sin(elapsed * 0.11 + p.phase) * 0.028;
        p.y += p.vy + Math.cos(elapsed * 0.09 + p.phase * 1.1) * 0.028;
        if (p.x < -24) p.x = w + 24;
        if (p.x > w + 24) p.x = -24;
        if (p.y < -24) p.y = h + 24;
        if (p.y > h + 24) p.y = -24;
      }

      const linkR = Math.min(w, h) * 0.088;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < linkR) {
            const k = 1 - d / linkR;
            const a = k * 0.11;
            const accent = pts[i].accent || pts[j].accent;
            ctx.strokeStyle = accent ? `rgba(147,197,253,${a * 0.85})` : `rgba(148,163,184,${a * 0.55})`;
            ctx.lineWidth = 0.55;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.accent ? ACCENT : NODE_DIM;
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = "rgba(148,163,184,0.045)";
      ctx.lineWidth = 1;
      const waveY = h * 0.62 + Math.sin(elapsed * 0.35) * 6;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = waveY + Math.sin(x * 0.008 + elapsed * 0.4) * 10;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    function frame(t) {
      paint(t);
      rafRef.current = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);

    if (reducedRef.current) {
      t0 = performance.now();
      paint(t0);
    } else {
      t0 = performance.now();
      rafRef.current = requestAnimationFrame(frame);
    }

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden />;
}
