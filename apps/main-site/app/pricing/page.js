import { BookDiagnosisCheckoutButton } from "@stratxcel/ui";

export const metadata = {
  title: "Pricing — Stratxcel",
};

export default function PricingPage() {
  return (
    <div className="border-b border-zinc-100 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Pricing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-4xl">
          Diagnosis session
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-600">
          We map systems, constraints, and the fastest credible path to ROI — then propose a scoped build. Same
          secure checkout as on the homepage.
        </p>
        <div className="mt-12 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.12)] ring-1 ring-zinc-100">
          <p className="text-3xl font-semibold tracking-tight text-[var(--sx-navy)]">
            ₹499
            <span className="ml-2 text-base font-medium text-zinc-500">per session</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Secure checkout. Calendar coordination after payment.
          </p>
          <div className="mt-8">
            <BookDiagnosisCheckoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
