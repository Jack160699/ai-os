"use client";

import { useState } from "react";
import { BookDiagnosisCheckoutButton } from "@stratxcel/ui";
import { CONTACT } from "@stratxcel/config";

export function PricingGate() {
  const [paid, setPaid] = useState(false);
  const waNumber = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        "I completed payment and want WhatsApp coordination for my session."
      )}`
    : "#";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="sx-card-space p-6 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Option 1</p>
          <h3 className="mt-3 text-[1.05rem] font-semibold tracking-[-0.02em] text-zinc-50">Business Diagnosis Session</h3>
          <p className="mt-2 text-[13px] text-zinc-400">For founders, operators, and companies.</p>
          <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-zinc-400">
            <li>Growth bottleneck review</li>
            <li>Operations gap discovery</li>
            <li>Lead and sales friction scan</li>
            <li>System opportunity mapping</li>
            <li>Next-step recommendations</li>
          </ul>
          <p className="mt-6 text-2xl font-semibold tracking-tight text-zinc-50">₹2200</p>
          <div className="mt-5">
            <BookDiagnosisCheckoutButton
              amount={2200}
              source="business_diagnosis"
              buttonLabel="Request Diagnosis"
              successMessage="Payment successful. Choose your coordination mode below."
              showUpiHint={false}
              onSuccess={() => setPaid(true)}
              className="sx-cta-primary"
            />
          </div>
        </div>

        <div className="sx-card-space p-6 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Option 2</p>
          <h3 className="mt-3 text-[1.05rem] font-semibold tracking-[-0.02em] text-zinc-50">Personal Strategic Session</h3>
          <p className="mt-2 text-[13px] text-zinc-400">For individuals needing direction and systems clarity.</p>
          <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-zinc-400">
            <li>Career and business clarity</li>
            <li>Growth planning</li>
            <li>Execution structure</li>
            <li>Next move thinking</li>
          </ul>
          <p className="mt-6 text-2xl font-semibold tracking-tight text-zinc-50">₹2200</p>
          <div className="mt-5">
            <BookDiagnosisCheckoutButton
              amount={2200}
              source="personal_strategic"
              buttonLabel="Book Strategic Session"
              successMessage="Payment successful. Choose your coordination mode below."
              showUpiHint={false}
              onSuccess={() => setPaid(true)}
              className="sx-cta-primary"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0B0F19]/30 p-5 text-[13px] leading-relaxed text-zinc-400 backdrop-blur-md">
        This payment is not for talking. It confirms seriousness, reserves dedicated time, and protects focused
        attention. If we move into a larger project, this amount can be adjusted against future engagement where
        applicable.
      </div>

      <p className="text-[12px] tracking-[0.02em] text-zinc-400">Limited monthly slots to maintain quality.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "Focused one-on-one attention",
          "Actionable clarity, not generic advice",
          "Serious operators preferred",
          "Confidential discussions",
        ].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-white/[0.08] bg-[#0B0F19]/34 px-4 py-3 text-[12px] font-medium tracking-[0.02em] text-zinc-300 backdrop-blur-md"
          >
            {item}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0B0F19]/34 p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Mini FAQ</p>
        <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-zinc-400">
          <p>
            <span className="font-semibold text-zinc-200">Q: Why paid?</span>{" "}
            Free calls often create low intent and low seriousness. Paid sessions protect depth and focus.
          </p>
          <p>
            <span className="font-semibold text-zinc-200">Q: Is this sales pressure?</span> No. The goal is clarity
            first.
          </p>
          <p>
            <span className="font-semibold text-zinc-200">Q: Can this apply to project work later?</span> Yes, where
            relevant.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-500/20 bg-[#0B0F19]/42 p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300/70">Post-Payment Flow</p>
        <p className="mt-3 text-[14px] leading-relaxed text-zinc-300">
          After successful payment, choose your preferred coordination mode:
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <a
            href={`mailto:${CONTACT.email}?subject=Schedule%20Google%20Meet%20-%20Diagnosis`}
            className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-center text-[13px] font-medium text-zinc-200 transition hover:border-sky-400/30 hover:bg-white/[0.06]"
          >
            Schedule Google Meet
          </a>
          <a
            href={`mailto:${CONTACT.email}?subject=Request%20Callback%20-%20Diagnosis`}
            className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-center text-[13px] font-medium text-zinc-200 transition hover:border-sky-400/30 hover:bg-white/[0.06]"
          >
            Request Callback
          </a>
          <a
            href={waHref}
            className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-center text-[13px] font-medium text-zinc-200 transition hover:border-sky-400/30 hover:bg-white/[0.06]"
            rel="noopener noreferrer"
            target="_blank"
          >
            WhatsApp Coordination
          </a>
        </div>
        {paid ? (
          <p className="mt-4 text-[12px] tracking-[0.02em] text-sky-300/80">
            Payment detected. Choose one option above to finalize coordination.
          </p>
        ) : null}
      </div>
    </div>
  );
}
