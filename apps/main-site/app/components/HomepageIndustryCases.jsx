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
    tint: "from-amber-50/90 to-orange-50/40",
    en: { label: "Gyms", out: "More trials. Cleaner class packs. WhatsApp that books." },
    hi: { label: "Gym", out: "Trial badhao. Pack clear karo. WhatsApp se slot book." },
  },
  {
    id: "clinic",
    tint: "from-emerald-50/90 to-teal-50/35",
    en: { label: "Clinics", out: "Calm site. Clear hours. Less phone chaos." },
    hi: { label: "Clinic", out: "Site calm. Time clear. Phone kam, confusion kam." },
  },
  {
    id: "coach",
    tint: "from-violet-50/80 to-indigo-50/30",
    en: { label: "Coaches", out: "Offer clarity. One link to pay or book." },
    hi: { label: "Coach", out: "Offer clear. Ek link — book ya pay." },
  },
  {
    id: "re",
    tint: "from-sky-50/85 to-blue-50/35",
    en: { label: "Real estate", out: "Listings that scan fast. Trust on mobile." },
    hi: { label: "Real estate", out: "Listing mobile pe fast scan. Trust dikhe." },
  },
  {
    id: "d2c",
    tint: "from-rose-50/85 to-pink-50/30",
    en: { label: "D2C brands", out: "Site + ads that match your product story." },
    hi: { label: "D2C", out: "Site + ads jo product ki story se mile." },
  },
  {
    id: "local",
    tint: "from-stone-100/95 to-amber-50/25",
    en: { label: "Local businesses", out: "Maps, hours, offers — customers find you." },
    hi: { label: "Local business", out: "Maps, time, offer — customer aap tak aaye." },
  },
];

export function HomepageIndustryCases() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const eyebrow = isHinglish ? "Industries" : "Industries";
  const title = isHinglish ? "Kaun-se business ke liye" : "Who we often work with";

  return (
    <section
      id="cases"
      className="relative scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/50 bg-[color-mix(in_srgb,var(--sx-canvas)_70%,white)] py-10 sm:py-12"
    >
      <div className="sx-container">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{eyebrow}</p>
            <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.032em] text-[var(--sx-ink)] sm:text-[1.48rem]">
              {title}
            </h2>
          </div>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {CASES.map((row, idx) => {
            const c = isHinglish ? row.hi : row.en;
            return (
              <li
                key={row.id}
                className={[
                  "relative flex min-h-[8.5rem] flex-col justify-between rounded-[1.08rem] border border-stone-200/70 bg-gradient-to-br p-4 shadow-[var(--sx-shadow-sm)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--sx-shadow-md)] sm:min-h-[9rem] sm:p-5",
                  row.tint,
                  idx % 3 === 1 ? "lg:translate-y-2" : "",
                ].join(" ")}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600/90">{c.label}</p>
                <p className="mt-3 text-[14px] font-medium leading-snug text-[var(--sx-ink)] sm:text-[15px]">
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
