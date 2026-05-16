"use client";

import Link from "next/link";
import { SOCIAL } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const COPY = {
  en: {
    eyebrow: "Trust",
    title: "Real people. Real replies.",
    reassurance: "Small crew in India. You write, we read — not a bot wall.",
    quote: "Finally someone who said it simply. We actually moved.",
    by: "Retail · India",
    linkedIn: "LinkedIn",
  },
  hi: {
    eyebrow: "Vishwas",
    title: "Asli bande. Seedha jawab.",
    reassurance: "Chhota team, India. Tum likho, hum padhein — auto-reply drama nahi.",
    quote: "Pehle samajh nahi aata tha. Phir ekdum clear ho gaya.",
    by: "Retail · India",
    linkedIn: "LinkedIn",
  },
};

export function HomepageTrustBrief() {
  const linkedIn = SOCIAL.linkedin;
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const c = isHinglish ? COPY.hi : COPY.en;

  return (
    <section
      id="trust"
      className="relative scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/50 bg-[color-mix(in_srgb,var(--sx-surface-warm)_55%,var(--sx-canvas))] py-10 sm:py-11"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,white_35%,transparent)_0%,transparent_45%)]"
        aria-hidden
      />
      <div className="sx-container relative">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{c.eyebrow}</p>
            <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.032em] text-[var(--sx-ink)] sm:text-[1.45rem]">
              {c.title}
            </h2>
            <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-[color:var(--sx-ink-secondary)]">
              {c.reassurance}
            </p>
            {linkedIn ? (
              <div className="mt-5">
                <Link
                  href={linkedIn}
                  className="inline-flex min-h-[44px] items-center text-[13px] font-semibold text-[var(--sx-ink-secondary)] underline decoration-stone-300/85 underline-offset-[5px] transition-colors hover:text-[var(--sx-ink)]"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {c.linkedIn}
                </Link>
              </div>
            ) : null}
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <figure className="sx-quote-card relative px-5 py-5 shadow-[var(--sx-shadow-sm)] sm:px-6 sm:py-5">
              <blockquote className="text-[14px] font-medium leading-snug text-[var(--sx-ink)] sm:text-[15px]">
                &ldquo;{c.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
                {c.by}
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
