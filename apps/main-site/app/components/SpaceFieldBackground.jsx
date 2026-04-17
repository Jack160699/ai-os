"use client";

import { useEffect, useRef } from "react";

/**
 * Full-viewport "system flow in space": sparse stars, slow drift, depth gradients,
 * scroll parallax, and a sparse node graph with softly pulsing edges.
 * Single rAF; intro envelope syncs with hero copy (slow reveal).
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
    const isSmallViewport = window.matchMedia("(max-width: 420px)").matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const lowPower = isSmallViewport || isCoarsePointer;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars = [];
    let motes = [];
    let nodes = [];
    let edges = [];
    const start = performance.now();
    let last = start;
    let lastDraw = start;
    let isVisible = true;
    const targetFrameMs = lowPower ? 33 : 16;

    function clamp01(t) {
      return Math.max(0, Math.min(1, t));
    }

    function smoothstep(edge0, edge1, x) {
      const t = clamp01((x - edge0) / (edge1 - edge0));
      return t * t * (3 - 2 * t);
    }

    function buildGraph() {
      nodes = [];
      edges = [];
      const n = lowPower
        ? Math.min(18, Math.max(10, Math.floor((w * h) / 130000) + 7))
        : Math.min(26, Math.max(14, Math.floor((w * h) / 95000) + 10));
      for (let i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.018,
          vy: (Math.random() - 0.5) * 0.018,
          r: 1.1 + Math.random() * 1.2,
          z: 0.35 + Math.random() * 0.65,
          tw: Math.random() * Math.PI * 2,
        });
      }
      const linkDist = Math.min(w, h) * (0.11 + Math.random() * 0.02);
      const edgeKeys = new Set();
      for (let i = 0; i < n; i++) {
        const near = [];
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) near.push({ j, d });
        }
        near.sort((a, b) => a.d - b.d);
        const cap = lowPower ? 1 : 2;
        for (let k = 0; k < Math.min(cap, near.length); k++) {
          const j = near[k].j;
          const a = Math.min(i, j);
          const b = Math.max(i, j);
          const key = `${a}:${b}`;
          if (edgeKeys.has(key)) continue;
          edgeKeys.add(key);
          edges.push({
            a,
            b,
            phase: Math.random() * Math.PI * 2,
            life: Math.random(),
            speed: 0.08 + Math.random() * 0.18,
            on: Math.random() > 0.3,
          });
        }
      }
    }

    function buildStars() {
      stars = [];
      const n = lowPower ? Math.min(44, Math.floor((w * h) / 32000) + 16) : Math.min(72, Math.floor((w * h) / 22000) + 28);
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 0.65 + 0.28,
          z: 0.3 + Math.random() * 0.7,
          tw: Math.random() * Math.PI * 2,
        });
      }
      motes = [];
      const m = lowPower ? Math.min(5, Math.floor((w * h) / 300000) + 2) : Math.min(10, Math.floor((w * h) / 220000) + 4);
      for (let i = 0; i < m; i++) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.04,
          vy: (Math.random() - 0.5) * 0.04,
          r: 0.45 + Math.random() * 0.55,
          ph: Math.random() * Math.PI * 2,
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.4 : 2);
      w = window.innerWidth;
      h = Math.max(window.innerHeight, document.documentElement?.clientHeight || 0);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
      buildGraph();
    }

    function paint(now) {
      if (!isVisible) return;
      if (!reduced && now - lastDraw < targetFrameMs) {
        rafRef.current = requestAnimationFrame(paint);
        return;
      }
      lastDraw = now;
      const elapsed = reduced ? 8 : (now - start) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const sy = scrollRef.current;

      const introStars = reduced ? 1 : smoothstep(0.35, 3.2, elapsed);
      const introEdges = reduced ? 1 : smoothstep(1.8, 5.4, elapsed);
      const introStabilize = reduced ? 1 : smoothstep(4.5, 7.5, elapsed);

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      const parallax = sy * 0.035;
      const parallax2 = sy * 0.055;

      const g1 = ctx.createRadialGradient(
        w * 0.18 - parallax2 * 0.25,
        h * 0.12,
        0,
        w * 0.32,
        h * 0.38,
        Math.max(w, h) * 0.58
      );
      g1.addColorStop(0, "rgba(11, 15, 25, 0.55)");
      g1.addColorStop(0.42, "rgba(0, 0, 0, 0)");
      g1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(
        w * 0.88 + parallax * 0.18,
        h * 0.78 + parallax * 0.12,
        0,
        w * 0.72,
        h * 0.55,
        Math.max(w, h) * 0.52
      );
      g2.addColorStop(0, "rgba(15, 23, 42, 0.35)");
      g2.addColorStop(0.5, "rgba(0, 0, 0, 0)");
      g2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      const drift = elapsed * 0.05;
      const g3 = ctx.createRadialGradient(
        w * 0.52 + Math.sin(drift) * w * 0.06,
        h * 0.48 + Math.cos(drift * 0.88) * h * 0.05,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.72
      );
      g3.addColorStop(0, "rgba(0, 0, 0, 0)");
      g3.addColorStop(0.62, "rgba(0, 0, 0, 0)");
      g3.addColorStop(1, "rgba(0, 0, 0, 0.45)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      if (!reduced) {
        for (const n of nodes) {
          n.x += n.vx * dt * 12;
          n.y += n.vy * dt * 12;
          if (n.x < -8) n.x = w + 8;
          if (n.x > w + 8) n.x = -8;
          if (n.y < -8) n.y = h + 8;
          if (n.y > h + 8) n.y = -8;
        }
      }

      const edgeBreath = 0.34 + 0.66 * (0.5 + 0.5 * Math.sin(elapsed * 0.38));
      const edgeBase =
        0.04 * introEdges * introStabilize * edgeBreath + (reduced ? 0.06 : 0);

      for (const e of edges) {
        if (!reduced) {
          e.life += dt * e.speed * (e.on ? 1 : -1);
          if (e.life >= 1) e.on = false;
          if (e.life <= 0) e.on = true;
          e.life = Math.max(0, Math.min(1, e.life));
        } else {
          e.life = 0.75;
        }
        const A = nodes[e.a];
        const B = nodes[e.b];
        if (!A || !B) continue;
        const ax = A.x + parallax * A.z;
        const ay = A.y + parallax2 * A.z * 0.55;
        const bx = B.x + parallax * B.z;
        const by = B.y + parallax2 * B.z * 0.55;
        const flicker = 0.55 + 0.45 * Math.sin(elapsed * 0.22 + e.phase);
        const fade = e.life < 0.5 ? e.life / 0.5 : (1 - e.life) / 0.5;
        const a = edgeBase * flicker * (0.45 + fade * 0.55);
        if (a < 0.008) continue;
        ctx.strokeStyle = `rgba(59, 130, 246, ${a})`;
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      for (const n of nodes) {
        const px = n.x + parallax * n.z;
        const py = n.y + parallax2 * n.z * 0.55;
        const tw = reduced ? 0.5 : 0.32 + 0.28 * Math.sin(elapsed * 0.55 + n.tw);
        ctx.globalAlpha = tw * n.z * 0.55 * introStars * introStabilize;
        ctx.fillStyle = "rgb(200, 214, 235)";
        ctx.beginPath();
        ctx.arc(px, py, n.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (const s of stars) {
        const px = s.x + parallax * s.z;
        const py = s.y + parallax2 * s.z * 0.55;
        const tw = reduced ? 0.45 : 0.28 + 0.3 * Math.sin(elapsed * 0.52 + s.tw);
        ctx.globalAlpha = tw * s.z * 0.72 * introStars * (0.88 + 0.12 * introStabilize);
        ctx.fillStyle = "rgb(210, 220, 240)";
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const m of motes) {
        if (!reduced) {
          m.x += m.vx * dt * 14;
          m.y += m.vy * dt * 14;
          if (m.x < -4) m.x = w + 4;
          if (m.x > w + 4) m.x = -4;
          if (m.y < -4) m.y = h + 4;
          if (m.y > h + 4) m.y = -4;
        }
        const al = (0.045 + 0.04 * Math.sin(elapsed * 0.42 + m.ph)) * introStars;
        ctx.globalAlpha = al;
        ctx.fillStyle = "rgb(170, 190, 220)";
        ctx.beginPath();
        ctx.arc(m.x + parallax * 0.45, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reduced && isVisible) {
        rafRef.current = requestAnimationFrame(paint);
      }
    }

    function onVisibilityChange() {
      isVisible = document.visibilityState !== "hidden";
      if (isVisible && !reduced && !rafRef.current) {
        last = performance.now();
        rafRef.current = requestAnimationFrame(paint);
      }
      if (!isVisible && rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (reduced) {
      paint(start);
    } else {
      rafRef.current = requestAnimationFrame(paint);
    }

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
