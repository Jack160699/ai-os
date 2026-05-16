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
        intro: "Sabse tez — WhatsApp. Form optional hai, details bhejo, hum reply karenge.",
        wa: "WhatsApp khol do",
        waNote: "Hi, StratXcel contact page se — baat karni hai.",
      }
    : {
        intro: "Fastest is WhatsApp. The form is optional — send details if that’s easier.",
        wa: "Open WhatsApp",
        waNote: "Hi — I'm on the StratXcel contact page and want to chat.",
      };

  return (
    <>
      <p className="text-[16px] font-medium leading-snug text-[var(--sx-ink)] sm:text-[17px]">{copy.intro}</p>
      <div className="mt-6">
        <a
          href={waHref(copy.waNote)}
          className="sx-btn-wa inline-flex min-h-[52px] w-full max-w-sm items-center justify-center rounded-full px-5 text-[15px] font-semibold tracking-[-0.02em] no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sx-green-mid)_55%,transparent)] focus-visible:ring-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.wa}
        </a>
      </div>

      <p className="mt-10 text-[13px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {isHinglish ? "Form" : "Form"}
      </p>
      <p className="mt-2 text-[15px] text-[var(--sx-ink-secondary)]">
        {isHinglish
          ? "Neeche chhota sa — bas basics."
          : "Short one below — just the basics."}
      </p>
      <div className="mt-6">
        <AiBusinessAuditLeadForm variant="compact" />
      </div>
    </>
  );
}
