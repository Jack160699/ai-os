"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Appears after hero — persistent, calm, non-intrusive. */
export function StickyDiagnosisCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-cinematic");
    if (!hero) {
      setShow(true);
      return;
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
        className="pointer-events-auto inline-flex h-12 min-h-[48px] max-w-full items-center justify-center rounded-full border border-white/14 bg-[#0a0c14]/90 px-6 text-[14px] font-semibold tracking-[-0.015em] text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_12px_40px_-16px_rgba(0,0,0,0.65),0_0_48px_-20px_rgba(96,165,250,0.15)] backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-0.5 hover:border-white/22 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_16px_48px_-18px_rgba(96,165,250,0.18)] active:translate-y-0 sm:px-8"
      >
        Request Business Diagnosis
      </Link>
    </div>
  );
}
