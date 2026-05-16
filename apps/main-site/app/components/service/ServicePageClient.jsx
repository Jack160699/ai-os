"use client";

import Link from "next/link";
import { CONTACT } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "@/app/components/LanguagePreferenceProvider";
import { getServiceCopy } from "@/app/data/servicePages";
import { ServiceVisualStrip } from "./ServiceVisualStrip";

function waHref(note) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  if (!digits) return "/#lead";
  return `https://wa.me/${digits}?text=${encodeURIComponent(note)}`;
}

export function ServicePageClient({ slug }) {
  const pack = getServiceCopy(slug);
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const c = pack ? (isHinglish ? pack.hi : pack.en) : null;

  if (!c) {
    return (
      <div className="sx-container py-20">
        <p className="text-stone-600">Page missing.</p>
      </div>
    );
  }

  const waNote = isHinglish ? `Hi — ${c.eyebrow} page se. ${c.ctaTitle}` : `Hi — from the ${c.eyebrow} page. ${c.ctaTitle}`;

  return (
    <div className="border-b border-stone-200/60">
      <section className="border-b border-stone-200/50 bg-[color-mix(in_srgb,var(--sx-canvas)_92%,white)] py-12 sm:py-16">
        <div className="sx-container max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{c.eyebrow}</p>
          <h1 className="mt-2.5 text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.034em] text-[var(--sx-ink)] sm:text-[2rem]">
            {c.title}
          </h1>
        </div>
      </section>

      <section className="border-b border-stone-200/45 bg-[var(--sx-surface)] py-11 sm:py-14">
        <div className="sx-container max-w-3xl">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            {isHinglish ? "Asli dikkat" : "The real pain"}
          </h2>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.68] text-[color:var(--sx-ink-secondary)] sm:text-[16px]">
            {c.painLines}
          </p>
        </div>
      </section>

      <section className="border-b border-stone-200/45 bg-[color-mix(in_srgb,var(--sx-surface-warm)_35%,var(--sx-surface))] py-11 sm:py-14">
        <div className="sx-container max-w-3xl">
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--sx-ink)]">{c.buildTitle}</h2>
          <ul className="mt-5 space-y-2.5 text-[15px] leading-[1.55] text-[color:var(--sx-ink-secondary)]">
            {c.buildItems.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sx-green-mid)]/45" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {slug === "automation" && c.anchorWhatsapp && c.anchorCrm ? (
            <div className="mt-10 space-y-8 border-t border-stone-200/60 pt-10">
              <div id="whatsapp">
                <h3 className="text-[1.02rem] font-semibold text-[var(--sx-ink)]">{c.anchorWhatsapp}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--sx-ink-secondary)]">
                  {isHinglish
                    ? "Auto-reply, labels, team routing — taaki inbox dimaag kharab na kare."
                    : "Auto-replies, labels, routing — so the inbox stops eating your day."}
                </p>
              </div>
              <div id="crm">
                <h3 className="text-[1.02rem] font-semibold text-[var(--sx-ink)]">{c.anchorCrm}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--sx-ink-secondary)]">
                  {isHinglish
                    ? "Lead stages, owner, reminder — taaki koi lead floor pe na gir jaye."
                    : "Stages, owners, reminders — so leads don’t hit the floor."}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-b border-stone-200/45 bg-[var(--sx-surface)] py-11 sm:py-14">
        <div className="sx-container max-w-4xl">
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--sx-ink)]">{c.visualsTitle}</h2>
          <div className="mt-8">
            <ServiceVisualStrip captions={c.visualCaptions} />
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200/45 bg-[color-mix(in_srgb,var(--sx-canvas)_88%,white)] py-11 sm:py-14">
        <div className="sx-container max-w-xl">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            {isHinglish ? "Process" : "Process"}
          </h2>
          <ol className="mt-6 space-y-6">
            {c.process.map((step, i) => (
              <li key={`${slug}-${i}`} className="relative pl-8">
                <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-white text-[11px] font-semibold text-stone-600">
                  {i + 1}
                </span>
                <p className="font-semibold text-[var(--sx-ink)]">{step.t}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-[color:var(--sx-ink-secondary)]">{step.d}</p>
                {i < c.process.length - 1 ? (
                  <span className="mt-4 block pl-1 text-stone-400" aria-hidden>
                    ↓
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[color-mix(in_srgb,var(--sx-surface-warm)_40%,var(--sx-surface))] py-12 sm:py-16">
        <div className="sx-container max-w-xl text-center">
          <h2 className="text-[1.25rem] font-semibold leading-snug tracking-[-0.025em] text-[var(--sx-ink)] sm:text-[1.35rem]">
            {c.ctaTitle}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[color:var(--sx-ink-secondary)] sm:text-[15px]">{c.ctaSub}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={waHref(waNote)}
              className="sx-btn-wa inline-flex min-h-[50px] w-full max-w-xs items-center justify-center rounded-full px-6 text-[14px] font-semibold no-underline sm:w-auto"
              target="_blank"
              rel="noopener noreferrer"
            >
              {isHinglish ? "WhatsApp Karein" : "WhatsApp"}
            </a>
            <Link
              href="/#lead"
              className="sx-btn-secondary-elegant inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-full px-6 text-[14px] font-semibold sm:w-auto"
            >
              {isHinglish ? "Form" : "Leave details"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
