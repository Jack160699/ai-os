"use client";

import Link from "next/link";
import { HeroMotionCanvas } from "./HeroMotionCanvas";

export function HeroCinematic() {
  return (
    <section
      id="hero-cinematic"
      className="relative min-h-[100svh] overflow-hidden bg-[#010208]"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 z-0 min-h-[100svh] w-full">
        <HeroMotionCanvas />
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] hidden w-[58%] max-w-[720px] bg-gradient-to-r from-[#010208]/96 via-[#010208]/45 to-transparent lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-[#010208]/70 via-transparent to-[#010208]/90 lg:hidden"
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
              We uncover growth bottlenecks, remove execution friction, and build systems that help serious businesses
              scale with clarity.
            </p>
            <div className="sx-hero-cta-rise mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Link
                href="/#pricing"
                className="inline-flex h-[50px] min-h-[48px] flex-1 items-center justify-center rounded-full bg-[#02040d] px-8 text-[15px] font-semibold tracking-[-0.02em] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.14)_inset,0_4px_20px_rgba(0,0,0,0.55),0_20px_48px_-16px_rgba(56,189,248,0.32)] ring-1 ring-white/10 transition-[background-color,box-shadow,transform] duration-300 ease-out hover:bg-[#0a1024] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18)_inset,0_12px_40px_-12px_rgba(56,189,248,0.42)] active:scale-[0.99] sm:min-w-[15rem] sm:flex-initial"
              >
                Request Business Diagnosis
              </Link>
              <Link
                href="/#how-we-work"
                className="inline-flex h-[50px] min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/[0.28] bg-white/[0.07] px-8 text-[15px] font-semibold tracking-[-0.02em] text-white shadow-[0_1px_0_rgba(255,255,255,0.16)_inset] backdrop-blur-md transition-[border-color,background-color,box-shadow,transform] duration-300 ease-out hover:border-white/40 hover:bg-white/[0.12] hover:shadow-[0_0_40px_-12px_rgba(255,255,255,0.15)] active:scale-[0.99] sm:min-w-[15rem] sm:flex-initial"
              >
                See How We Work
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
