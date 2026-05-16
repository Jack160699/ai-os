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

const waBtnClass =
  "sx-btn-wa inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-6 text-[15px] font-semibold tracking-[-0.02em] no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sx-green-mid)_55%,transparent)] focus-visible:ring-offset-2 sm:max-w-md sm:mx-auto";

const formLinkClass =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-full text-[14px] font-semibold text-[var(--sx-ink-secondary)] underline decoration-stone-300/75 underline-offset-[6px] transition-colors hover:text-[var(--sx-ink)] hover:decoration-stone-400 sm:max-w-md sm:mx-auto";

export function HomepageFinalWhatsappCta() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;

  const copy = isHinglish
    ? {
        title: "Ab baat shuru karein?",
        sub: "Neeche WhatsApp — ya contact page pe chhota form, jo aapko comfortable lage.",
        cta: "WhatsApp khol do",
        prefill: "Hi, StratXcel site se. Mujhe help chahiye: ",
        form: "Form wala option",
      }
    : {
        title: "Prefer to type it once?",
        sub: "WhatsApp opens in one tap — or use the short form if that's easier on mobile.",
        cta: "Open WhatsApp",
        prefill: "Hi — I'm on the StratXcel site and would like help with: ",
        form: "Go to the contact form",
      };

  return (
    <section
      id="final-cta"
      className="relative scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/55"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/22 via-transparent to-[var(--sx-canvas-mid)]/28"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-[var(--sx-max)] px-[var(--sx-gutter)] py-9 sm:py-10">
        <div className="sx-glass-page mx-auto max-w-md px-6 py-8 text-center sm:px-8 sm:py-9">
          <h2 className="text-[1.28rem] font-semibold tracking-[-0.035em] text-[var(--sx-ink)] sm:text-[1.38rem]">
            {copy.title}
          </h2>
          <p className="mx-auto mt-2.5 max-w-[36ch] text-[14px] leading-relaxed text-[color:var(--sx-ink-secondary)] sm:mt-3 sm:text-[15px]">
            {copy.sub}
          </p>
          <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-8">
            <a href={waHref(copy.prefill)} className={waBtnClass} target="_blank" rel="noopener noreferrer">
              {copy.cta}
            </a>
            <Link href="/contact" className={formLinkClass}>
              {copy.form}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
