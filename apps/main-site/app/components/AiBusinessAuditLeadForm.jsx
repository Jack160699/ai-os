"use client";

import { useCallback, useId, useState } from "react";
import { CONTACT } from "@stratxcel/config";
import { validateAuditLeadPayload } from "@/app/lib/auditLeadValidation";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const INITIAL = {
  business_name: "",
  website: "",
  instagram: "",
  problem: "",
  phone: "",
};

const COPY = {
  en: {
    biz: "Business name",
    bizPh: "Your brand or shop name",
    site: "Website",
    sitePh: "yoursite.com or full URL",
    ig: "Instagram",
    igPh: "@handle if you want",
    phone: "Phone / WhatsApp",
    phonePh: "Number you use",
    help: "What do you need help with?",
    helpPh: "Optional — short is fine",
    send: "Send details",
    sending: "Sending…",
    foot: "We only use this to reply to you.",
    waFollowup: "Hi — I just sent my details through the StratXcel site.",
  },
  hi: {
    biz: "Business ka naam",
    bizPh: "Brand ya dukaan",
    site: "Website",
    sitePh: "domain.com ya poora link",
    ig: "Instagram",
    igPh: "Agar ho to @handle",
    phone: "Phone / WhatsApp",
    phonePh: "Jis number pe reply chahiye",
    help: "Kis cheez mein help?",
    helpPh: "Optional — chhota sa likh do",
    send: "Bhej do",
    sending: "Bhej rahe hain…",
    foot: "Sirf reply ke liye use karte hain.",
    waFollowup: "Hi, StratXcel site se details bheji hain — pls dekho.",
  },
};

/**
 * @param {boolean} isHinglish
 * @returns {string | null}
 */
