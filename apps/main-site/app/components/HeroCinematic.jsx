"use client";

import Link from "next/link";

export function HeroCinematic() {
  return (
    <section
      id="hero-cinematic"
      className="relative z-10 min-h-[100svh] overflow-hidden bg-transparent"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 z-[2] hidden w-full bg-gradient-to-r from-black via-black/55 to-transparent lg:block lg:w-[62%] lg:max-w-[780px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/75 via-transparent to-black/90 lg:hidden"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[min(34vh,380px)] bg-gradient-to-t from-black via-black/50 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[var(--sx-max)] flex-col justify-center px-[var(--sx-gutter)] pb-[min(10vh,5.5rem)] pt-[calc(var(--sx-nav-h)+2.25rem)] sm:pb-14 sm:pt-[calc(var(--sx-nav-h)+2.75rem)] lg:pt-[calc(var(--sx-nav-h)+3rem)]">
        <div className="w-full max-w-[28rem] lg:max-w-[min(30rem,36vw)]">
          <div className="sx-glass-hero rounded-[22px] p-8 sm:rounded-[26px] sm:p-10">
            <h1
              id="hero-heading"
              className="sx-hero-fade-up sx-hero-fade-up-d1 text-balance text-center text-[2.05rem] font-semibold leading-[1.08] tracking-[-0.038em] text-[#E5E7EB] sm:text-[2.35rem] lg:text-left lg:text-[clamp(2.05rem,2.5vw,2.85rem)] lg:leading-[1.04]"
            >
              Your business doesn&apos;t need more effort.
              <br />
              It needs better systems.
            </h1>
            <p className="sx-hero-fade-up sx-hero-fade-up-d2 mt-5 text-center text-[15px] font-normal leading-[1.78] text-zinc-400 sm:text-[16px] lg:text-left">
              We design systems that bring clarity, control, and growth.
            </p>
            <div className="sx-hero-cta-rise mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Link
                href="/#pricing"
                className="inline-flex h-[50px] min-h-[48px] flex-1 items-center justify-center rounded-full border border-sky-500/25 bg-[#0B0F19]/90 px-8 text-[14px] font-semibold tracking-[-0.018em] text-[#E5E7EB] shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_0_48px_-20px_rgba(59,130,246,0.22)] transition-[background-color,box-shadow,transform,border-color] duration-[520ms] ease-out hover:-translate-y-0.5 hover:border-sky-400/35 hover:bg-[#0f1524] hover:shadow-[0_0_56px_-18px_rgba(59,130,246,0.28)] active:translate-y-0 sm:min-w-[15.5rem] sm:flex-initial"
              >
                Request Business Diagnosis
              </Link>
              <Link
                href="/#consultation"
                className="inline-flex h-[50px] min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.04] px-8 text-[14px] font-semibold tracking-[-0.018em] text-[#E5E7EB] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] backdrop-blur-md transition-[border-color,background-color,box-shadow,transform] duration-[520ms] ease-out hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.08] hover:shadow-[0_0_40px_-24px_rgba(59,130,246,0.15)] active:translate-y-0 sm:min-w-[15.5rem] sm:flex-initial"
              >
                See How We Work
              </Link>
            </div>
            <p className="sx-hero-trust-fade mt-8 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500 lg:text-left">
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
