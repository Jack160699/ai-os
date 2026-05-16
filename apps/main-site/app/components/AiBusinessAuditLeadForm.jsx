"use client";

import { useCallback, useId, useState } from "react";
import { CONTACT } from "@stratxcel/config";
import { validateAuditLeadPayload } from "@/app/lib/auditLeadValidation";

const INITIAL = {
  business_name: "",
  website: "",
  instagram: "",
  problem: "",
  phone: "",
};

/** Opens WhatsApp chat with this exact prefill after the webhook accepts the lead. */
const AUDIT_SUCCESS_WHATSAPP_TEXT = "Hi I just requested my AI business audit";

/**
 * @returns {string | null} `https://wa.me/<digits>?text=...` or null if number missing.
 */
function auditSuccessWhatsAppHref() {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(AUDIT_SUCCESS_WHATSAPP_TEXT)}`;
}

function Spinner({ className = "" }) {
  return (
    <svg
      className={`size-[1.125rem] shrink-0 animate-spin ${className}`}
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
 * Premium lead capture for the free AI business audit funnel.
 * POSTs to `/api/audit-lead`, which forwards to `N8N_AUDIT_WEBHOOK_URL` (server env).
 * On success, redirects to WhatsApp with a fixed confirmation message.
 *
 * @param {{ className?: string; embedded?: boolean }} props
 */
export function AiBusinessAuditLeadForm({ className = "", embedded = false }) {
  const baseId = useId();
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    const local = validateAuditLeadPayload(values);
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
            : "Something went wrong. Please try again.";
        setGeneralError(msg);
        return;
      }

      setValues(INITIAL);
      setErrors({});

      const waHref = auditSuccessWhatsAppHref();
      if (!waHref) {
        setGeneralError(
          "We received your request, but WhatsApp is not configured on this deployment. We'll reach out another way."
        );
        return;
      }

      window.location.assign(waHref);
      willRedirect = true;
    } catch {
      setGeneralError("Connection failed. Check your network and try again.");
    } finally {
      if (!willRedirect) setSubmitting(false);
    }
  };

  const fieldShell =
    "group flex flex-col gap-1.5 transition-[opacity] duration-200 disabled:opacity-55";

  const inputClass = (name) =>
    [
      "w-full min-h-[48px] rounded-[0.95rem] border bg-white/90 px-4 py-3 text-[1rem] leading-snug tracking-[-0.02em]",
      "text-[var(--sx-ink)] shadow-[0_1px_0_rgb(255_255_255/0.9)_inset,0_1px_2px_rgb(42_38_34/0.04)]",
      "border-stone-200/90 outline-none transition-[border-color,box-shadow,background-color] duration-200",
      "placeholder:text-stone-400/90",
      "hover:border-stone-300/95 hover:bg-white",
      "focus:border-stone-400/80 focus:bg-white focus:shadow-[0_0_0_3px_rgb(120_113_108/0.12),0_1px_0_rgb(255_255_255/0.9)_inset]",
      errors[name]
        ? "border-rose-300/95 focus:border-rose-400 focus:shadow-[0_0_0_3px_rgb(244_63_94/0.12),0_1px_0_rgb(255_255_255/0.9)_inset]"
        : "",
    ].join(" ");

  const labelClass =
    "text-[13px] font-medium tracking-[-0.01em] text-[var(--sx-ink-secondary)] sm:text-[13.5px]";

  return (
    <form
      onSubmit={onSubmit}
      className={[
        "relative overflow-hidden rounded-[1.35rem] border border-white/65 bg-gradient-to-b from-white/80 to-white/55",
        "p-6 shadow-[var(--sx-shadow-md)] backdrop-blur-xl sm:p-8",
        "transition-shadow duration-300 hover:shadow-[var(--sx-shadow-lg)]",
        className,
      ].join(" ")}
      noValidate
    >
      <div
        className="pointer-events-none absolute -left-20 top-0 size-56 rounded-full bg-[color-mix(in_srgb,var(--sx-glow-amber)_55%,transparent)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-0 size-64 rounded-full bg-[color-mix(in_srgb,var(--sx-green-mid)_10%,transparent)] blur-3xl"
        aria-hidden
      />

      <div className="relative">
        {!embedded ? (
          <div className="mb-6 sm:mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500/95">Free audit</p>
            <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.035em] text-[var(--sx-ink)] sm:text-[1.4rem]">
              Start with a quick snapshot
            </h3>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--sx-ink-secondary)] sm:text-[15.5px]">
              A few fields — we review your presence and reply with plain language you can act on.
            </p>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5">
          <div className={fieldShell}>
            <label className={labelClass} htmlFor={`${baseId}-business`}>
              Business name <span className="text-rose-500">*</span>
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
              placeholder="e.g. Northwind Traders"
              aria-invalid={Boolean(errors.business_name)}
              aria-describedby={errors.business_name ? `${baseId}-err-business` : undefined}
            />
            {errors.business_name ? (
              <p id={`${baseId}-err-business`} className="text-[13px] font-medium text-rose-600" role="alert">
                {errors.business_name}
              </p>
            ) : null}
          </div>

          <div className={fieldShell}>
            <label className={labelClass} htmlFor={`${baseId}-website`}>
              Website URL <span className="text-rose-500">*</span>
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
              placeholder="https:// or yourdomain.com"
              aria-invalid={Boolean(errors.website)}
              aria-describedby={errors.website ? `${baseId}-err-website` : undefined}
            />
            {errors.website ? (
              <p id={`${baseId}-err-website`} className="text-[13px] font-medium text-rose-600" role="alert">
                {errors.website}
              </p>
            ) : null}
          </div>

          <div className={fieldShell}>
            <label className={labelClass} htmlFor={`${baseId}-instagram`}>
              Instagram <span className="font-normal text-stone-400">(optional)</span>
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
              placeholder="@handle or URL"
              aria-invalid={Boolean(errors.instagram)}
              aria-describedby={errors.instagram ? `${baseId}-err-instagram` : undefined}
            />
            {errors.instagram ? (
              <p id={`${baseId}-err-instagram`} className="text-[13px] font-medium text-rose-600" role="alert">
                {errors.instagram}
              </p>
            ) : null}
          </div>

          <div className={fieldShell}>
            <label className={labelClass} htmlFor={`${baseId}-phone`}>
              Phone number <span className="text-rose-500">*</span>
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
              placeholder="WhatsApp or mobile"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? `${baseId}-err-phone` : undefined}
            />
            {errors.phone ? (
              <p id={`${baseId}-err-phone`} className="text-[13px] font-medium text-rose-600" role="alert">
                {errors.phone}
              </p>
            ) : null}
          </div>

          <div className={`${fieldShell} lg:col-span-2`}>
            <label className={labelClass} htmlFor={`${baseId}-problem`}>
              What&apos;s the main challenge?{" "}
              <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <textarea
              id={`${baseId}-problem`}
              name="problem"
              rows={4}
              disabled={submitting}
              value={values.problem}
              onChange={(e) => setField("problem", e.target.value)}
              className={[
                inputClass("problem"),
                "min-h-[120px] max-h-[min(40vh,280px)] resize-y py-3.5 leading-relaxed",
              ].join(" ")}
              placeholder="Leads, positioning, site not converting, ads burning budget…"
              aria-invalid={Boolean(errors.problem)}
              aria-describedby={errors.problem ? `${baseId}-err-problem` : undefined}
            />
            {errors.problem ? (
              <p id={`${baseId}-err-problem`} className="text-[13px] font-medium text-rose-600" role="alert">
                {errors.problem}
              </p>
            ) : null}
          </div>
        </div>

        {generalError ? (
          <div
            className="mt-5 rounded-[0.95rem] border border-rose-200/90 bg-rose-50/80 px-4 py-3 text-[14px] font-medium text-rose-800"
            role="alert"
          >
            {generalError}
          </div>
        ) : null}

        <div className="mt-7 sm:mt-8">
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="group relative flex w-full min-h-[52px] items-center justify-center gap-2.5 overflow-hidden rounded-full bg-[var(--sx-ink)] px-6 text-[15px] font-semibold tracking-[-0.025em] text-[color-mix(in_srgb,white_96%,var(--sx-canvas))] shadow-[0_1px_0_rgb(255_255_255/0.12)_inset,0_14px_36px_-18px_rgb(42_38_34/0.45)] transition-[transform,box-shadow,filter] duration-200 enabled:hover:brightness-[1.05] enabled:hover:shadow-[0_1px_0_rgb(255_255_255/0.14)_inset,0_18px_44px_-16px_rgb(42_38_34/0.5)] enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
          >
            <span
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-enabled:group-hover:opacity-100"
              aria-hidden
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.09) 50%, transparent 60%)",
              }}
            />
            {submitting ? <Spinner className="text-white" /> : null}
            <span>{submitting ? "Sending…" : "Get Free AI Business Audit"}</span>
          </button>
          <p className="mt-3 text-center text-[12.5px] leading-relaxed text-stone-500 sm:text-[13px]">
            By submitting, you agree we may contact you about this audit. After we save your details, we&apos;ll open
            WhatsApp with a short message you can send.
          </p>
        </div>
      </div>
    </form>
  );
}
