"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
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
    biz: "Name",
    bizPh: "Shop or brand name",
    site: "Website or Instagram",
    sitePh: "Whatever link you have",
    ig: "Instagram only if separate",
    igPh: "Optional",
    phone: "WhatsApp number",
    phonePh: "WhatsApp number",
    help: "What’s bothering you?",
    helpPh: "Rough notes are fine",
    send: "Send message",
    sending: "Sending…",
    foot: "We reply ourselves. No pressure pitch.",
    waFollowup: "Hi — I just sent details from your site. Free to chat when you are?",
    successTitle: "Got it",
    successBody: "We’ll reply soon.",
    successCta: "Open WhatsApp",
    successHint: "Tap below — or we’ll open it in a moment.",
  },
  hi: {
    biz: "Naam",
    bizPh: "Dukaan / brand ka naam",
    site: "Website ya Instagram",
    sitePh: "Jo bhi link hai",
    ig: "Alag se sirf Instagram",
    igPh: "Zarurat ho to",
    phone: "WhatsApp number",
    phonePh: "WhatsApp number",
    help: "Problem kya aa rahi hai?",
    helpPh: "Jo samajh aaye likh do",
    send: "Message Bhejo",
    sending: "Bhej rahe hain…",
    foot: "Khud reply karenge. Koi pressure pitch nahi.",
    waFollowup: "Hi — site se details bheji hain. Jab time ho ek baar dekh lena.",
    successTitle: "Mil gaya",
    successBody: "Jaldi reply karenge.",
    successCta: "WhatsApp Kholo",
    successHint: "Neeche dabao — ya thodi der mein khul jayega.",
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
      className={`size-[1.0625rem] shrink-0 animate-spin motion-reduce:animate-none ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Business inquiry form → `/api/audit-lead` → n8n. Shows a calm success beat, then hands off to WhatsApp.
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
  const [success, setSuccess] = useState(false);
  const [successWa, setSuccessWa] = useState(/** @type {string | null} */ (null));
  const [successVisible, setSuccessVisible] = useState(false);

  const redirectTimer = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const compact = variant === "compact";

  const clearRedirect = useCallback(() => {
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
      redirectTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!success) {
      setSuccessVisible(false);
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSuccessVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, [success]);

  useEffect(() => {
    if (!success || !successWa) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    redirectTimer.current = setTimeout(() => {
      window.location.assign(successWa);
    }, 2800);
    return () => clearRedirect();
  }, [success, successWa, clearRedirect]);

  const openWhatsAppNow = () => {
    if (!successWa) return;
    clearRedirect();
    window.location.assign(successWa);
  };

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

    try {
      const res = await fetch("/api/audit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...local.data, locale: isHinglish ? "hi" : "en" }),
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
              ? "Arre, glitch aa gaya. Ek baar dubara try karo?"
              : "Something went wrong. Mind trying again?";
        setGeneralError(msg);
        return;
      }

      setValues(INITIAL);
      setErrors({});

      const waHref = successWhatsAppHref(isHinglish);
      if (!waHref) {
        setGeneralError(
          isHinglish
            ? "Details mil gayi — par WhatsApp link yahan set nahi hai. Hum aur tareeke se connect karenge."
            : "We got your details — but WhatsApp isn’t wired here. We’ll reach out another way."
        );
        return;
      }

      setSuccessWa(waHref);
      setSuccess(true);
    } catch {
      setGeneralError(
        isHinglish
          ? "Net thoda moody hai. Ek baar check karke try karo?"
          : "Connection hiccup. Check your network and try again?"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const gapLabel = compact ? "gap-1" : "gap-1.5";

  const inputClass = (name) =>
    [
      compact
        ? "min-h-[44px] rounded-[0.9rem] px-3.5 py-2.5 text-[0.9375rem]"
        : "min-h-[48px] rounded-[0.95rem] px-4 py-3 text-[1rem]",
      "w-full border bg-white/94 leading-snug tracking-[-0.02em]",
      "text-[var(--sx-ink)] shadow-[0_1px_0_rgb(255_255_255/0.94)_inset,0_1px_3px_rgb(42_38_34/0.035)]",
      "border-stone-200/80 outline-none transition-[border-color,box-shadow,background-color,opacity] duration-300 ease-out",
      "placeholder:text-stone-400/80",
      "hover:border-stone-300/90 hover:bg-white",
      "focus:border-stone-400/75 focus:bg-white focus:shadow-[0_0_0_3px_rgb(120_113_108/0.09),0_1px_0_rgb(255_255_255/0.94)_inset]",
      "disabled:opacity-[0.62] disabled:cursor-not-allowed",
      errors[name]
        ? "border-rose-300/95 focus:border-rose-400 focus:shadow-[0_0_0_3px_rgb(244_63_94/0.11),0_1px_0_rgb(255_255_255/0.94)_inset]"
        : "",
    ].join(" ");

  const labelClass = compact
    ? "text-[12px] font-semibold tracking-[-0.01em] text-[var(--sx-ink-secondary)]"
    : "text-[13px] font-medium tracking-[-0.01em] text-[var(--sx-ink-secondary)] sm:text-[13.5px]";

  const formPad = compact ? "p-5 sm:p-[1.35rem]" : "p-6 sm:p-8";
  const gridGap = compact ? "gap-3.5 sm:gap-4" : "gap-5 lg:gap-x-8 lg:gap-y-5";
  const footPad = compact ? "mt-5" : "mt-7 sm:mt-8";

  if (success && successWa) {
    return (
      <div
        className={[
          "relative overflow-hidden rounded-[1.15rem] border border-white/52 bg-gradient-to-b from-white/88 to-white/60",
          formPad,
          "shadow-[var(--sx-shadow-md)] backdrop-blur-xl backdrop-saturate-[1.03]",
          "transition-[box-shadow] duration-500 ease-out",
          className,
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        <div
          className="pointer-events-none absolute -right-10 top-6 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--sx-glow-amber)_32%,transparent)] blur-2xl"
          aria-hidden
        />
        <div
          className={[
            "relative text-center transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
            successVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          ].join(" ")}
        >
          <p className="text-[1.15rem] font-semibold tracking-[-0.03em] text-[var(--sx-ink)] sm:text-[1.22rem]">
            {t.successTitle}
          </p>
          <p className="mx-auto mt-2.5 max-w-[28ch] text-[14px] leading-relaxed text-[var(--sx-ink-secondary)] sm:text-[15px]">
            {t.successBody}
          </p>
          <button
            type="button"
            onClick={openWhatsAppNow}
            className="sx-btn-wa mt-6 inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-full px-5 text-[14px] font-semibold tracking-[-0.02em] transition-[transform,filter] duration-300 motion-safe:active:scale-[0.99] sm:mx-auto sm:text-[15px]"
          >
            {t.successCta}
          </button>
          <p className="mt-3 text-[12px] text-stone-500">{t.successHint}</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={[
        "relative overflow-hidden rounded-[1.15rem] border border-white/50 bg-gradient-to-b from-white/82 to-white/54",
        formPad,
        "shadow-[var(--sx-shadow-md)] backdrop-blur-xl backdrop-saturate-[1.03]",
        "transition-[box-shadow,border-color] duration-500 ease-out",
        "hover:border-white/58 hover:shadow-[var(--sx-shadow-lg)]",
        className,
      ].join(" ")}
      noValidate
    >
      {!compact ? (
        <>
          <div
            className="pointer-events-none absolute -left-16 top-0 size-48 rounded-full bg-[color-mix(in_srgb,var(--sx-glow-amber)_48%,transparent)] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 right-0 size-56 rounded-full bg-[color-mix(in_srgb,var(--sx-green-mid)_09%,transparent)] blur-3xl"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="pointer-events-none absolute -right-12 top-8 h-28 w-28 rounded-full bg-[color-mix(in_srgb,var(--sx-glow-amber)_30%,transparent)] blur-2xl"
          aria-hidden
        />
      )}

      <div className={`relative grid ${gridGap} lg:grid-cols-2`}>
        <div className={`flex flex-col ${gapLabel}`}>
          <label className={labelClass} htmlFor={`${baseId}-business`}>
            {t.biz} <span className="text-rose-500/95">*</span>
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
            {t.site} <span className="text-rose-500/95">*</span>
          </label>
          <input
            id={`${baseId}-website`}
            name="website"
            type="text"
            inputMode="text"
            autoComplete="url"
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
            {t.phone} <span className="text-rose-500/95">*</span>
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
            <span className="font-normal text-stone-400/95">{isHinglish ? "(optional)" : "(optional)"}</span>
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
            <span className="font-normal text-stone-400/95">{isHinglish ? "(optional)" : "(optional)"}</span>
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
                ? "min-h-[5.35rem] max-h-[min(36vh,220px)] resize-y py-2.5 leading-relaxed"
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
          className="mt-4 rounded-[0.88rem] border border-rose-200/85 bg-rose-50/85 px-3.5 py-2.5 text-[13px] font-medium text-rose-800"
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
          className={[
            "flex w-full min-h-[50px] items-center justify-center gap-2 rounded-full border border-stone-200/85",
            "bg-[color-mix(in_srgb,white_92%,var(--sx-surface-warm))] px-5 text-[14px] font-semibold tracking-[-0.022em] text-[var(--sx-ink)]",
            "shadow-[0_1px_0_rgb(255_255_255/0.9)_inset,var(--sx-shadow-sm)]",
            "transition-[transform,background-color,border-color,box-shadow,opacity] duration-300 ease-out",
            "hover:border-stone-300/90 hover:bg-white hover:shadow-[var(--sx-shadow-md)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[color-mix(in_srgb,var(--sx-surface-warm)_40%,white)]",
            "disabled:cursor-not-allowed disabled:opacity-55 motion-safe:active:scale-[0.99]",
          ].join(" ")}
        >
          {submitting ? <Spinner className="text-[var(--sx-ink)]" /> : null}
          <span>{submitting ? t.sending : t.send}</span>
        </button>
        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-stone-500/95 sm:text-[12px]">{t.foot}</p>
      </div>
    </form>
  );
}
