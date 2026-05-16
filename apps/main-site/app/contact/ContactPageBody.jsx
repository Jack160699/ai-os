"use client";

import { CONTACT } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "@/app/components/LanguagePreferenceProvider";
import { AiBusinessAuditLeadForm } from "@/app/components/AiBusinessAuditLeadForm";

function waHref(prefill) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  const q = prefill ? `?text=${encodeURIComponent(prefill)}` : "";
  return digits ? `https://wa.me/${digits}${q}` : "#";
}

export function ContactPageBody() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;

  const copy = isHinglish
    ? {
        intro:
          "Sabse easy? WhatsApp pe hi drop kar do. Form sirf tab jab typing comfortable ho.",
        wa: "WhatsApp pe likh do",
        waNote: "Hi — contact page se. Seedhi baat karni hai.",
        formLead: "Ya bas yah likh do",
        formSub: "Chhota sa. Jitna yaad aaye.",
      }
    : {
        intro: "Easiest is WhatsApp — just say hi. The form’s here if typing feels better.",
        wa: "Message on WhatsApp",
        waNote: "Hi — from the contact page. Wanted a quick human chat.",
        formLead: "Or type a little here",
        formSub: "Short is perfect. We’ll reply personally.",
      };

  return (
    <>
      <p className="text-[16px] font-medium leading-snug text-[var(--sx-ink)] sm:text-[17px]">{copy.intro}</p>
      <div className="mt-6">
        <a
          href={waHref(copy.waNote)}
          className="sx-btn-wa inline-flex min-h-[52px] w-full max-w-sm items-center justify-center rounded-full px-5 text-[15px] font-semibold tracking-[-0.02em] no-underline transition-[transform,filter] duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sx-green-mid)_55%,transparent)] focus-visible:ring-offset-2 motion-safe:active:scale-[0.99]"
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.wa}
        </a>
      </div>

      <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{copy.formLead}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--sx-ink-secondary)]">{copy.formSub}</p>
      <div className="mt-6">
        <AiBusinessAuditLeadForm variant="compact" />
      </div>
    </>
  );
}
