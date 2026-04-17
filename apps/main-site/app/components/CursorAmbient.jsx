"use client";

import { useEffect, useRef } from "react";

/** Very subtle cursor-adjacent light; desktop only; respects reduced motion. */
export function CursorAmbient() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqFine = window.matchMedia("(pointer: fine)");
    if (!el || mqReduce.matches || !mqFine.matches) return;

    let raf = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      el.style.background = `radial-gradient(520px circle at ${x}px ${y}px, rgba(59,130,246,0.035), transparent 55%)`;
    };
    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(paint);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed inset-0 z-[5] hidden lg:block"
      aria-hidden
    />
  );
}
