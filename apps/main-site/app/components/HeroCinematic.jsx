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
              className="sx-hero-lead sx-hero-fade-up sx-hero-fade-up-d1 text-balance text-center text-[2.1rem] font-semibold leading-[1.07] tracking-[-0.042em] text-[#E5E7EB] sm:text-[2.42rem] lg:text-left lg:text-[clamp(2.12rem,2.65vw,3rem)] lg:leading-[1.03]"
            >
              Your business doesn&apos;t need more effort.
              <br />
              It needs better systems.
            </h1>
            <p className="sx-hero-fade-up sx-hero-fade-up-d2 mt-5 text-center text-[15px] font-normal leading-[1.82] text-zinc-300 sm:text-[16px] lg:text-left">
              We design systems that bring clarity, control, and growth.
            </p>
            <div className="sx-hero-cta-rise mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Link
                href="/#pricing"
                className="sx-cta-primary sx-cta-breathe inline-flex h-[52px] min-h-[48px] flex-1 items-center justify-center rounded-full border border-sky-500/32 bg-[#0B0F19]/95 px-8 text-[14px] font-semibold tracking-[-0.016em] text-[#E5E7EB] active:translate-y-0 sm:min-w-[15.5rem] sm:flex-initial"
              >
                Request Business Diagnosis
              </Link>
              <Link
                href="/#consultation"
                className="sx-cta-secondary inline-flex h-[52px] min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.05] px-8 text-[14px] font-semibold tracking-[-0.016em] text-[#E5E7EB] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] backdrop-blur-md hover:border-white/24 hover:bg-white/[0.085] hover:shadow-[0_0_40px_-24px_rgba(59,130,246,0.15)] active:translate-y-0 sm:min-w-[15.5rem] sm:flex-initial"
              >
                See How We Work
              </Link>
            </div>
            <p className="sx-hero-trust-fade mt-3 text-center text-[11px] tracking-[-0.01em] text-zinc-400 lg:text-left">
              Limited monthly diagnosis slots.
            </p>
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
