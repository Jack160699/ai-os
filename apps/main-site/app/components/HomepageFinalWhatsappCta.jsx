"use client";

import Link from "next/link";
import { CONTACT } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

function waHref(prefill) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  const q = prefill ? `?text=${encodeURIComponent(prefill)}` : "";
  return digits ? `https://wa.me/${digits}${q}` : "#";
}

/** WhatsApp primary — matches hero weight so it clearly dominates. */
const waPrimaryClass =
  "inline-flex min-h-[54px] w-full max-w-[min(100%,20rem)] items-center justify-center rounded-full bg-[#1a7f4a] px-6 text-[15px] font-semibold tracking-[-0.02em] text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_10px_32px_-10px_rgba(22,101,52,0.5)] transition-[transform,box-shadow,filter] duration-200 ease-out hover:brightness-[1.03] hover:shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_14px_36px_-12px_rgba(22,101,52,0.55)] active:translate-y-px sm:mx-auto sm:min-w-[15rem]";

const secondaryClass =
  "inline-flex min-h-[46px] w-full max-w-[min(100%,20rem)] items-center justify-center rounded-full border border-stone-300/80 bg-white/85 px-6 text-[14px] font-semibold tracking-[-0.015em] text-stone-700 shadow-[0_1px_0_rgba(255,255,255,0.95)_inset] transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out hover:border-stone-400/90 hover:bg-white active:translate-y-px sm:mx-auto sm:min-w-[11.5rem]";

export function HomepageFinalWhatsappCta() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;

  const copy = isHinglish
    ? {
        title: "Chalo, business ko aage badhate hain.",
        sub: "Batado kis cheez mein help chahiye.",
        cta: "WhatsApp pe baat karein",
        start: "Shuru karein",
        prefill: "Hi, StratXcel se baat karni hai. Mujhe help chahiye: ",
      }
    : {
        title: "Let's grow your business.",
        sub: "Tell us what you need help with.",
        cta: "Chat on WhatsApp",
        start: "Get Started",
        prefill: "Hi — I'd like help from StratXcel with: ",
      };

  return (
    <section
      id="final-cta"
      className="relative scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] overflow-hidden border-b border-stone-200/80"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/35 via-[rgb(255_253_248)] to-stone-100/40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-28 left-1/2 h-[14rem] w-[min(100%,36rem)] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-100/30 via-white/50 to-emerald-50/25 blur-3xl"
        aria-hidden
      />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-stone-100/30 to-transparent" aria-hidden />

      <div className="relative z-10 mx-auto max-w-[var(--sx-max)] px-[var(--sx-gutter)] py-12 sm:py-16">
        <div className="mx-auto max-w-lg rounded-[1.35rem] border border-stone-200/70 bg-white/75 px-6 py-9 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_24px_48px_-32px_rgba(41,37,36,0.12)] backdrop-blur-sm sm:px-10 sm:py-10">
          <div className="text-center">
            <h2 className="text-balance text-[1.35rem] font-semibold leading-snug tracking-[-0.03em] text-stone-900 sm:text-[1.5rem]">
              {copy.title}
            </h2>
            <p className="mx-auto mt-3 max-w-[32ch] text-[15px] leading-relaxed text-stone-600 sm:text-[16px]">{copy.sub}</p>

            <div className="mx-auto mt-9 flex w-full max-w-md flex-col items-stretch gap-3 sm:mt-10">
              <a
                href={waHref(copy.prefill)}
                className={waPrimaryClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.cta}
              </a>
              <Link href="/#what-we-help" className={secondaryClass}>
                {copy.start}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
