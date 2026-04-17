"use client";

import Link from "next/link";
import { HeroMotionCanvas } from "./HeroMotionCanvas";

export function HeroCinematic() {
  return (
    <section
      id="hero-cinematic"
      className="relative z-10 min-h-[100svh] overflow-hidden bg-transparent"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 z-0 min-h-[100svh] w-full">
        <HeroMotionCanvas />
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] hidden w-[58%] max-w-[720px] bg-gradient-to-r from-[#030306]/92 via-[#030306]/40 to-transparent lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-[#030306]/65 via-transparent to-[#030306]/88 lg:hidden"
        aria-hidden
      />

      <div
        className="sx-hero-lift pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[min(32vh,360px)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[var(--sx-max)] flex-col justify-center px-[var(--sx-gutter)] pb-[min(10vh,5.5rem)] pt-[calc(var(--sx-nav-h)+2.25rem)] sm:pb-14 sm:pt-[calc(var(--sx-nav-h)+2.75rem)] lg:pt-[calc(var(--sx-nav-h)+3rem)]">
        <div className="w-full max-w-[26rem] lg:max-w-[min(28rem,34vw)]">
          <div className="sx-glass-hero rounded-[26px] p-8 sm:rounded-[28px] sm:p-10">
            <h1
              id="hero-heading"
              className="sx-hero-fade-up sx-hero-fade-up-d1 text-center text-[2.25rem] font-bold leading-[1.06] tracking-[-0.042em] text-white text-balance sm:text-[2.5rem] lg:text-left lg:text-[clamp(2.2rem,2.6vw,3rem)] lg:leading-[1.03]"
            >
              Your business doesn’t need more effort.
              <br />
              It needs better systems.
            </h1>
            <p className="sx-hero-fade-up sx-hero-fade-up-d2 mt-5 text-center text-[15px] leading-[1.78] text-zinc-300 sm:text-[17px] lg:text-left">
              We design systems that bring clarity, control, and growth.
            </p>
            <div className="sx-hero-cta-rise mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Link
                href="/#pricing"
                className="inline-flex h-[50px] min-h-[48px] flex-1 items-center justify-center rounded-full bg-[#02040d] px-8 text-[15px] font-semibold tracking-[-0.02em] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_4px_24px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.08] transition-[background-color,box-shadow,transform] duration-300 ease-out hover:bg-[#0a1024] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.16)_inset,0_8px_32px_-12px_rgba(96,165,250,0.14)] active:scale-[0.99] sm:min-w-[15rem] sm:flex-initial"
              >
                Request Business Diagnosis
              </Link>
              <Link
                href="/#consultation"
                className="inline-flex h-[50px] min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/[0.22] bg-white/[0.06] px-8 text-[15px] font-semibold tracking-[-0.02em] text-white shadow-[0_1px_0_rgba(255,255,255,0.1)_inset] backdrop-blur-md transition-[border-color,background-color,box-shadow,transform] duration-300 ease-out hover:border-white/32 hover:bg-white/[0.1] active:scale-[0.99] sm:min-w-[15rem] sm:flex-initial"
              >
                The process
              </Link>
            </div>
            <p className="sx-hero-trust-fade mt-8 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500 lg:text-left">
              Built for serious businesses
              <span className="mx-2 text-zinc-600" aria-hidden>
                •
              </span>
              Selective engagements
              <span className="mx-2 text-zinc-600" aria-hidden>
                •
              </span>
              India focused
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
