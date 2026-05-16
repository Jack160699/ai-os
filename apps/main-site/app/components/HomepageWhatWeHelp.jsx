"use client";

import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const ITEMS = {
  en: [
    { t: "Site looks fine — but it’s not working?", d: "We tighten the story, speed, and mobile flow so people actually act." },
    { t: "Log aa rahe, inquiry nahi?", d: "We fix the funnel: what they see first, what they click, what happens next." },
    { t: "Ads feel like money down the drain?", d: "Clear offer, simple tracking — less guesswork, more signal." },
    { t: "WhatsApp getting messy?", d: "Cleaner replies, calmer templates — customers feel taken care of." },
  ],
  hi: [
    { t: "Site dekhne mein theek, par kaam nahi kar rahi?", d: "Story, speed, mobile flow — taaki banda actually aage badhe." },
    { t: "Log aa rahe hain, inquiry nahi?", d: "Pehla message, pehla click, next step — sab clear karte hain." },
    { t: "Ads paise pe paani ki tarah?", d: "Offer clear, tracking simple — kam guess, zyada idea kya chal raha hai." },
    { t: "WhatsApp pe haath fad fad?", d: "Jawab seedhe, template calm — customer ko lagta hai koi hai idhar." },
  ],
};

export function HomepageWhatWeHelp() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const items = isHinglish ? ITEMS.hi : ITEMS.en;
  const eyebrow = isHinglish ? "Dikkat kahan hai" : "What's stuck";
  const title = isHinglish ? "Woh cheezein jo aksar uljhaati hain" : "What usually feels stuck";

  return (
    <section
      id="how-we-help"
      className="scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/50 bg-[var(--sx-surface)] py-11 sm:py-[3.25rem]"
    >
      <div className="sx-container relative">
        <div className="max-w-2xl lg:max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{eyebrow}</p>
          <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.032em] text-[var(--sx-ink)] sm:text-[1.48rem]">
            {title}
          </h2>
        </div>

        <ul className="mt-9 grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:mt-11">
          {items.map((item, i) => (
            <li
              key={item.t}
              className={[
                "group relative overflow-hidden rounded-[1.08rem] border border-stone-200/70 bg-[color-mix(in_srgb,white_93%,var(--sx-surface-warm))] p-4 shadow-[var(--sx-shadow-sm)] transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-stone-300/75 motion-safe:hover:shadow-[var(--sx-shadow-md)] sm:p-[1.15rem]",
                i % 2 === 1 ? "sm:mt-1 lg:mt-2" : "",
              ].join(" ")}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[color-mix(in_srgb,var(--sx-green-mid)_07%,transparent)] blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
              <p className="relative text-[15px] font-semibold tracking-[-0.02em] text-[var(--sx-ink)]">{item.t}</p>
              <p className="relative mt-2 text-[13px] leading-relaxed text-[var(--sx-ink-secondary)] sm:mt-2.5 sm:text-[14px]">
                {item.d}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
