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
        href="/#consultation"
        className="pointer-events-auto inline-flex h-12 min-h-[48px] max-w-full items-center justify-center rounded-full border border-zinc-200/90 bg-white/95 px-6 text-[14px] font-semibold tracking-[-0.015em] text-[var(--sx-navy)] shadow-[0_8px_32px_-12px_rgba(15,23,42,0.18)] backdrop-blur-md transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.22)] active:translate-y-0 sm:px-8"
      >
        Request Business Diagnosis
      </Link>
    </div>
  );
}
