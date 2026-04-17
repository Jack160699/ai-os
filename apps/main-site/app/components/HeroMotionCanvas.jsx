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
      const ac = Math.min(56, Math.floor((w * h) / 28000) + 28);
      for (let i = 0; i < ac; i++) {
        ambient.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.45 + Math.random() * 1.35,
          vx: (Math.random() - 0.5) * 0.14,
          vy: (Math.random() - 0.5) * 0.14,
          phase: Math.random() * Math.PI * 2,
          hot: Math.random() < 0.18,
        });
      }

      const nodes = [{ bx: cx, by: cy, hub: true, ang: 0 }];
      const leaves = 10;
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
          speed: 0.11 + Math.random() * 0.1,
        });
      }
      for (let i = 1; i < nodes.length; i++) {
        const j = (i % (nodes.length - 1)) + 2;
        if (j < nodes.length && i !== j && Math.random() > 0.35) {
          edges.push({
            a: i,
            b: j,
            phase: Math.random(),
            speed: 0.06 + Math.random() * 0.07,
          });
        }
      }

      const streams = [];
      const cols = 8;
      for (let i = 0; i < cols; i++) {
        streams.push({
          x: rx0 + ((i + 0.5) / cols) * (rx1 - rx0),
          off: Math.random() * 200,
          v: 55 + Math.random() * 75,
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
        const s = 4;
        return {
          x: n.bx + Math.sin(elapsed * 0.55) * s,
          y: n.by + Math.cos(elapsed * 0.48) * s,
        };
      }
      const s = 3.2;
      return {
        x: n.bx + Math.sin(elapsed * 0.9 + n.ang) * s,
        y: n.by + Math.cos(elapsed * 0.75 + n.ang * 1.3) * s,
      };
    }

    function drawHighways(elapsed) {
      const { rx0, rx1, ry0, ry1 } = stateRef.current;
      const rh = ry1 - ry0;
      const dashOff = -(elapsed * 42) % 40;
      ctx.save();
      ctx.setLineDash([6, 14]);
      ctx.lineDashOffset = dashOff;
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = "rgba(130,180,255,0.14)";
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

      ctx.strokeStyle = "rgba(180,210,255,0.1)";
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

      const g = ctx.createLinearGradient(0, 0, w, h);
      const shift = Math.sin(elapsed * 0.08) * 0.02;
      g.addColorStop(Math.max(0, shift), "#010208");
      g.addColorStop(Math.min(1, 0.38 + shift * 0.5), "#050a16");
      g.addColorStop(1, "#02040d");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Right-side depth grid
      ctx.strokeStyle = "rgba(100,140,200,0.045)";
      ctx.lineWidth = 1;
      const gx = (elapsed * 8) % 32;
      for (let x = rx0 + gx; x < rx1; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, ry0);
        ctx.lineTo(x, ry1);
        ctx.stroke();
      }
      const gy = (elapsed * 10) % 28;
      for (let y = ry0 + gy; y < ry1; y += 28) {
        ctx.beginPath();
        ctx.moveTo(rx0, y);
        ctx.lineTo(rx1, y);
        ctx.stroke();
      }

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
          lg.addColorStop(0.45, "rgba(210,230,255,0.35)");
          lg.addColorStop(1, "rgba(147,197,253,0)");
          ctx.strokeStyle = lg;
          ctx.lineWidth = 1.4;
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
        const tw = 0.55 + 0.45 * Math.sin(elapsed * 2.4 + p.phase);
        const rightBoost = p.x > splitX ? 1.35 : 0.85;
        ctx.globalAlpha = (0.12 + tw * 0.38) * rightBoost;
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
        ctx.strokeStyle = "rgba(140,185,240,0.22)";
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();

        const drawPacket = (ph) => {
          const px = A.x + (B.x - A.x) * ph;
          const py = A.y + (B.y - A.y) * ph;
          const rg = ctx.createRadialGradient(px, py, 0, px, py, 6);
          rg.addColorStop(0, "rgba(255,255,255,0.95)");
          rg.addColorStop(0.35, "rgba(180,215,255,0.65)");
          rg.addColorStop(1, "rgba(100,160,255,0)");
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.arc(px, py, 4.2, 0, Math.PI * 2);
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
      for (let ring = 0; ring < 3; ring++) {
        const ph = (elapsed * 1.1 + ring * 0.7) % 1;
        const rad = 18 + ph * 52;
        const al = (1 - ph) * 0.28;
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

      // Radar arc from hub (right zone)
      const arcStart = (elapsed * 0.55) % (Math.PI * 2);
      ctx.strokeStyle = "rgba(120,180,255,0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(H.x, H.y, st.R * 1.15, arcStart, arcStart + 1.1);
      ctx.stroke();

      // Horizontal light sweep (full width, slow)
      if (!reduced) {
        const sw = w * 0.35;
        const sx = ((elapsed * 22) % (w + sw * 2)) - sw;
        const gr = ctx.createLinearGradient(sx, 0, sx + sw, 0);
        gr.addColorStop(0, "rgba(255,255,255,0)");
        gr.addColorStop(0.5, "rgba(200,220,255,0.04)");
        gr.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
      }

      // Vignette + left read legibility
      const vg = ctx.createRadialGradient(w * 0.28, h * 0.45, 0, w * 0.28, h * 0.45, w * 0.75);
      vg.addColorStop(0, "rgba(2,4,12,0.55)");
      vg.addColorStop(0.45, "rgba(2,4,12,0.12)");
      vg.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vg;
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
