"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Appears after hero — persistent, calm, non-intrusive. */
export function StickyDiagnosisCta() {
  const [pastHero, setPastHero] = useState(false);
  const [inFinalCta, setInFinalCta] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-cinematic");
    if (!hero) {
      const id = requestAnimationFrame(() => setPastHero(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), {
      threshold: 0,
      rootMargin: "-20% 0px 0px 0px",
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const finalCta = document.getElementById("final-cta");
    if (!finalCta) return;
    const io = new IntersectionObserver(([e]) => setInFinalCta(e.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(finalCta);
    return () => io.disconnect();
  }, []);

  if (!pastHero || inFinalCta) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 lg:justify-end lg:px-6 lg:pb-6">
      <Link
        href="/#pricing"
        className="sx-cta-primary sx-cta-breathe pointer-events-auto inline-flex h-[52px] min-h-[48px] max-w-full items-center justify-center rounded-full border border-sky-500/30 bg-[#0B0F19]/94 px-6 text-[14px] font-semibold tracking-[-0.015em] text-[#E5E7EB] backdrop-blur-xl active:translate-y-0 sm:px-8"
      >
        Request Business Diagnosis
      </Link>
    </div>
  );
}
