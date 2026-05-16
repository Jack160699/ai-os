"use client";

import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const ITEMS = {
  en: [
    { t: "Websites that convert", d: "Clear pages. Fast load. Mobile first." },
    { t: "Ads that make sense", d: "Budget, creative, tracking — explained simply." },
    { t: "WhatsApp & bookings", d: "Flows that feel easy for customers." },
    { t: "Messaging that fits you", d: "What to say online — we help shape it." },
  ],
  hi: [
    { t: "Site jo kaam kare", d: "Clear page. Tez load. Phone pe sahi dikhe." },
    { t: "Ads jo samajh mein aaye", d: "Budget, creative, tracking — seedhi baat." },
    { t: "WhatsApp & booking", d: "Customer ke liye easy flow." },
    { t: "Words jo natural lagen", d: "Online kya bolna hai — saath mein set karte hain." },
  ],
};

export function HomepageWhatWeHelp() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const items = isHinglish ? ITEMS.hi : ITEMS.en;
  const eyebrow = isHinglish ? "Kaam" : "What we do";
  const title = isHinglish ? "Kahan kya help" : "What we help with";

  return (
    <section
      id="how-we-help"
      className="scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/50 bg-[var(--sx-surface)] py-10 sm:py-12"
    >
      <div className="sx-container relative">
        <div className="max-w-2xl lg:max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{eyebrow}</p>
          <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.032em] text-[var(--sx-ink)] sm:text-[1.48rem]">
            {title}
          </h2>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-10">
          {items.map((item, i) => (
            <li
              key={item.t}
              className={[
                "group relative overflow-hidden rounded-[1.05rem] border border-stone-200/75 bg-[color-mix(in_srgb,white_92%,var(--sx-surface-warm))] p-4 shadow-[0_1px_0_rgb(255_255_255/0.85)_inset] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-stone-300/80 hover:shadow-[var(--sx-shadow-md)] sm:p-5",
                i % 2 === 1 ? "sm:mt-2 lg:mt-3" : "",
              ].join(" ")}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[color-mix(in_srgb,var(--sx-green-mid)_08%,transparent)] blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
              <p className="relative text-[15px] font-semibold tracking-[-0.02em] text-[var(--sx-ink)]">{item.t}</p>
              <p className="relative mt-2 text-[13px] leading-relaxed text-[var(--sx-ink-secondary)] sm:text-[14px]">
                {item.d}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
