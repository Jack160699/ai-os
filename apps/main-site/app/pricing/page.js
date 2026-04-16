import { BookDiagnosisCheckoutButton } from "@stratxcel/ui";

export const metadata = {
  title: "Pricing — Stratxcel",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Pricing</h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        Start with a diagnosis session. We map your systems, constraints, and fastest path to ROI — then
        propose a scoped build.
      </p>
      <div className="mt-12 max-w-md rounded-2xl border border-blue-100 bg-white p-8 shadow-[0_24px_80px_-32px_rgba(30,58,138,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Diagnosis</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">Book a session</p>
        <p className="mt-2 text-sm text-slate-600">
          Secure checkout powered by Razorpay (live). You will receive a calendar link after payment.
        </p>
        <div className="mt-8">
          <BookDiagnosisCheckoutButton />
        </div>
      </div>
    </div>
  );
}
