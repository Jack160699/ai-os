"use client";

import Link from "next/link";
import { CONTACT } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const ctaPrimaryClass =
  "sx-cta-primary inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-sky-500/32 bg-[#0B0F19]/95 px-6 text-[14px] font-semibold tracking-[-0.016em] text-[#E5E7EB] transition-[transform,box-shadow,border-color] duration-300 ease-out active:translate-y-0 sm:w-auto sm:min-w-[13.5rem]";

const ctaSecondaryClass =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.05] px-6 text-[14px] font-semibold tracking-[-0.016em] text-[#E5E7EB] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] backdrop-blur-md transition-[transform,background-color,border-color] duration-300 ease-out hover:border-white/22 hover:bg-white/[0.08] active:translate-y-0 sm:w-auto sm:min-w-[13.5rem]";

function waHref(prefill) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  const q = prefill ? `?text=${encodeURIComponent(prefill)}` : "";
  return `https://wa.me/${digits}${q}`;
}

function HeroVisualSide() {
  return (
    <div
      className="relative mx-auto flex w-full max-w-[min(100%,22rem)] flex-1 items-center justify-center lg:mx-0 lg:max-w-none lg:justify-end"
      aria-hidden
    >
      <div className="relative aspect-[5/4] w-full max-w-[20rem] sm:max-w-[22rem] lg:aspect-square lg:max-w-[min(100%,26rem)]">
        <div className="sx-hero-visual-drift absolute inset-[4%] rounded-[2rem] border border-white/[0.07] bg-[radial-gradient(ellipse_at_30%_20%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(ellipse_at_78%_72%,rgba(99,102,241,0.1),transparent_50%),linear-gradient(165deg,rgba(255,255,255,0.04),rgba(11,15,25,0.5))] shadow-[0_0_0_1px_rgba(0,0,0,0.45)_inset]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/10 blur-[48px]" />
        <div className="pointer-events-none absolute bottom-[18%] right-[12%] h-[28%] w-[38%] rounded-full bg-indigo-500/10 blur-[40px]" />
        <div className="absolute inset-0 rounded-[2rem] border border-white/[0.04]" />
      </div>
    </div>
  );
}

export function HeroCinematic() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;

  const copy = isHinglish
    ? {
        headline: (
          <>
            Business grow karna hai?
            <br />
            <span className="text-zinc-100">Hum online setup easy bana dete hain.</span>
          </>
        ),
        sub:
          "Website, ads, automation aur branding — sab kuch simple aur effective way mein.",
        cta1: "Free Strategy Call",
        cta2: "WhatsApp Pe Baat Karein",
        trust: "Asli team · Seedha jawab · India ke liye",
        waNote: "Hi — mujhe StratXcel pe free strategy call book karni hai.",
      }
    : {
        headline: "We help businesses grow with modern digital systems.",
        sub: "Websites, automation, branding, and marketing designed to simplify growth.",
        cta1: "Book Free Strategy Call",
        cta2: "Chat on WhatsApp",
        trust: "Real people · Straight answers · Built for India",
        waNote: "Hi — I'd like a free strategy call with StratXcel.",
      };

  return (
    <section
      id="hero-cinematic"
      className="relative z-10 overflow-hidden bg-transparent pb-12 pt-[calc(var(--sx-nav-h)+1.25rem)] sm:pb-16 sm:pt-[calc(var(--sx-nav-h)+1.75rem)] lg:min-h-[min(100svh,56rem)] lg:pb-20 lg:pt-[calc(var(--sx-nav-h)+2rem)]"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black via-black/35 to-black lg:bg-gradient-to-r lg:from-black lg:via-black/55 lg:to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[min(28vh,280px)] bg-gradient-to-t from-black via-black/40 to-transparent lg:left-[42%] lg:h-auto lg:bg-gradient-to-l lg:from-transparent lg:via-black/25 lg:to-black/75"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[var(--sx-max)] px-[var(--sx-gutter)]">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-12 xl:gap-16">
          <div className="sx-hero-soft-in order-1 max-w-xl lg:order-none">
            <div className="rounded-2xl border border-white/[0.08] bg-black/35 p-6 backdrop-blur-md sm:p-8 lg:border-transparent lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
              <h1
                id="hero-heading"
                className="text-balance text-center text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.034em] text-zinc-200 sm:text-[1.85rem] sm:leading-[1.1] lg:text-left lg:text-[clamp(1.85rem,2.4vw,2.35rem)] lg:leading-[1.08]"
                suppressHydrationWarning
              >
                {copy.headline}
              </h1>
              <p
                className="mx-auto mt-4 max-w-[40ch] text-center text-[15px] leading-relaxed text-zinc-400 sm:text-[16px] lg:mx-0 lg:text-left"
                suppressHydrationWarning
              >
                {copy.sub}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <Link href="/#contact" className={ctaPrimaryClass}>
                  {copy.cta1}
                </Link>
                <a
                  href={waHref(copy.waNote)}
                  className={ctaSecondaryClass}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {copy.cta2}
                </a>
              </div>

              <p className="mt-5 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 lg:text-left">
                {copy.trust}
              </p>
            </div>
          </div>

          <div className="order-2 lg:order-none">
            <HeroVisualSide />
          </div>
        </div>
      </div>
    </section>
  );
}
