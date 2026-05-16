"use client";

import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

/** @type {{ id: string; en: { label: string; out: string; hint?: string }; hi: { label: string; out: string; hint?: string } }[]} */
const CASES = [
  {
    id: "gym",
    en: { label: "Gym", out: "More trials? People ask a lot — walk in less?", hint: "Booking shouldn’t feel like homework." },
    hi: { label: "Gym", out: "Trial lene wale badhane hain? Log poochhte bahut hain, aate kam?", hint: "WhatsApp pe seedha time book ho jaye bas." },
  },
  {
    id: "clinic",
    en: { label: "Clinic", out: "Same questions on loop? Patients don’t get how to book?", hint: "One place for timing + how to reach." },
    hi: { label: "Clinic", out: "Baar baar same calls aa rahe? Patient ko booking samajh nahi aati?", hint: "Ek hi jagah pe sab likh do — dimaag halke." },
  },
  {
    id: "coach",
    en: { label: "Coach", out: "People still don’t get what you actually do?", hint: "Say it plain in one line — that fixes half the mess." },
    hi: { label: "Coach", out: "Log samajh hi nahi pa rahe aap karte kya ho?", hint: "Pehli line se hi samajh aa jaye." },
  },
  {
    id: "re",
    en: { label: "Real estate", out: "Property has to feel genuine. Trust on mobile matters.", hint: "Small details = big trust on phone." },
    hi: { label: "Real estate", out: "Property genuine lagni chahiye. Mobile pe dekh ke trust banna chahiye.", hint: "Phone pe scroll karte waqt bhi solid lage." },
  },
  {
    id: "d2c",
    en: { label: "D2C", out: "Ad shows one thing — site shows something else?", hint: "Ad and site should match — less head-scratching." },
    hi: { label: "D2C", out: "Ad pe kuch aur dikhta hai, site pe kuch aur?", hint: "Dono jagah ek hi feel — dimaag calm." },
  },
  {
    id: "local",
    en: { label: "Local business", out: "Folks should find you on Google — without digging forever.", hint: "Type karo, mil jao — itna hi." },
    hi: { label: "Local", out: "Google pe milna easy hona chahiye.", hint: "Search pe naam aaye, number seedha dikhe." },
  },
];

export function HomepageIndustryCases() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const eyebrow = isHinglish ? "Kaun sa kaam" : "What you do";
  const title = isHinglish ? "Aise scenes mein help karte hain" : "Where we usually plug in";

  return (
    <section
      id="cases"
      className="relative scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/60 bg-[color-mix(in_srgb,var(--sx-canvas-deep)_12%,var(--sx-surface))] py-12 sm:py-[3.65rem]"
    >
      <div className="sx-container">
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{eyebrow}</p>
          <h2 className="mt-2.5 text-[1.38rem] font-semibold leading-[1.16] tracking-[-0.033em] text-[var(--sx-ink)] sm:text-[1.52rem]">
            {title}
          </h2>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[1.05rem] lg:mt-12">
          {CASES.map((row, idx) => {
            const c = isHinglish ? row.hi : row.en;
            return (
              <li
                key={row.id}
                className={[
                  "relative flex flex-col gap-1.5 rounded-xl border border-stone-200/78 bg-white/94 px-3.5 py-3.5 shadow-[var(--sx-shadow-sm)] transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-stone-300/80 motion-safe:hover:shadow-[var(--sx-shadow-md)] sm:gap-2 sm:px-4 sm:py-4",
                  idx % 2 === 1 ? "bg-stone-50/78" : "",
                  idx % 3 === 1 ? "lg:translate-y-1.5" : "",
                ].join(" ")}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600/90">{c.label}</p>
                <p className="text-[14px] font-medium leading-snug text-[var(--sx-ink)] sm:text-[15px]">{c.out}</p>
                {c.hint ? (
                  <p className="text-[12px] leading-[1.45] text-stone-600/92 sm:text-[12.5px]">{c.hint}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
