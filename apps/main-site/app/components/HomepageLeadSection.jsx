"use client";

import { CONTACT } from "@stratxcel/config";
import { AiBusinessAuditLeadForm } from "./AiBusinessAuditLeadForm";
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

export function HomepageLeadSection() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;

  const copy = isHinglish
    ? {
        eyebrow: "Bas itna",
        title: "Bas problem bata do.",
        sub: "Chhota form. Ya seedha WhatsApp — jo easy lage.",
        calm: "Khud reply karenge. Koi pressure pitch nahi.",
        wa: "WhatsApp Karein",
        waNote: "Hi — seedhi baat karni thi.",
      }
    : {
        eyebrow: "Quick one",
        title: "Just say what’s going wrong.",
        sub: "Small form. Or WhatsApp — whatever’s easier.",
        calm: "We reply ourselves. No pressure pitch.",
        wa: "WhatsApp",
        waNote: "Hi — wanted a quick chat, nothing formal.",
      };

  return (
    <section
      id="lead"
      className="relative scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/55 bg-[var(--sx-surface)] py-12 sm:py-[3.65rem]"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_72%_48%_at_0%_100%,color-mix(in_srgb,var(--sx-glow-amber)_24%,transparent),transparent)]"
        aria-hidden
      />
      <div className="sx-container relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-14">
          <div className="lg:col-span-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{copy.eyebrow}</p>
            <h2 className="mt-2.5 text-[1.38rem] font-semibold leading-[1.18] tracking-[-0.032em] text-[var(--sx-ink)] sm:text-[1.52rem]">
              {copy.title}
            </h2>
            <p className="mt-3 max-w-[44ch] text-[15px] leading-[1.66] text-[var(--sx-ink-secondary)]">{copy.sub}</p>
            <p className="mt-3 max-w-[42ch] text-[13px] leading-relaxed text-stone-500 sm:text-[14px]">{copy.calm}</p>

            <div className="mt-6">
              <a
                href={waHref(copy.waNote)}
                className="sx-btn-wa inline-flex min-h-[50px] w-full max-w-xs items-center justify-center rounded-full px-5 text-[14px] font-semibold tracking-[-0.02em] no-underline transition-[transform,box-shadow,filter] duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sx-green-mid)_55%,transparent)] focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] sm:text-[15px]"
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.wa}
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <AiBusinessAuditLeadForm variant="compact" className="lg:translate-y-0.5" />
          </div>
        </div>
      </div>
    </section>
  );
}
