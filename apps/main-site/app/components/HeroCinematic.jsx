"use client";

import Link from "next/link";
import { CONTACT } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const waPrimaryClass =
  "sx-btn-wa inline-flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold tracking-[-0.02em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sx-green-mid)_55%,transparent)] focus-visible:ring-offset-2 sm:w-auto sm:min-w-[15.5rem]";

const secondaryClass =
  "sx-btn-secondary-elegant inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-full px-5 text-[14px] font-semibold tracking-[-0.015em] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/60 focus-visible:ring-offset-2 sm:min-h-[50px] sm:w-auto sm:min-w-[13rem]";

function waHref(prefill) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  const q = prefill ? `?text=${encodeURIComponent(prefill)}` : "";
  return `https://wa.me/${digits}${q}`;
}

export function HeroCinematic() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;

  const copy = isHinglish
    ? {
        kicker: "StratXcel — website, ads, WhatsApp · seedha kaam",
        headline: "Business online grow nahi ho raha?",
        sub: "Site, ads, customer messages — yahan se set karte hain taaki sahi log aap tak pahunche. Agency wala scene nahi: seedhi baat, WhatsApp pe.",
        wa: "WhatsApp pe baat karein",
        start: "Form se likho",
        waNote: "Hi, StratXcel dekha. Mera business: ",
        trust: "Jawab zyada tar same day. Pressure nahi.",
      }
    : {
        kicker: "StratXcel — websites, ads & WhatsApp for growing teams",
        headline: "Struggling to grow your business online?",
        sub: "We help with your site, ads, and customer messages so the right people find you — without the jargon. Small team, plain language; start on WhatsApp.",
        wa: "Message us on WhatsApp",
        start: "Use the short form",
        waNote: "Hi — I'm reaching out from StratXcel. My business: ",
        trust: "We usually reply the same day. No pitch deck required.",
      };

  return (
    <section
      id="hero-cinematic"
      className="relative z-10 border-b border-stone-200/50 pb-9 pt-[calc(var(--sx-nav-h)+0.55rem)] sm:pb-10 sm:pt-[calc(var(--sx-nav-h)+0.75rem)]"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-50/32 to-transparent sm:h-36"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[var(--sx-max)] px-[var(--sx-gutter)]">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{copy.kicker}</p>
          <h1
            id="hero-heading"
            className="mt-2 text-balance text-[1.58rem] font-semibold leading-[1.14] tracking-[-0.036em] text-[var(--sx-ink)] sm:mt-2.5 sm:text-[1.82rem] sm:leading-[1.1] lg:text-[1.95rem]"
            suppressHydrationWarning
          >
            {copy.headline}
          </h1>
          <p
            className="mt-3 max-w-[50ch] text-[15px] leading-[1.55] text-[color:var(--sx-ink-secondary)] sm:mt-4 sm:text-[16px] sm:leading-[1.58]"
            suppressHydrationWarning
          >
            {copy.sub}
          </p>

          <div className="mt-7 flex max-w-xl flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-stretch">
            <a
              href={waHref(copy.waNote)}
              className={waPrimaryClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.wa}
            </a>
            <Link href="/contact" className={secondaryClass}>
              {copy.start}
            </Link>
          </div>
          <p className="mt-4 max-w-[44ch] text-[12px] leading-relaxed text-stone-500 sm:text-[13px]" suppressHydrationWarning>
            {copy.trust}
          </p>
        </div>
      </div>
    </section>
  );
}
