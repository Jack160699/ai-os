"use client";

import { useEffect, useRef } from "react";

/**
 * Full-viewport looping motion: live hub network (packets on edges),
 * vertical data streams, curved signal highways, ambient field,
 * sweep + hub rings. One canvas, one rAF — tuned for 60fps class devices.
 */
export function HeroMotionCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let splitX = 0;
    let last = performance.now();
    let start = performance.now();

    function buildState() {
      splitX = w * 0.48;
      const pad = w * 0.03;
      const rx0 = splitX + pad;
      const rx1 = w - pad;
      const ry0 = h * 0.1;
      const ry1 = h * 0.9;
      const cx = rx0 + (rx1 - rx0) * 0.48;
      const cy = ry0 + (ry1 - ry0) * 0.48;
      const rw = rx1 - rx0;
      const rh = ry1 - ry0;
      const R = Math.min(rw, rh) * 0.34;

      const ambient = [];
      const ac = Math.min(14, Math.floor((w * h) / 90000) + 6);
      for (let i = 0; i < ac; i++) {
        ambient.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.4 + Math.random() * 1.1,
          vx: (Math.random() - 0.5) * 0.09,
          vy: (Math.random() - 0.5) * 0.09,
          phase: Math.random() * Math.PI * 2,
          hot: Math.random() < 0.1,
        });
      }

      const nodes = [{ bx: cx, by: cy, hub: true, ang: 0 }];
      const leaves = 8;
      for (let i = 0; i < leaves; i++) {
        const ang = (i / leaves) * Math.PI * 2 + 0.35;
        const rr = R * (0.52 + (i % 4) * 0.1);
        nodes.push({
          bx: cx + Math.cos(ang) * rr,
          by: cy + Math.sin(ang) * rr * 0.88,
          hub: false,
          ang,
        });
      }

      const edges = [];
      for (let i = 1; i < nodes.length; i++) {
        edges.push({
          a: 0,
          b: i,
          phase: Math.random(),
          speed: 0.06 + Math.random() * 0.06,
        });
      }
      for (let i = 1; i < nodes.length; i++) {
        const j = (i % (nodes.length - 1)) + 2;
        if (j < nodes.length && i !== j && Math.random() > 0.35) {
          edges.push({
            a: i,
            b: j,
            phase: Math.random(),
            speed: 0.04 + Math.random() * 0.05,
          });
        }
      }

      const streams = [];
      const cols = 4;
      for (let i = 0; i < cols; i++) {
        streams.push({
          x: rx0 + ((i + 0.5) / cols) * (rx1 - rx0),
          off: Math.random() * 200,
          v: 18 + Math.random() * 22,
        });
      }

      stateRef.current = {
        ambient,
        nodes,
        edges,
        streams,
        rx0,
        rx1,
        ry0,
        ry1,
        cx,
        cy,
        R,
      };
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
      buildState();
    }

    function nodePos(n, elapsed) {
      if (n.hub) {
        const s = 2.5;
        return {
          x: n.bx + Math.sin(elapsed * 0.32) * s,
          y: n.by + Math.cos(elapsed * 0.28) * s,
        };
      }
      const s = 2.4;
      return {
        x: n.bx + Math.sin(elapsed * 0.55 + n.ang) * s,
        y: n.by + Math.cos(elapsed * 0.48 + n.ang * 1.2) * s,
      };
    }

    function drawHighways(elapsed) {
      const { rx0, rx1, ry0, ry1 } = stateRef.current;
      const rh = ry1 - ry0;
      const dashOff = -(elapsed * 12) % 40;
      ctx.save();
      ctx.setLineDash([6, 14]);
      ctx.lineDashOffset = dashOff;
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = "rgba(130,190,255,0.07)";
      ctx.beginPath();
      ctx.moveTo(rx0, ry0 + rh * 0.35);
      ctx.bezierCurveTo(
        rx0 + (rx1 - rx0) * 0.35,
        ry0,
        rx0 + (rx1 - rx0) * 0.65,
        ry1,
        rx1,
        ry0 + rh * 0.42
      );
      ctx.stroke();

      ctx.strokeStyle = "rgba(190,220,255,0.05)";
      ctx.lineDashOffset = dashOff * 0.85 + 8;
      ctx.beginPath();
      ctx.moveTo(rx0 + (rx1 - rx0) * 0.08, ry1);
      ctx.bezierCurveTo(
        rx0 + (rx1 - rx0) * 0.3,
        ry0 + rh * 0.55,
        rx0 + (rx1 - rx0) * 0.72,
        ry0 + rh * 0.25,
        rx1 - (rx1 - rx0) * 0.05,
        ry0
      );
      ctx.stroke();
      ctx.restore();
    }

    function paint(now) {
      const elapsed = reduced ? 0 : (now - start) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = stateRef.current;
      if (!st) return;

      const { ambient, nodes, edges, streams, rx0, rx1, ry0, ry1 } = st;

      ctx.clearRect(0, 0, w, h);

      drawHighways(elapsed);

      // Vertical data streams (right)
      const seg = 22;
      const gap = 10;
      const streamMod = seg + gap;
      for (const s of streams) {
        if (!reduced) s.off = (s.off + s.v * dt) % streamMod;
        const o = ((s.off % streamMod) + streamMod) % streamMod;
        let y = ry0 + o - streamMod;
        while (y < ry1 + 40) {
          const lg = ctx.createLinearGradient(s.x, y, s.x, y + seg);
          lg.addColorStop(0, "rgba(147,197,253,0)");
          lg.addColorStop(0.45, "rgba(220,240,255,0.12)");
          lg.addColorStop(1, "rgba(147,197,253,0)");
          ctx.strokeStyle = lg;
          ctx.lineWidth = 1.15;
          ctx.beginPath();
          ctx.moveTo(s.x, y);
          ctx.lineTo(s.x, y + seg);
          ctx.stroke();
          y += seg + gap;
        }
      }

      // Ambient particles (full canvas, brighter on right)
      for (const p of ambient) {
        if (!reduced) {
          p.x += p.vx + Math.sin(elapsed * 0.4 + p.phase) * 0.02;
          p.y += p.vy + Math.cos(elapsed * 0.33 + p.phase) * 0.02;
          if (p.x < -20) p.x = w + 20;
          if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20;
          if (p.y > h + 20) p.y = -20;
        }
        const tw = 0.55 + 0.45 * Math.sin(elapsed * 1.6 + p.phase);
        const rightBoost = p.x > splitX ? 1.15 : 0.72;
        ctx.globalAlpha = (0.08 + tw * 0.22) * rightBoost;
        ctx.fillStyle = p.hot ? "rgb(200,230,255)" : "rgb(150,175,215)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.75 + tw * 0.45), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Network edges + packets
      const positions = nodes.map((n) => nodePos(n, elapsed));
      for (const e of edges) {
        const A = positions[e.a];
        const B = positions[e.b];
        const pulse = 0.1 + 0.08 * Math.sin(elapsed * 0.35 + e.phase * 6.28);
        ctx.strokeStyle = `rgba(150,200,255,${pulse})`;
        ctx.lineWidth = 1.02;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();

        const drawPacket = (ph) => {
          const px = A.x + (B.x - A.x) * ph;
          const py = A.y + (B.y - A.y) * ph;
          const rg = ctx.createRadialGradient(px, py, 0, px, py, 6);
          rg.addColorStop(0, "rgba(255,255,255,0.85)");
          rg.addColorStop(0.4, "rgba(200,230,255,0.45)");
          rg.addColorStop(1, "rgba(80,150,255,0)");
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.arc(px, py, 3.6, 0, Math.PI * 2);
          ctx.fill();
        };
        const ph = reduced ? 0.35 : (e.phase + elapsed * e.speed) % 1;
        drawPacket(ph);
        if (!reduced && e.a === 0) {
          drawPacket((e.phase * 0.3 + elapsed * e.speed * 1.15 + 0.52) % 1);
        }
      }

      // Hub pulse rings
      const H = positions[0];
      for (let ring = 0; ring < 1; ring++) {
        const ph = (elapsed * 0.42 + ring * 0.85) % 1;
        const rad = 22 + ph * 44;
        const al = (1 - ph) * 0.14;
        ctx.strokeStyle = `rgba(140,200,255,${al})`;
        ctx.lineWidth = 1.2 - ph * 0.5;
        ctx.beginPath();
        ctx.arc(H.x, H.y, rad, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Nodes
      for (let i = 0; i < positions.length; i++) {
        const P = positions[i];
        const n = nodes[i];
        const rad = n.hub ? 7 : 4.2;
        ctx.beginPath();
        ctx.arc(P.x, P.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = n.hub ? "rgba(230,245,255,0.95)" : "rgba(180,205,240,0.85)";
        ctx.fill();
        if (n.hub) {
          ctx.strokeStyle = "rgba(120,180,255,0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Soft left read legibility (glass card sits here on mobile / small viewports)
      const leg = ctx.createLinearGradient(0, 0, w * 0.42, 0);
      leg.addColorStop(0, "rgba(3, 3, 8, 0.42)");
      leg.addColorStop(0.55, "rgba(3, 3, 8, 0.08)");
      leg.addColorStop(1, "rgba(3, 3, 8, 0)");
      ctx.fillStyle = leg;
      ctx.fillRect(0, 0, w, h);

      if (!reduced) {
        rafRef.current = requestAnimationFrame(paint);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    start = performance.now();
    last = start;

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

  return <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full min-h-[100svh]" aria-hidden />;
}
