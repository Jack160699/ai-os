"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { CONTACT } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const BUSINESS_TYPES = [
  { value: "Gym / fitness", hi: "Gym / fitness" },
  { value: "Clinic / healthcare", hi: "Clinic / healthcare" },
  { value: "Coach / consultant", hi: "Coach / consultant" },
  { value: "Real estate", hi: "Real estate" },
  { value: "D2C / ecommerce", hi: "D2C / ecommerce" },
  { value: "Local shop / service", hi: "Local shop / service" },
  { value: "Other", hi: "Other / aur" },
];

function buildWaUrl(body) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  if (!digits) return "#";
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

const COPY = {
  en: {
    name: "Your name",
    namePh: "e.g. Rahul",
    business: "Business type",
    businessPh: "Pick what fits closest",
    businessEmpty: "Choose…",
    phone: "Phone / WhatsApp",
    phonePh: "Number you use on WhatsApp",
    help: "What do you need help with?",
    helpPh: "Short is fine — website, ads, leads…",
    submit: "Open WhatsApp with this message",
    submitShort: "Continue on WhatsApp",
    hint: "Opens WhatsApp on your phone — we don't store this in a CRM.",
    emailLine: "Prefer email?",
    back: "Back to home",
  },
  hi: {
    name: "Naam",
    namePh: "Jaise Rahul",
    business: "Business type",
    businessPh: "Jo closest lage woh",
    businessEmpty: "Chuno…",
    phone: "Phone / WhatsApp",
    phonePh: "Jis number se WhatsApp chalta hai",
    help: "Kis cheez mein help?",
    helpPh: "Chhota sa — site, ads, leads…",
    submit: "WhatsApp pe yeh message le jao",
    submitShort: "WhatsApp pe aage badho",
    hint: "WhatsApp khulega — hum CRM mein save nahi karte pehle.",
    emailLine: "Email zyada comfortable?",
    back: "Home wapas",
  },
};

const waBtnClass =
  "sx-btn-wa focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sx-green-mid)_55%,transparent)] focus-visible:ring-offset-2";

/**
 * @param {{ variant?: "full" | "compact"; showEmailFallback?: boolean; className?: string }} props
 */
export function WhatsAppLeadForm({ variant = "full", showEmailFallback = false, className = "" }) {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const t = isHinglish ? COPY.hi : COPY.en;

  const baseId = useId();
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [help, setHelp] = useState("");

  const messageBody = useMemo(() => {
    const lines = isHinglish
      ? [
          "Hi StratXcel —",
          name.trim() && `Naam: ${name.trim()}`,
          businessType && `Business: ${businessType}`,
          phone.trim() && `Phone / WhatsApp: ${phone.trim()}`,
          help.trim() && `Help: ${help.trim()}`,
        ]
      : [
          "Hi StratXcel —",
          name.trim() && `Name: ${name.trim()}`,
          businessType && `Business: ${businessType}`,
          phone.trim() && `Phone / WhatsApp: ${phone.trim()}`,
          help.trim() && `What I need: ${help.trim()}`,
        ];
    return lines.filter(Boolean).join("\n");
  }, [name, businessType, phone, help, isHinglish]);

  const waHref = buildWaUrl(
    messageBody.length > 20
      ? messageBody
      : isHinglish
        ? "Hi StratXcel — thodi help chahiye."
        : "Hi StratXcel — I'd like a bit of help.",
  );

  const compact = variant === "compact";
  const submitLabel = compact ? t.submitShort : t.submit;
  const pad = compact ? "p-4 sm:p-5" : "p-5 sm:p-6";

  return (
    <div className={className}>
      <div className={`sx-form-surface ${pad} space-y-4`}>
        <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : ""}`}>
          <div>
            <label className="sx-label" htmlFor={`${baseId}-name`}>
              {t.name}
            </label>
            <input
              id={`${baseId}-name`}
              className="sx-input"
              type="text"
              name="name"
              autoComplete="name"
              placeholder={t.namePh}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="sx-label" htmlFor={`${baseId}-phone`}>
              {t.phone}
            </label>
            <input
              id={`${baseId}-phone`}
              className="sx-input"
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              placeholder={t.phonePh}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="sx-label" htmlFor={`${baseId}-biz`}>
            {t.business}
          </label>
          <select
            id={`${baseId}-biz`}
            className="sx-select"
            name="businessType"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          >
            <option value="">{t.businessEmpty}</option>
            {BUSINESS_TYPES.map((row) => (
              <option key={row.value} value={row.value}>
                {isHinglish ? row.hi : row.value}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-stone-500">{t.businessPh}</p>
        </div>

        <div>
          <label className="sx-label" htmlFor={`${baseId}-help`}>
            {t.help}
          </label>
          <textarea
            id={`${baseId}-help`}
            className="sx-textarea"
            name="help"
            rows={compact ? 3 : 4}
            placeholder={t.helpPh}
            value={help}
            onChange={(e) => setHelp(e.target.value)}
          />
        </div>
      </div>

      <div className={`${compact ? "mt-5" : "mt-6"} flex flex-col gap-3`}>
        <a
          href={waHref}
          className={`${waBtnClass} inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-6 text-[15px] font-semibold tracking-[-0.02em] no-underline sm:min-h-[54px]`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {submitLabel}
        </a>
        <p className="text-center text-[12px] leading-relaxed text-stone-500 sm:text-[13px]">{t.hint}</p>
      </div>

      {showEmailFallback ? (
        <div className="mt-8 border-t border-stone-200/70 pt-6 text-[14px] text-[color:var(--sx-ink-secondary)]">
          <p>
            {t.emailLine}{" "}
            <a
              className="font-semibold text-[var(--sx-ink)] underline decoration-stone-300/80 underline-offset-[5px] transition-colors hover:decoration-stone-400"
              href={`mailto:${CONTACT.email}`}
            >
              {CONTACT.email}
            </a>
          </p>
          <p className="mt-5">
            <Link
              href="/"
              className="font-semibold text-[var(--sx-ink)] underline decoration-stone-300/80 underline-offset-[5px] transition-colors hover:decoration-stone-400"
            >
              {t.back}
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
