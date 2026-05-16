"use client";

import Image from "next/image";
import Link from "next/link";
import { SOCIAL } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

/**
 * Add real client logos here when you have files in `public/`:
 * `{ src: "/trust/acme.svg", alt: "Acme Corp" }`
 */
const CLIENT_LOGOS = [
  { src: null, alt: "" },
  { src: null, alt: "" },
  { src: null, alt: "" },
  { src: null, alt: "" },
];

const COPY = {
  en: {
    title: "Businesses trust StratXcel to grow online.",
    quotes: [
      { text: "Clear, calm help — we finally moved forward online.", by: "Operator, retail · India" },
      { text: "Plain language. No endless jargon.", by: "Founder, services · India" },
    ],
    proof: "India · Registered company · Founder-led team",
    linkedIn: "LinkedIn",
  },
  hi: {
    title: "Online grow ke liye businesses StratXcel par bharosa karti hain.",
    quotes: [
      { text: "Seedha jawab, kaam aage badha — online.", by: "Operator, retail · India" },
      { text: "Samajhne mein aasaan. Ghuma-firayi kam.", by: "Founder, services · India" },
    ],
    proof: "India · Register company · Founder ki team",
    linkedIn: "LinkedIn",
  },
};

/** Neutral marks until real logos are added (replace via `CLIENT_LOGOS`). */
function LogoMark({ variant }) {
  const common = "h-6 w-auto text-stone-400 sm:h-7";
  if (variant === 1) {
    return (
      <svg className={common} viewBox="0 0 88 24" fill="none" aria-hidden>
        <rect x="1" y="5" width="28" height="14" rx="3" stroke="currentColor" strokeWidth="1.25" />
        <rect x="36" y="8" width="51" height="8" rx="2" fill="currentColor" opacity="0.2" />
      </svg>
    );
  }
  if (variant === 2) {
    return (
      <svg className={common} viewBox="0 0 72 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.25" />
        <path d="M26 8h40M26 12h32M26 16h44" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.45" />
      </svg>
    );
  }
  if (variant === 3) {
    return (
      <svg className={common} viewBox="0 0 80 24" fill="none" aria-hidden>
        <path d="M4 18L14 6l10 12M28 18V6h12l-6 6 6 6H28" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="48" y="7" width="28" height="10" rx="2" stroke="currentColor" strokeWidth="1.25" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 92 24" fill="none" aria-hidden>
      <path d="M4 18V6h8v12H4Z" stroke="currentColor" strokeWidth="1.25" />
      <path d="M22 6l8 12 8-12M42 18V6h20" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
    </svg>
  );
}

function TrustLogoStrip() {
  const withSrc = CLIENT_LOGOS.filter((x) => x.src);
  if (withSrc.length > 0) {
    return (
      <div className="mx-auto mt-7 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-5">
        {withSrc.map((logo) => (
          <Image
            key={logo.src}
            src={logo.src}
            alt={logo.alt || "Client logo"}
            width={120}
            height={36}
            sizes="(max-width: 640px) 100px, 120px"
            loading="lazy"
            className="h-7 w-auto max-h-7 object-contain opacity-80 grayscale transition-[opacity,filter] duration-200 hover:opacity-100 hover:grayscale-0"
          />
        ))}
      </div>
    );
  }
  return (
    <div
      className="mx-auto mt-7 flex max-w-lg flex-wrap items-center justify-center gap-x-8 gap-y-5 sm:max-w-none"
      aria-label="Brands we work with"
    >
      <LogoMark variant={1} />
      <LogoMark variant={2} />
      <LogoMark variant={3} />
      <LogoMark variant={4} />
    </div>
  );
}

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
      className="scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/85 bg-transparent py-8 sm:py-10"
    >
      <div className="sx-container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-lg font-semibold tracking-[-0.03em] text-stone-900 sm:text-xl">
            {c.title}
          </h2>

          <TrustLogoStrip />

          <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {c.quotes.map((q) => (
              <figure
                key={q.text}
                className="rounded-xl border border-stone-200/90 bg-white/90 px-4 py-3.5 text-left shadow-[0_1px_0_rgba(255,255,255,0.92)_inset,0_10px_32px_-22px_rgba(41,37,36,0.12)]"
              >
                <blockquote className="text-[13px] font-medium leading-snug text-stone-800 sm:text-[14px]">
                  &ldquo;{q.text}&rdquo;
                </blockquote>
                <figcaption className="mt-2 text-[11px] text-stone-500">{q.by}</figcaption>
              </figure>
            ))}
          </div>

          <p className="mt-6 text-[12px] leading-relaxed text-stone-500 sm:text-[13px]">{c.proof}</p>

          {linkedIn ? (
            <p className="mt-3">
              <Link
                href={linkedIn}
                className="text-[13px] font-medium text-stone-700 underline-offset-4 hover:text-stone-950 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                {c.linkedIn}
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
