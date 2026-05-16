"use client";

import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

/** @type {{ id: string; tint: string; en: { label: string; out: string }; hi: { label: string; out: string } }[]} */
const CASES = [
  {
    id: "gym",
    tint: "from-amber-50/92 to-orange-50/35",
    en: { label: "Gym", out: "More trials. WhatsApp booking that actually feels easy." },
    hi: { label: "Gym", out: "Trial badhao. WhatsApp se booking easy karo." },
  },
  {
    id: "clinic",
    tint: "from-emerald-50/92 to-teal-50/32",
    en: { label: "Clinic", out: "Fewer random calls. Timings + booking crystal clear." },
    hi: { label: "Clinic", out: "Calls kam. Timing aur booking clear." },
  },
  {
    id: "coach",
    tint: "from-violet-50/85 to-indigo-50/28",
    en: { label: "Coach", out: "Keep the offer simple so people don’t get lost." },
    hi: { label: "Coach", out: "Offer simple rakho. Log confuse na ho." },
  },
  {
    id: "re",
    tint: "from-sky-50/88 to-blue-50/32",
    en: { label: "Real estate", out: "Listings that build trust on mobile — fast scan, clear CTA." },
    hi: { label: "Real estate", out: "Listing mobile pe trust build kare." },
  },
  {
    id: "d2c",
    tint: "from-rose-50/88 to-pink-50/28",
    en: { label: "D2C", out: "Site + ads tell the same story — no mixed signals." },
    hi: { label: "D2C", out: "Site aur ads same story bole." },
  },
  {
    id: "local",
    tint: "from-stone-100/95 to-amber-50/22",
    en: { label: "Local business", out: "Show up on Google. Let customers reach you in one tap." },
    hi: { label: "Local", out: "Google pe milo. Customer seedha contact kare." },
  },
];

export function HomepageIndustryCases() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const eyebrow = isHinglish ? "Kaun-sa business" : "Your kind of business";
  const title = isHinglish ? "Lagta hai hum tumhara type samajhte hain" : "We usually get your kind of business";

  return (
    <section
      id="cases"
      className="relative scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/50 bg-[color-mix(in_srgb,var(--sx-canvas)_72%,white)] py-11 sm:py-[3.25rem]"
    >
      <div className="sx-container">
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{eyebrow}</p>
          <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.032em] text-[var(--sx-ink)] sm:text-[1.48rem]">
            {title}
          </h2>
        </div>

        <ul className="mt-9 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {CASES.map((row, idx) => {
            const c = isHinglish ? row.hi : row.en;
            return (
              <li
                key={row.id}
                className={[
                  "relative flex min-h-[9.25rem] flex-col justify-between rounded-[1.1rem] border border-stone-200/65 bg-gradient-to-br p-4 shadow-[var(--sx-shadow-sm)] transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-stone-300/70 motion-safe:hover:shadow-[var(--sx-shadow-md)] sm:min-h-[9.75rem] sm:p-[1.15rem]",
                  row.tint,
                  idx % 3 === 1 ? "lg:translate-y-2" : "",
                ].join(" ")}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600/90">{c.label}</p>
                <p className="mt-3 text-[14px] font-medium leading-snug text-[var(--sx-ink)] sm:mt-4 sm:text-[15px]">
                  {c.out}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
