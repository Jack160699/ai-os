"use client";

import Link from "next/link";
import { CONTACT } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const waPrimaryClass =
  "inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#1a7f4a] px-5 text-[15px] font-semibold tracking-[-0.02em] text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_8px_24px_-8px_rgba(22,101,52,0.55)] transition-[transform,box-shadow,filter] duration-200 ease-out hover:brightness-[1.03] hover:shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_12px_28px_-10px_rgba(22,101,52,0.6)] active:translate-y-px sm:w-auto sm:min-w-[13.5rem]";

const secondaryClass =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-stone-300/90 bg-white/90 px-5 text-[14.5px] font-semibold tracking-[-0.015em] text-stone-800 shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:border-stone-400 hover:bg-white active:translate-y-px sm:w-auto sm:min-w-[11rem]";

function waHref(prefill) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  const q = prefill ? `?text=${encodeURIComponent(prefill)}` : "";
  return `https://wa.me/${digits}${q}`;
}

function HeroGrowthVisual({ isHinglish }) {
  const summary = isHinglish
    ? "Website, marketing, online help"
    : "Websites · Marketing · Online help";
  return (
    <div
      className="relative mx-auto w-full max-w-[17rem] rounded-2xl border border-stone-200/90 bg-gradient-to-b from-white to-stone-50/90 p-6 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_18px_48px_-28px_rgba(41,37,36,0.18)] sm:max-w-[19rem] sm:p-7 lg:mx-0"
      aria-hidden
    >
      <div className="flex h-[7.5rem] items-end justify-center gap-2 sm:h-[8rem] sm:gap-2.5">
        <div className="flex h-full w-[26%] max-w-[3.25rem] items-end">
          <div className="h-[48%] w-full rounded-lg bg-stone-300/95" />
        </div>
        <div className="flex h-full w-[26%] max-w-[3.25rem] items-end">
          <div className="h-[78%] w-full rounded-lg bg-stone-400/90" />
        </div>
        <div className="flex h-full w-[26%] max-w-[3.25rem] items-end">
          <div className="h-[58%] w-full rounded-lg bg-stone-300/95" />
        </div>
      </div>
      <p className="mt-5 text-center text-[13px] font-medium leading-snug text-stone-600">{summary}</p>
    </div>
  );
}

export function HeroCinematic() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;

  const copy = isHinglish
    ? {
        headline: "Business online grow karna hai?",
        sub: "Website, marketing, aur baaki online cheezein — hum simple tarike se karte hain.",
        wa: "WhatsApp pe baat karein",
        start: "Apne business ki baat karein",
        waNote: "Hi, StratXcel se baat karni hai. Mera business: ",
        trust: "Seedhi baat · Asli log",
      }
    : {
        headline: "Grow your business online without the confusion.",
        sub: "Websites, marketing, and the online work that helps you grow — explained simply.",
        wa: "Chat on WhatsApp",
        start: "Let's talk about your business",
        waNote: "Hi — I'd like to chat with StratXcel about growing my business online.",
        trust: "Straight answers · Real people",
      };

  return (
    <section
      id="hero-cinematic"
      className="relative z-10 overflow-hidden bg-transparent pb-8 pt-[calc(var(--sx-nav-h)+0.75rem)] sm:pb-9 sm:pt-[calc(var(--sx-nav-h)+1rem)]"
      aria-labelledby="hero-heading"
    >
      <div className="relative z-10 mx-auto w-full max-w-[var(--sx-max)] px-[var(--sx-gutter)]">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <div className="max-w-xl lg:max-w-none lg:pr-4">
            <h1
              id="hero-heading"
              className="text-balance text-[1.5rem] font-semibold leading-[1.18] tracking-[-0.032em] text-stone-900 sm:text-[1.65rem] sm:leading-[1.14] lg:text-[1.85rem]"
              suppressHydrationWarning
            >
              {copy.headline}
            </h1>
            <p
              className="mt-3 max-w-[40ch] text-[15px] leading-snug text-stone-600 sm:mt-3.5 sm:text-[16px] sm:leading-relaxed lg:max-w-[46ch]"
              suppressHydrationWarning
            >
              {copy.sub}
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <a
                href={waHref(copy.waNote)}
                className={waPrimaryClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.wa}
              </a>
              <Link href="/contact" className={secondaryClass}>
                {copy.start}
              </Link>
            </div>
            <p className="mt-3 text-[12px] text-stone-500 sm:mt-3.5" suppressHydrationWarning>
              {copy.trust}
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroGrowthVisual isHinglish={isHinglish} />
          </div>
        </div>
      </div>
    </section>
  );
}
