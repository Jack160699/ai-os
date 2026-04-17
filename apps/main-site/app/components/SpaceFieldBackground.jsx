"use client";

import { useEffect, useRef } from "react";

/**
 * Site-wide deep space: sparse stars, slow drift, faint cosmic haze, scroll parallax.
 * Single rAF; stays behind page content (fixed z-0).
 */
export function SpaceFieldBackground() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars = [];
    let motes = [];
    let start = performance.now();
    let last = start;

    function build() {
      stars = [];
      const n = Math.min(95, Math.floor((w * h) / 12000) + 38);
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 0.85 + 0.35,
          z: 0.35 + Math.random() * 0.65,
          tw: Math.random() * Math.PI * 2,
        });
      }
      motes = [];
      const m = Math.min(14, Math.floor((w * h) / 180000) + 6);
      for (let i = 0; i < m; i++) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.06,
          vy: (Math.random() - 0.5) * 0.06,
          r: 0.5 + Math.random() * 0.8,
          ph: Math.random() * Math.PI * 2,
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = Math.max(window.innerHeight, document.documentElement?.clientHeight || 0);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function paint(now) {
      const elapsed = reduced ? 0 : (now - start) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const sy = scrollRef.current;

      ctx.fillStyle = "#030306";
      ctx.fillRect(0, 0, w, h);

      const parallax = sy * 0.04;
      const parallax2 = sy * 0.07;

      const g1 = ctx.createRadialGradient(
        w * 0.2 - parallax2 * 0.3,
        h * 0.15,
        0,
        w * 0.35,
        h * 0.35,
        Math.max(w, h) * 0.55
      );
      g1.addColorStop(0, "rgba(30, 58, 95, 0.14)");
      g1.addColorStop(0.45, "rgba(3, 3, 6, 0)");
      g1.addColorStop(1, "rgba(3, 3, 6, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(
        w * 0.88 + parallax * 0.2,
        h * 0.72 + parallax * 0.15,
        0,
        w * 0.75,
        h * 0.55,
        Math.max(w, h) * 0.5
      );
      g2.addColorStop(0, "rgba(59, 91, 140, 0.1)");
      g2.addColorStop(0.5, "rgba(3, 3, 6, 0)");
      g2.addColorStop(1, "rgba(3, 3, 6, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      const driftSlow = elapsed * 0.08;
      const g3 = ctx.createRadialGradient(
        w * 0.5 + Math.sin(driftSlow) * w * 0.08,
        h * 0.45 + Math.cos(driftSlow * 0.87) * h * 0.06,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.65
      );
      g3.addColorStop(0, "rgba(15, 23, 42, 0)");
      g3.addColorStop(0.55, "rgba(3, 3, 6, 0)");
      g3.addColorStop(1, "rgba(0, 0, 0, 0.38)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        const px = s.x + parallax * s.z;
        const py = s.y + parallax2 * s.z * 0.6;
        const tw = reduced ? 0.55 : 0.38 + 0.32 * Math.sin(elapsed * 0.7 + s.tw);
        ctx.globalAlpha = tw * s.z * 0.85;
        ctx.fillStyle = "rgb(210, 225, 248)";
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const m of motes) {
        if (!reduced) {
          m.x += m.vx * dt * 18;
          m.y += m.vy * dt * 18;
          if (m.x < -4) m.x = w + 4;
          if (m.x > w + 4) m.x = -4;
          if (m.y < -4) m.y = h + 4;
          if (m.y > h + 4) m.y = -4;
        }
        const al = 0.06 + 0.05 * Math.sin(elapsed * 0.5 + m.ph);
        ctx.globalAlpha = al;
        ctx.fillStyle = "rgb(180, 200, 235)";
        ctx.beginPath();
        ctx.arc(m.x + parallax * 0.5, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reduced) {
        rafRef.current = requestAnimationFrame(paint);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduced) {
      paint(start);
    } else {
      rafRef.current = requestAnimationFrame(paint);
    }

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 block h-full min-h-[100dvh] w-full"
      aria-hidden
    />
  );
}
