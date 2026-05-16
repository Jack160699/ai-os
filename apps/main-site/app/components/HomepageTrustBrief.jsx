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
    title: "Real people behind the replies.",
    reassurance: "Small team, India. We read what you send — no bot wall.",
    quote: "Clear, calm help — we finally moved forward online.",
    by: "Retail operator · India",
    linkedIn: "LinkedIn",
  },
  hi: {
    title: "Reply ke peeche asli log.",
    reassurance: "Chhota team, India. Jo likhte ho padhte hain — bot queue nahi.",
    quote: "Pehle lagta tha kya bolna hai — fir clear ho gaya.",
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
      className="relative scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/55 bg-transparent py-7 sm:py-8"
    >
      <div className="sx-container relative">
        <div className="mx-auto max-w-xl">
          <h2 className="text-[1.08rem] font-semibold tracking-[-0.03em] text-[var(--sx-ink)] sm:text-lg">
            {c.title}
          </h2>
          <p className="mt-2 max-w-[42ch] text-[14px] leading-relaxed text-[color:var(--sx-ink-secondary)] sm:text-[15px]">
            {c.reassurance}
          </p>

          <figure className="sx-quote-card mt-5 px-4 py-3.5 sm:px-5 sm:py-4">
            <blockquote className="text-[13px] font-medium leading-snug text-[var(--sx-ink)] sm:text-[14px]">
              &ldquo;{c.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-[11px] text-stone-500">{c.by}</figcaption>
          </figure>

          {linkedIn ? (
            <div className="mt-4">
              <Link
                href={linkedIn}
                className="inline-flex min-h-[44px] items-center text-[13px] font-medium text-[var(--sx-ink-secondary)] underline decoration-stone-300/80 underline-offset-[5px] transition-colors hover:text-[var(--sx-ink)]"
                rel="noopener noreferrer"
                target="_blank"
              >
                {c.linkedIn}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
