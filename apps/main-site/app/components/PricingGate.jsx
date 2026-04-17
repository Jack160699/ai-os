"use client";

import { useState } from "react";
import { BookDiagnosisCheckoutButton } from "@stratxcel/ui";

/**
 * Intent first: no fee until the owner expands — filters casual browsers.
 */
export function PricingGate() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sx-card-space mx-auto max-w-lg p-8 lg:mx-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Business diagnosis</p>
      <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-zinc-50">This is not a casual call.</h3>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-[1.75] text-zinc-400 sm:text-[1.0625rem]">
        We reserve structured diagnosis slots for operators who intend to fix execution, not browse options. If that
        is you, we will share scope, cadence, and fee before you pay.
      </p>
      <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-zinc-400">
        <li>Structured intake — context, bottlenecks, outcomes</li>
        <li>Clear diagnosis — gaps, owners, sequence</li>
        <li>Transparent next step — only if there is a mutual fit</li>
      </ul>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-8 w-full rounded-full border border-white/14 bg-white/[0.08] py-3.5 text-[14px] font-semibold tracking-[-0.01em] text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] transition-[background-color,transform,box-shadow,border-color] duration-500 hover:border-sky-400/25 hover:bg-white/[0.12] hover:shadow-[0_0_40px_-16px_rgba(96,165,250,0.2)] active:scale-[0.99]"
        >
          View commitment &amp; fee
        </button>
      ) : (
        <div className="mt-8 border-t border-white/[0.08] pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Investment</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
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
