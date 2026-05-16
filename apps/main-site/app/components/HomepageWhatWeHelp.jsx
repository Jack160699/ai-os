"use client";

import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const ITEMS = {
  en: [
    {
      t: "Site looks fine — but nothing really happens?",
      d: "People look… then leave. We figure out what’s breaking in the middle.",
    },
    {
      t: "People click the ad — then get lost?",
      d: "Ad says one thing… they land and it feels like something else.",
    },
    {
      t: "Money going out — hard to tell what’s actually working?",
      d: "Stuff’s running… you just can’t read it. We help make sense of it — plain talk.",
    },
    {
      t: "WhatsApp eating the whole day?",
      d: "Same questions again and again.\nReplies here, orders there.\nWe help calm it down.",
    },
  ],
  hi: [
    {
      t: "Website achhi lagti hai, par message nahi aate?",
      d: "Log dekhte hain… phir bina bole chale jaate hain.\nBeech mein kya toot raha hai, wahi dekhte hain.",
    },
    {
      t: "Ad pe click karne ke baad banda confuse ho jaata hai kya?",
      d: "Ad pe kuch aur dikhta hai…\nandar jaake kuch aur?",
    },
    {
      t: "Paise ja rahe hain, pata hi nahi kya chal raha hai?",
      d: "Sab chal toh raha hai… bas samajh nahi aa raha.",
    },
    {
      t: "WhatsApp pe reply dena hi alag kaam ban gaya?",
      d: "Wahi sawaal baar baar.\nReply alag.\nOrder alag.",
    },
  ],
};

export function HomepageWhatWeHelp() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const items = isHinglish ? ITEMS.hi : ITEMS.en;
  const eyebrow = isHinglish ? "Stress kahan hai" : "What’s off";
  const title = isHinglish ? "Yeh baatein aam hain" : "Sound familiar?";

  return (
    <section
      id="how-we-help"
      className="scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/60 bg-[color-mix(in_srgb,var(--sx-surface)_88%,var(--sx-canvas-mid))] py-12 sm:py-[3.65rem]"
    >
      <div className="sx-container relative">
        <div className="max-w-2xl lg:max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{eyebrow}</p>
          <h2 className="mt-2.5 text-[1.38rem] font-semibold leading-[1.16] tracking-[-0.033em] text-[var(--sx-ink)] sm:text-[1.52rem]">
            {title}
          </h2>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-[1.05rem] lg:mt-12">
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
              <p className="relative text-[15px] font-semibold leading-snug tracking-[-0.02em] text-[var(--sx-ink)]">{item.t}</p>
              <p className="relative mt-2 whitespace-pre-line text-[13px] leading-[1.58] text-[var(--sx-ink-secondary)] sm:mt-2.5 sm:text-[14px]">
                {item.d}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
