"use client";

import { useEffect, useRef } from "react";

/**
 * Cinematic field: drifting nodes, proximity links, flowing paths,
 * soft signal pulses, vignette. Respects prefers-reduced-motion.
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

    const BG = "#04060c";
    const NODE_DIM = "rgba(186,198,220,0.26)";
    const ACCENT = "rgba(165,200,252,0.48)";

    function initParticles() {
      const area = w * h;
      const n = Math.min(88, Math.max(40, Math.floor(area / 14500)));
      particlesRef.current = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.45,
        vx: (Math.random() - 0.5) * 0.085,
        vy: (Math.random() - 0.5) * 0.085,
        phase: Math.random() * Math.PI * 2,
        accent: Math.random() < 0.11,
        pulse: Math.random() * Math.PI * 2,
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

    function drawFlowPaths(elapsed) {
      const dash = 5 + (Math.sin(elapsed * 0.08) + 1) * 1.5;
      const gap = 14;
      const off = -(elapsed * 9) % (dash + gap);

      ctx.save();
      ctx.setLineDash([dash, gap]);
      ctx.lineDashOffset = off;
      ctx.lineWidth = 0.65;
      ctx.lineCap = "round";

      ctx.strokeStyle = "rgba(148,163,184,0.055)";
      ctx.beginPath();
      ctx.moveTo(-40, h * 0.38);
      ctx.bezierCurveTo(w * 0.22, h * 0.28, w * 0.45, h * 0.62, w + 40, h * 0.44);
      ctx.stroke();

      ctx.strokeStyle = "rgba(96,165,250,0.05)";
      ctx.beginPath();
      ctx.moveTo(-40, h * 0.72);
      ctx.bezierCurveTo(w * 0.28, h * 0.82, w * 0.62, h * 0.48, w + 40, h * 0.58);
      ctx.stroke();

      ctx.strokeStyle = "rgba(148,163,184,0.04)";
      ctx.beginPath();
      ctx.moveTo(w * 0.15, -20);
      ctx.bezierCurveTo(w * 0.35, h * 0.35, w * 0.75, h * 0.22, w * 0.88, h + 20);
      ctx.stroke();

      ctx.restore();
    }

    function paint(t) {
      const elapsed = (t - t0) / 1000;
      const pts = particlesRef.current;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      const gx = ctx.createRadialGradient(w * 0.42, h * 0.26, 0, w * 0.42, h * 0.26, Math.max(w, h) * 0.78);
      gx.addColorStop(0, "rgba(59,130,246,0.065)");
      gx.addColorStop(0.42, "transparent");
      gx.addColorStop(1, "rgba(0,0,0,0.48)");
      ctx.fillStyle = gx;
      ctx.fillRect(0, 0, w, h);

      drawFlowPaths(elapsed);

      for (const p of pts) {
        p.x += p.vx + Math.sin(elapsed * 0.095 + p.phase) * 0.024;
        p.y += p.vy + Math.cos(elapsed * 0.078 + p.phase * 1.07) * 0.024;
        if (p.x < -28) p.x = w + 28;
        if (p.x > w + 28) p.x = -28;
        if (p.y < -28) p.y = h + 28;
        if (p.y > h + 28) p.y = -28;
      }

      const linkR = Math.min(w, h) * 0.09;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < linkR) {
            const k = 1 - d / linkR;
            const a = k * 0.1;
            const accent = pts[i].accent || pts[j].accent;
            ctx.strokeStyle = accent ? `rgba(147,197,253,${a * 0.78})` : `rgba(148,163,184,${a * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      const pulseT = elapsed * 0.9;
      for (const p of pts) {
        if (!p.accent) continue;
        const pr = 0.55 + Math.sin(pulseT + p.pulse) * 0.35;
        if (pr > 0.75) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 14 * (pr - 0.75) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(147,197,253,${(pr - 0.75) * 0.12})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }

      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.accent ? ACCENT : NODE_DIM;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = "rgba(148,163,184,0.038)";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      const waveY = h * 0.58 + Math.sin(elapsed * 0.28) * 5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 5) {
        const y = waveY + Math.sin(x * 0.0065 + elapsed * 0.32) * 9;
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
