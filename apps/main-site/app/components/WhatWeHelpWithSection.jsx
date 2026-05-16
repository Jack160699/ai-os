"use client";

import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const SETS = {
  en: {
    title: "What We Help With",
    cards: [
      {
        id: "customers",
        title: "More Customers",
        body: "Help more people discover your business online.",
        icon: IconReach,
      },
      {
        id: "presence",
        title: "Better Online Presence",
        body: "Modern websites and stronger branding.",
        icon: IconPresence,
      },
      {
        id: "time",
        title: "Save Time",
        body: "Reduce repetitive work and respond faster.",
        icon: IconTime,
      },
    ],
  },
  hi: {
    title: "Hum kya-kya karte hain",
    cards: [
      {
        id: "customers",
        title: "Zyada customers",
        body: "Online pe zyada log aapko dhundh payein.",
        icon: IconReach,
      },
      {
        id: "presence",
        title: "Online strong dikho",
        body: "Nayi website, brand thoda set.",
        icon: IconPresence,
      },
      {
        id: "time",
        title: "Time bachao",
        body: "Wahi kaam baar-baar kam, jawab jaldi.",
        icon: IconTime,
      },
    ],
  },
};

function IconReach(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className}>
      <path
        d="M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 20v-.5a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v.5M16 8.5h3M19 8.5v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPresence(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className}>
      <path
        d="M4.5 6.75h15v10.5h-15V6.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 17.25h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 10.25h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconTime(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={props.className}>
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8.75v3.5l2.25 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const cardShell =
  "flex h-full flex-col rounded-2xl border border-stone-200/90 bg-white p-6 shadow-[0_1px_0_rgba(255,255,255,0.92)_inset,0_14px_44px_-28px_rgba(41,37,36,0.14)] sm:p-7";

export function WhatWeHelpWithSection() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const { title, cards } = isHinglish ? SETS.hi : SETS.en;

  return (
    <section
      id="what-we-help"
      className="relative z-10 scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/85 bg-transparent py-10 sm:py-12 lg:py-14"
    >
      <div className="sx-container">
        <h2 className="text-center text-xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-left sm:text-2xl">
          {title}
        </h2>

        <ul className="mt-8 grid list-none gap-6 sm:mt-10 sm:grid-cols-2 sm:gap-7 lg:mt-10 lg:grid-cols-3 lg:gap-8">
          {cards.map(({ id, title: cardTitle, body, icon: Icon }) => (
            <li key={id}>
              <div className={cardShell}>
                <div
                  className="mb-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500"
                  aria-hidden
                >
                  <Icon className="h-[1.35rem] w-[1.35rem]" />
                </div>
                <h3 className="text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-stone-900 sm:text-lg">
                  {cardTitle}
                </h3>
                <p className="mt-2 max-w-[28ch] text-[15px] leading-relaxed text-stone-600 sm:max-w-none">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
