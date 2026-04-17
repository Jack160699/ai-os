"use client";

import Link from "next/link";
import { HeroAnimatedBackdrop } from "./HeroAnimatedBackdrop";

function HeroGlassAccents() {
  return (
    <div className="pointer-events-none relative mx-auto h-[min(52vh,480px)] w-full max-w-lg" aria-hidden>
      <div
        className="sx-hero-glass-float sx-hero-glass-float-a absolute right-[2%] top-[6%] h-[42%] w-[78%] rounded-[22px] border border-white/[0.14] bg-gradient-to-br from-white/[0.09] to-white/[0.02] shadow-[0_24px_56px_-28px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl"
      />
      <div
        className="sx-hero-glass-float sx-hero-glass-float-b absolute bottom-[12%] left-0 h-[36%] w-[62%] rounded-[20px] border border-white/[0.1] bg-gradient-to-br from-white/[0.06] to-transparent shadow-[0_20px_48px_-28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-lg"
      />
      <div
        className="sx-hero-glass-float sx-hero-glass-float-c absolute right-[8%] bottom-[4%] h-[22%] w-[44%] rounded-2xl border border-sky-400/15 bg-gradient-to-r from-sky-500/[0.07] to-transparent shadow-[0_12px_32px_-16px_rgba(37,99,235,0.35)] backdrop-blur-md"
      />
    </div>
  );
}

export function HeroCinematic() {
  return (
    <section
      id="hero-cinematic"
      className="relative min-h-[100dvh] overflow-hidden border-b border-zinc-900/60 bg-[#06080f]"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 z-0 min-h-[100dvh] w-full">
        <HeroAnimatedBackdrop />
      </div>
      <div className="sx-hero-fog pointer-events-none absolute inset-0 z-[1] min-h-[100dvh]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-[2] min-h-[100dvh] bg-gradient-to-b from-[#06080f]/30 via-transparent to-[#020308]/95"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-[3] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%20width%3D%2232%22%20height%3D%2232%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%221%22%20fill%3D%22rgba%28255%2C255%2C255%2C0.02%29%22%2F%3E%3C%2Fsvg%3E')] opacity-[0.5] min-h-[100dvh]" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col justify-center px-4 pb-20 pt-[4.75rem] sm:px-6 sm:pb-24 sm:pt-[5rem] xl:px-8 min-[1440px]:px-10">
        <div className="grid w-full items-center gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="sx-glass-hero mx-auto w-full max-w-xl rounded-[28px] p-8 sm:p-10 lg:mx-0 lg:max-w-none">
              <h1
                id="hero-heading"
                className="sx-hero-fade-up sx-hero-fade-up-d1 text-center text-[2.125rem] font-bold leading-[1.08] tracking-[-0.038em] text-white text-balance shadow-[0_1px_0_rgba(255,255,255,0.08)] sm:text-[2.4rem] sm:leading-[1.06] lg:text-left lg:text-[2.65rem] lg:leading-[1.04] xl:text-5xl"
              >
                Your business doesn’t need more effort.
                <br />
                It needs better systems.
              </h1>
              <p className="sx-hero-fade-up sx-hero-fade-up-d2 mt-5 text-center text-[15px] leading-[1.75] text-zinc-300 sm:text-[17px] sm:leading-[1.7] lg:text-left">
                We uncover growth bottlenecks, fix execution gaps, and build systems that help serious businesses scale
                with clarity.
              </p>
              <div className="sx-hero-cta-rise mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <Link
                  href="/#pricing"
                  className="inline-flex h-[48px] min-h-[48px] flex-1 items-center justify-center rounded-full bg-[#05070d] px-8 text-[15px] font-semibold tracking-[-0.015em] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_2px_12px_rgba(0,0,0,0.45),0_12px_32px_-12px_rgba(37,99,235,0.25)] ring-1 ring-white/10 transition-[background-color,box-shadow,transform] duration-300 ease-out hover:bg-[#0c1222] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14)_inset,0_4px_24px_-8px_rgba(37,99,235,0.35)] active:scale-[0.99] sm:min-w-[14rem] sm:flex-initial"
                >
                  Request Business Diagnosis
                </Link>
                <Link
                  href="/#how-we-work"
                  className="inline-flex h-[48px] min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/[0.22] bg-white/[0.06] px-8 text-[15px] font-semibold tracking-[-0.015em] text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] backdrop-blur-md transition-[border-color,background-color,box-shadow,transform] duration-300 ease-out hover:border-white/30 hover:bg-white/[0.11] hover:shadow-[0_0_24px_-8px_rgba(255,255,255,0.12)] active:scale-[0.99] sm:min-w-[14rem] sm:flex-initial"
                >
                  See How We Work
                </Link>
              </div>
              <p className="sx-hero-trust-fade mt-8 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 lg:text-left">
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

          <div className="relative hidden min-h-[300px] lg:col-span-6 lg:block xl:col-span-5">
            <HeroGlassAccents />
          </div>
        </div>
      </div>
    </section>
  );
}
