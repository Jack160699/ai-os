"use client";

import { CONTACT } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const waPrimaryClass =
  "sx-btn-wa inline-flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold tracking-[-0.02em] transition-[transform,box-shadow,filter] duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sx-green-mid)_55%,transparent)] focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] sm:w-auto sm:min-w-[15.5rem]";

const secondaryClass =
  "sx-btn-secondary-elegant inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-full px-5 text-[14px] font-semibold tracking-[-0.015em] transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/60 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] sm:min-h-[50px] sm:w-auto sm:min-w-[13rem]";

function waHref(prefill) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  const q = prefill ? `?text=${encodeURIComponent(prefill)}` : "";
  return `https://wa.me/${digits}${q}`;
}

export function HeroCinematic() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;

  const copy = isHinglish
    ? {
        kicker: "Stratxcel · website, ads, WhatsApp",
        headline: "Online mein kuch na kuch gadbad chal rahi hai kya?",
        sub: "Ads chal rahe hain, site bhi bani hui hai… fir bhi kaam utna nahi aa raha?\n\nKabhi WhatsApp bikhar jaata hai.\nKabhi log dekh ke chale jaate hain.\n\nBas wahi set karte hain.",
        wa: "WhatsApp Karein",
        seeHow: "Kaam Dekhein",
        waNote: "Hi — online thoda off lag raha hai, baat karni thi.",
        trust: "Usually same day reply. Koi awkward sales call nahi.",
      }
    : {
        kicker: "Stratxcel · websites, ads & WhatsApp",
        headline: "Something’s clearly not clicking online?",
        sub: "Ads on, site’s up — still doesn’t feel like it’s working?\n\nSometimes WhatsApp is a mess.\nSometimes people look and leave.\n\nWe help sort that — plain talk.",
        wa: "WhatsApp us",
        seeHow: "See what we fix",
        waNote: "Hi — something feels off online. Can we chat?",
        trust: "Usually same-day reply. No awkward sales call.",
      };

  return (
    <section
      id="hero-cinematic"
      className="relative z-10 overflow-hidden border-b border-stone-200/60 bg-[color-mix(in_srgb,var(--sx-canvas)_88%,white)] pb-11 pt-[calc(var(--sx-nav-h)+0.75rem)] sm:pb-[3.15rem] sm:pt-[calc(var(--sx-nav-h)+1rem)]"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_100%_-10%,color-mix(in_srgb,var(--sx-green-mid)_9%,transparent),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--sx-glow-amber)_70%,transparent)] blur-3xl sm:top-20"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[var(--sx-max)] px-[var(--sx-gutter)]">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7 lg:pr-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{copy.kicker}</p>
            <h1
              id="hero-heading"
              className="mt-2.5 text-balance text-[1.62rem] font-semibold leading-[1.13] tracking-[-0.034em] text-[var(--sx-ink)] sm:mt-3 sm:text-[1.88rem] sm:leading-[1.09] lg:text-[1.98rem]"
              suppressHydrationWarning
            >
              {copy.headline}
            </h1>
            <p
              className="mt-4 max-w-[52ch] whitespace-pre-line text-[15px] leading-[1.68] text-[color:var(--sx-ink-secondary)] sm:mt-5 sm:text-[16px]"
              suppressHydrationWarning
            >
              {copy.sub}
            </p>

            <div className="mt-7 flex max-w-xl flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-stretch">
              <a
                href={waHref(copy.waNote)}
                className={waPrimaryClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.wa}
              </a>
              <a href="#services" className={secondaryClass}>
                {copy.seeHow}
              </a>
            </div>
            <p
              className="mt-3.5 max-w-[48ch] text-[12px] leading-relaxed text-stone-500 sm:mt-4 sm:text-[13px]"
              suppressHydrationWarning
            >
              {copy.trust}
            </p>
          </div>

          <div className="relative lg:col-span-5 lg:mt-6 lg:flex lg:justify-end" aria-hidden={false}>
            <div className="relative w-full max-w-md lg:max-w-none">
              <div
                className="absolute -right-5 top-5 hidden h-[7.25rem] w-[88%] rounded-[1.15rem] border border-white/55 bg-white/48 shadow-[var(--sx-shadow-sm)] backdrop-blur-md transition-[opacity,transform] duration-500 ease-out lg:block"
                aria-hidden
              />
              <div className="relative rounded-[1.1rem] border border-stone-200/80 bg-[color-mix(in_srgb,white_88%,var(--sx-surface-warm))] p-5 shadow-[var(--sx-shadow-sm)] transition-[box-shadow,border-color] duration-300 ease-out sm:p-6">
                <p className="text-[14px] font-medium leading-snug text-[var(--sx-ink)] sm:text-[15px]">
                  {isHinglish
                    ? "Paise ja rahe hain, samajh nahi aa raha kya chal raha hai? Wahi cheezein thodi set karne mein madad karte hain."
                    : "Money going out and hard to tell what’s working? We help untangle the messy bits — step by step."}
                </p>
                <div className="mt-4 flex gap-2.5 border-t border-stone-200/60 pt-4">
                  <span className="mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--sx-green-mid)]" />
                  <p className="text-[13px] leading-relaxed text-[var(--sx-ink-secondary)]">
                    {isHinglish
                      ? "Message karo. Seedha banda reply karega."
                      : "Message us. A real person replies."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
