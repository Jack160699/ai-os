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
    eyebrow: "For real",
    title: "You message. We read it properly.",
    reassurance:
      "No corporate fog. We reply in normal words — usually the same day. No weird sales script.",
    quote: "Didn’t need fancy slides. Just needed someone who actually got it.",
    by: "Retail · India",
    linkedIn: "LinkedIn",
  },
  hi: {
    eyebrow: "Seedhi baat",
    title: "Message karo — seedhi baat.",
    reassurance:
      "Same day jawab zyada tar. Koi awkward sales call nahi. Seedha banda reply karega.",
    quote: "Pehle lagta tha kaun samjhega. Yahan baat seedhi ho gayi.",
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
      className="relative scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/55 bg-[color-mix(in_srgb,var(--sx-surface-warm)_45%,var(--sx-canvas))] py-12 sm:py-14"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,white_40%,transparent)_0%,transparent_50%)]"
        aria-hidden
      />
      <div className="sx-container relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
          <div className="lg:col-span-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{c.eyebrow}</p>
            <h2 className="mt-2.5 text-[1.38rem] font-semibold leading-[1.18] tracking-[-0.032em] text-[var(--sx-ink)] sm:text-[1.52rem]">
              {c.title}
            </h2>
            <p className="mt-3 max-w-[44ch] text-[15px] leading-[1.66] text-[color:var(--sx-ink-secondary)]">
              {c.reassurance}
            </p>
            {linkedIn ? (
              <div className="mt-6">
                <Link
                  href={linkedIn}
                  className="inline-flex min-h-[44px] items-center text-[13px] font-semibold text-[var(--sx-ink-secondary)] underline decoration-stone-300/85 underline-offset-[5px] transition-colors duration-300 hover:text-[var(--sx-ink)]"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {c.linkedIn}
                </Link>
              </div>
            ) : null}
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <figure className="sx-quote-card relative px-5 py-5 sm:px-6 sm:py-[1.35rem]">
              <blockquote className="text-[14px] font-medium leading-snug text-[var(--sx-ink)] sm:text-[15px]">
                &ldquo;{c.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3.5 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
                {c.by}
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
