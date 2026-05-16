"use client";

import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

/** @type {{ id: string; en: { label: string; out: string }; hi: { label: string; out: string } }[]} */
const CASES = [
  {
    id: "gym",
    en: { label: "Gym", out: "More trials? People ask a lot — walk in less?" },
    hi: { label: "Gym", out: "Trial lene wale badhane hain? Log poochhte bahut hain, aate kam?" },
  },
  {
    id: "clinic",
    en: { label: "Clinic", out: "Same questions on loop? Patients don’t get how to book?" },
    hi: { label: "Clinic", out: "Baar baar same calls aa rahe? Patient ko booking samajh nahi aati?" },
  },
  {
    id: "coach",
    en: { label: "Coach", out: "People still don’t get what you actually do?" },
    hi: { label: "Coach", out: "Log samajh hi nahi pa rahe aap karte kya ho?" },
  },
  {
    id: "re",
    en: { label: "Real estate", out: "Property has to feel genuine. Trust on mobile matters." },
    hi: { label: "Real estate", out: "Property genuine lagni chahiye. Mobile pe dekh ke trust banna chahiye." },
  },
  {
    id: "d2c",
    en: { label: "D2C", out: "Ad shows one thing — site shows something else?" },
    hi: { label: "D2C", out: "Ad pe kuch aur dikhta hai, site pe kuch aur?" },
  },
  {
    id: "local",
    en: { label: "Local business", out: "Folks should find you on Google — without digging forever." },
    hi: { label: "Local", out: "Google pe milna easy hona chahiye." },
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
      className="relative scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/55 bg-[color-mix(in_srgb,var(--sx-canvas)_78%,white)] py-12 sm:py-[3.65rem]"
    >
      <div className="sx-container">
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{eyebrow}</p>
          <h2 className="mt-2.5 text-[1.38rem] font-semibold leading-[1.18] tracking-[-0.032em] text-[var(--sx-ink)] sm:text-[1.52rem]">
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
                  "relative flex min-h-[8.75rem] flex-col justify-between rounded-xl border border-stone-200/75 bg-white/92 p-4 shadow-[var(--sx-shadow-sm)] transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-stone-300/80 motion-safe:hover:shadow-[var(--sx-shadow-md)] sm:min-h-[9.15rem] sm:p-5",
                  idx % 2 === 1 ? "bg-stone-50/72" : "",
                  idx % 3 === 1 ? "lg:translate-y-1.5" : "",
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
