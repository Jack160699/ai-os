"use client";

import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "@/app/components/LanguagePreferenceProvider";
import { AiBusinessAuditLeadForm } from "@/app/components/AiBusinessAuditLeadForm";
import { WhatsAppLeadForm } from "@/app/components/WhatsAppLeadForm";

export function ContactPageBody() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;

  const intro = isHinglish
    ? "WhatsApp sabse tez. Form bharo — chat khulegi, text ready. Koi signup circus nahi."
    : "WhatsApp is fastest. Fill the four fields — your chat opens with everything typed. No signup maze.";

  const auditTitle = isHinglish
    ? "Pehle ek quick written snapshot?"
    : "Prefer a written snapshot first?";
  const auditSub = isHinglish
    ? "Business + site + optional Instagram — hum review karke clear reply karte hain."
    : "Business, site, optional Instagram — we review and reply with a clear next step.";

  return (
    <>
      <p className="text-[16px] font-medium leading-snug text-[var(--sx-ink)] sm:text-[17px]">{intro}</p>
      <div className="mt-7 sm:mt-8">
        <WhatsAppLeadForm variant="full" showEmailFallback />
      </div>

      <section className="mt-14 border-t border-stone-200/80 pt-12 sm:mt-16 sm:pt-14" aria-labelledby="audit-lead-heading">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">Free audit</p>
        <h2 id="audit-lead-heading" className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--sx-ink)] sm:text-[1.35rem]">
          {auditTitle}
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--sx-ink-secondary)] sm:text-[16px]">{auditSub}</p>
        <div className="mt-8">
          <AiBusinessAuditLeadForm embedded />
        </div>
      </section>
    </>
  );
}
