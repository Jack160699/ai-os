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
        eyebrow: "Baat karein",
        title: "Apne business ke baare mein batao",
        sub: "Chhota form. Seedha point. Ya pehle WhatsApp — jo fast lage.",
        wa: "WhatsApp pe message",
        waNote: "Hi, StratXcel site se — form se pehle hi baat karni thi.",
      }
    : {
        eyebrow: "Contact",
        title: "Tell us about your business",
        sub: "Short form. Straight to the point. Or message us on WhatsApp first.",
        wa: "Message on WhatsApp",
        waNote: "Hi — I'm on StratXcel and wanted to chat before the form.",
      };

  return (
    <section
      id="lead"
      className="relative scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/50 bg-[var(--sx-surface)] py-10 sm:py-12"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_100%,color-mix(in_srgb,var(--sx-glow-amber)_28%,transparent),transparent)]"
        aria-hidden
      />
      <div className="sx-container relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{copy.eyebrow}</p>
            <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.032em] text-[var(--sx-ink)] sm:text-[1.48rem]">
              {copy.title}
            </h2>
            <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-[var(--sx-ink-secondary)]">{copy.sub}</p>

            <div className="mt-6">
              <a
                href={waHref(copy.waNote)}
                className="sx-btn-wa inline-flex min-h-[50px] w-full max-w-xs items-center justify-center rounded-full px-5 text-[14px] font-semibold tracking-[-0.02em] no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sx-green-mid)_55%,transparent)] focus-visible:ring-offset-2 sm:text-[15px]"
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.wa}
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <AiBusinessAuditLeadForm variant="compact" className="lg:translate-y-1" />
          </div>
        </div>
      </div>
    </section>
  );
}
