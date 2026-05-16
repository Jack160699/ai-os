"use client";

import { CONTACT } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const waPrimaryClass =
  "sx-btn-wa inline-flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold tracking-[-0.02em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sx-green-mid)_55%,transparent)] focus-visible:ring-offset-2 sm:w-auto sm:min-w-[15.5rem]";

const secondaryClass =
  "sx-btn-secondary-elegant inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-full px-5 text-[14px] font-semibold tracking-[-0.015em] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/60 focus-visible:ring-offset-2 sm:min-h-[50px] sm:w-auto sm:min-w-[13rem]";

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
        kicker: "StratXcel · website, ads, WhatsApp",
        headline: "Online customers nahi aa rahe?",
        sub: "Website, ads aur online setup mein help chahiye? Hum simple way mein business ko online strong banate hain.",
        wa: "WhatsApp Pe Baat Karein",
        seeHow: "Dekhein Hum Kya Karte Hain",
        waNote: "Hi, StratXcel site dekh raha hoon — thodi help chahiye.",
        trust: "Mostly same day reply. Koi pressure pitch nahi.",
      }
    : {
        kicker: "StratXcel · websites, ads & WhatsApp",
        headline: "Struggling to get customers online?",
        sub: "We help businesses improve websites, marketing, and online growth without the confusion.",
        wa: "Chat on WhatsApp",
        seeHow: "See How We Help",
        waNote: "Hi — I'm on the StratXcel site and need a bit of help.",
        trust: "We usually reply the same day. No scripted sales call.",
      };

  return (
    <section
      id="hero-cinematic"
      className="relative z-10 overflow-hidden border-b border-stone-200/50 pb-10 pt-[calc(var(--sx-nav-h)+0.6rem)] sm:pb-12 sm:pt-[calc(var(--sx-nav-h)+0.85rem)]"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_100%_-10%,color-mix(in_srgb,var(--sx-green-mid)_9%,transparent),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--sx-glow-amber)_75%,transparent)] blur-3xl sm:top-20"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[var(--sx-max)] px-[var(--sx-gutter)]">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7 lg:pr-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{copy.kicker}</p>
            <h1
              id="hero-heading"
              className="mt-2.5 text-balance text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.038em] text-[var(--sx-ink)] sm:mt-3 sm:text-[1.9rem] sm:leading-[1.08] lg:text-[2.05rem]"
              suppressHydrationWarning
            >
              {copy.headline}
            </h1>
            <p
              className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[color:var(--sx-ink-secondary)] sm:mt-5 sm:text-[16px] sm:leading-relaxed"
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
              <a href="#how-we-help" className={secondaryClass}>
                {copy.seeHow}
              </a>
            </div>
            <p
              className="mt-4 max-w-[46ch] text-[12px] leading-relaxed text-stone-500 sm:text-[13px]"
              suppressHydrationWarning
            >
              {copy.trust}
            </p>
          </div>

          <div
            className="relative lg:col-span-5 lg:mt-4 lg:flex lg:justify-end"
            aria-hidden={false}
          >
            <div className="relative w-full max-w-md lg:max-w-none">
              <div
                className="absolute -right-6 top-6 hidden h-28 w-[88%] rounded-2xl border border-white/60 bg-white/50 shadow-[var(--sx-shadow-sm)] backdrop-blur-md lg:block"
                aria-hidden
              />
              <div className="relative rounded-2xl border border-stone-200/80 bg-[color-mix(in_srgb,white_82%,var(--sx-surface-warm))] p-5 shadow-[var(--sx-shadow-md)] sm:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                  {isHinglish ? "Seedhi baat" : "Plain talk"}
                </p>
                <p className="mt-3 text-[14px] font-medium leading-snug text-[var(--sx-ink)] sm:text-[15px]">
                  {isHinglish
                    ? "Jargon kam. Next step clear. WhatsApp se shuru — jitna comfortable ho."
                    : "Less jargon. Clear next steps. Start on WhatsApp — whatever feels easiest."}
                </p>
                <div className="mt-4 flex gap-2 border-t border-stone-200/70 pt-4">
                  <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--sx-green-mid)]" />
                  <p className="text-[13px] leading-relaxed text-[var(--sx-ink-secondary)]">
                    {isHinglish
                      ? "Team chhoti hai. Kaam samajh ke karti hai."
                      : "Small team. We read what you actually need."}
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