function successWhatsAppHref(isHinglish) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const text = isHinglish ? COPY.hi.waFollowup : COPY.en.waFollowup;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function Spinner({ className = "" }) {
  return (
    <svg
      className={`size-[1.0625rem] shrink-0 animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Business inquiry form → `/api/audit-lead` → n8n. On success, opens WhatsApp with a short confirmation.
 *
 * @param {{ className?: string; variant?: "compact" | "default" }} props
 */
export function AiBusinessAuditLeadForm({ className = "", variant = "compact" }) {
  const baseId = useId();
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const t = isHinglish ? COPY.hi : COPY.en;

  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const compact = variant === "compact";

  const setField = useCallback((key, v) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setGeneralError("");
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    const local = validateAuditLeadPayload(values, isHinglish ? "hi" : "en");
    if (!local.ok) {
      setErrors(local.errors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    let willRedirect = false;
    try {
      const res = await fetch("/api/audit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local.data),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 422 && json?.errors && typeof json.errors === "object") {
        setErrors(json.errors);
        return;
      }

      if (!res.ok) {
        const msg =
          typeof json?.message === "string" && json.message
            ? json.message
            : isHinglish
              ? "Kuch glitch ho gaya. Dobara try karo."
              : "Something went wrong. Please try again.";
        setGeneralError(msg);
        return;
      }

      setValues(INITIAL);
      setErrors({});

      const waHref = successWhatsAppHref(isHinglish);
      if (!waHref) {
        setGeneralError(
          isHinglish
            ? "Request aa gayi par WhatsApp link set nahi hai. Hum dusre tareeke se connect karenge."
            : "We got your request, but WhatsApp isn’t configured here. We’ll reach out another way."
        );
        return;
      }

      window.location.assign(waHref);
      willRedirect = true;
    } catch {
      setGeneralError(
        isHinglish ? "Network issue. Ek baar internet check karke try karo." : "Connection failed. Check your network and try again."
      );
    } finally {
      if (!willRedirect) setSubmitting(false);
    }
  };

  const gapLabel = compact ? "gap-1" : "gap-1.5";

  const inputClass = (name) =>
    [
      compact
        ? "min-h-[44px] rounded-[0.85rem] px-3.5 py-2.5 text-[0.9375rem]"
        : "min-h-[48px] rounded-[0.95rem] px-4 py-3 text-[1rem]",
      "w-full border bg-white/92 leading-snug tracking-[-0.02em]",
      "text-[var(--sx-ink)] shadow-[0_1px_0_rgb(255_255_255/0.9)_inset,0_1px_2px_rgb(42_38_34/0.04)]",
      "border-stone-200/90 outline-none transition-[border-color,box-shadow,background-color] duration-200",
      "placeholder:text-stone-400/85",
      "hover:border-stone-300/95 hover:bg-white",
      "focus:border-stone-400/80 focus:bg-white focus:shadow-[0_0_0_3px_rgb(120_113_108/0.11),0_1px_0_rgb(255_255_255/0.9)_inset]",
      errors[name]
        ? "border-rose-300/95 focus:border-rose-400 focus:shadow-[0_0_0_3px_rgb(244_63_94/0.12),0_1px_0_rgb(255_255_255/0.9)_inset]"
        : "",
    ].join(" ");

  const labelClass = compact
    ? "text-[12px] font-semibold tracking-[-0.01em] text-[var(--sx-ink-secondary)]"
    : "text-[13px] font-medium tracking-[-0.01em] text-[var(--sx-ink-secondary)] sm:text-[13.5px]";

  const formPad = compact ? "p-5 sm:p-6" : "p-6 sm:p-8";
  const gridGap = compact ? "gap-3.5 sm:gap-4" : "gap-5 lg:gap-x-8 lg:gap-y-5";
  const footPad = compact ? "mt-5" : "mt-7 sm:mt-8";

  return (
    <form
      onSubmit={onSubmit}
      className={[
        "relative overflow-hidden rounded-[1.15rem] border border-white/55 bg-gradient-to-b from-white/78 to-white/52",
        formPad,
        "shadow-[var(--sx-shadow-md)] backdrop-blur-xl",
        "transition-shadow duration-300 hover:shadow-[var(--sx-shadow-lg)]",
        className,
      ].join(" ")}
      noValidate
    >
      {!compact ? (
        <>
          <div
            className="pointer-events-none absolute -left-16 top-0 size-48 rounded-full bg-[color-mix(in_srgb,var(--sx-glow-amber)_50%,transparent)] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 right-0 size-56 rounded-full bg-[color-mix(in_srgb,var(--sx-green-mid)_10%,transparent)] blur-3xl"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="pointer-events-none absolute -right-12 top-8 h-28 w-28 rounded-full bg-[color-mix(in_srgb,var(--sx-glow-amber)_35%,transparent)] blur-2xl"
          aria-hidden
        />
      )}

      <div className={`relative grid ${gridGap} lg:grid-cols-2`}>
        <div className={`flex flex-col ${gapLabel}`}>
          <label className={labelClass} htmlFor={`${baseId}-business`}>
            {t.biz} <span className="text-rose-500">*</span>
          </label>
          <input
            id={`${baseId}-business`}
            name="business_name"
            type="text"
            autoComplete="organization"
            required
            disabled={submitting}
            value={values.business_name}
            onChange={(e) => setField("business_name", e.target.value)}
            className={inputClass("business_name")}
            placeholder={t.bizPh}
            aria-invalid={Boolean(errors.business_name)}
            aria-describedby={errors.business_name ? `${baseId}-err-business` : undefined}
          />
          {errors.business_name ? (
            <p id={`${baseId}-err-business`} className="text-[12px] font-medium text-rose-600" role="alert">
              {errors.business_name}
            </p>
          ) : null}
        </div>

        <div className={`flex flex-col ${gapLabel}`}>
          <label className={labelClass} htmlFor={`${baseId}-website`}>
            {t.site} <span className="text-rose-500">*</span>
          </label>
          <input
            id={`${baseId}-website`}
            name="website"
            type="url"
            inputMode="url"
            autoComplete="url"
            required
            disabled={submitting}
            value={values.website}
            onChange={(e) => setField("website", e.target.value)}
            className={inputClass("website")}
            placeholder={t.sitePh}
            aria-invalid={Boolean(errors.website)}
            aria-describedby={errors.website ? `${baseId}-err-website` : undefined}
          />
          {errors.website ? (
            <p id={`${baseId}-err-website`} className="text-[12px] font-medium text-rose-600" role="alert">
              {errors.website}
            </p>
          ) : null}
        </div>

        <div className={`flex flex-col ${gapLabel}`}>
          <label className={labelClass} htmlFor={`${baseId}-phone`}>
            {t.phone} <span className="text-rose-500">*</span>
          </label>
          <input
            id={`${baseId}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            disabled={submitting}
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            className={inputClass("phone")}
            placeholder={t.phonePh}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${baseId}-err-phone` : undefined}
          />
          {errors.phone ? (
            <p id={`${baseId}-err-phone`} className="text-[12px] font-medium text-rose-600" role="alert">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div className={`flex flex-col ${gapLabel}`}>
          <label className={labelClass} htmlFor={`${baseId}-instagram`}>
            {t.ig}{" "}
            <span className="font-normal text-stone-400">{isHinglish ? "(agar ho)" : "(optional)"}</span>
          </label>
          <input
            id={`${baseId}-instagram`}
            name="instagram"
            type="text"
            autoComplete="off"
            disabled={submitting}
            value={values.instagram}
            onChange={(e) => setField("instagram", e.target.value)}
            className={inputClass("instagram")}
            placeholder={t.igPh}
            aria-invalid={Boolean(errors.instagram)}
            aria-describedby={errors.instagram ? `${baseId}-err-instagram` : undefined}
          />
          {errors.instagram ? (
            <p id={`${baseId}-err-instagram`} className="text-[12px] font-medium text-rose-600" role="alert">
              {errors.instagram}
            </p>
          ) : null}
        </div>

        <div className={`flex flex-col lg:col-span-2 ${gapLabel}`}>
          <label className={labelClass} htmlFor={`${baseId}-problem`}>
            {t.help}{" "}
            <span className="font-normal text-stone-400">{isHinglish ? "(optional)" : "(optional)"}</span>
          </label>
          <textarea
            id={`${baseId}-problem`}
            name="problem"
            rows={compact ? 3 : 4}
            disabled={submitting}
            value={values.problem}
            onChange={(e) => setField("problem", e.target.value)}
            className={[
              inputClass("problem"),
              compact
                ? "min-h-[5.25rem] max-h-[min(36vh,220px)] resize-y py-2.5 leading-relaxed"
                : "min-h-[120px] max-h-[min(40vh,280px)] resize-y py-3.5 leading-relaxed",
            ].join(" ")}
            placeholder={t.helpPh}
            aria-invalid={Boolean(errors.problem)}
            aria-describedby={errors.problem ? `${baseId}-err-problem` : undefined}
          />
          {errors.problem ? (
            <p id={`${baseId}-err-problem`} className="text-[12px] font-medium text-rose-600" role="alert">
              {errors.problem}
            </p>
          ) : null}
        </div>
      </div>

      {generalError ? (
        <div
          className="mt-4 rounded-[0.85rem] border border-rose-200/90 bg-rose-50/80 px-3.5 py-2.5 text-[13px] font-medium text-rose-800"
          role="alert"
        >
          {generalError}
        </div>
      ) : null}

      <div className={footPad}>
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="sx-btn-secondary-elegant flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold tracking-[-0.02em] text-[var(--sx-ink)] shadow-sm transition-[transform,opacity,background-color] duration-200 enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <Spinner className="text-[var(--sx-ink)]" /> : null}
          <span>{submitting ? t.sending : t.send}</span>
        </button>
        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-stone-500 sm:text-[12px]">{t.foot}</p>
      </div>
    </form>
  );
}
