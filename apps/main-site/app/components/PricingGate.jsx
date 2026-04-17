"use client";

import { useState } from "react";
import { BookDiagnosisCheckoutButton } from "@stratxcel/ui";

/**
 * Intent first: no fee until the owner expands — filters casual browsers.
 */
export function PricingGate() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sx-card mx-auto max-w-lg p-8 lg:mx-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Business diagnosis</p>
      <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[var(--sx-navy)]">This is not a casual call.</h3>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-[1.75] text-zinc-600 sm:text-[1.0625rem]">
        We reserve structured diagnosis slots for operators who intend to fix execution, not browse options. If that
        is you, we will share scope, cadence, and fee before you pay.
      </p>
      <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-zinc-600">
        <li>Structured intake — context, bottlenecks, outcomes</li>
        <li>Clear diagnosis — gaps, owners, sequence</li>
        <li>Transparent next step — only if there is a mutual fit</li>
      </ul>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-8 w-full rounded-full border border-zinc-300 bg-[var(--sx-navy)] py-3.5 text-[14px] font-semibold tracking-[-0.01em] text-white transition-[background-color,transform,box-shadow] duration-300 hover:bg-[var(--sx-navy-soft)] hover:shadow-md active:scale-[0.99]"
        >
          View commitment &amp; fee
        </button>
      ) : (
        <div className="mt-8 border-t border-zinc-100 pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Investment</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--sx-navy)]">
            ₹2,200 <span className="text-base font-medium text-zinc-500">per diagnosis session</span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            Limited slots weekly. Fee covers preparation, live working session, and written action outline.
          </p>
          <div className="mt-6">
            <BookDiagnosisCheckoutButton amount={2200} />
          </div>
        </div>
      )}
    </div>
  );
}
