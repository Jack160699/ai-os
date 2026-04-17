"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Appears after hero — persistent, calm, non-intrusive. */
export function StickyDiagnosisCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-cinematic");
    if (!hero) {
      const id = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), {
      threshold: 0,
      rootMargin: "-20% 0px 0px 0px",
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 lg:justify-end lg:px-6 lg:pb-6">
      <Link
        href="/#pricing"
        className="pointer-events-auto inline-flex h-12 min-h-[48px] max-w-full items-center justify-center rounded-full border border-sky-500/22 bg-[#0B0F19]/92 px-6 text-[14px] font-semibold tracking-[-0.015em] text-[#E5E7EB] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_12px_40px_-16px_rgba(0,0,0,0.7),0_0_52px_-18px_rgba(59,130,246,0.18)] backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-[520ms] ease-out hover:-translate-y-0.5 hover:border-sky-400/32 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.12)_inset,0_16px_48px_-18px_rgba(59,130,246,0.22)] active:translate-y-0 sm:px-8"
      >
        Request Business Diagnosis
      </Link>
    </div>
  );
}
