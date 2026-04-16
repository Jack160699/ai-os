import Link from "next/link";
import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "How We Work — Stratxcel",
};

export default function HowWeWorkPage() {
  const steps = [
    "Diagnose: understand commercial bottlenecks, workflow constraints, and team realities.",
    "Design: define system architecture, owner responsibilities, operating cadence, and success metrics.",
    "Implement: ship workflows, automations, and execution rails in tight weekly cycles.",
    "Stabilize: tune, document, and harden the system for long-term reliability and scale.",
  ];

  return (
    <PageLayout title="How We Work" eyebrow="Execution model">
      <p>
        We do not start with random tools. We start with operating clarity and business outcomes, then
        design systems your team can run with discipline.
      </p>
      <ol className="mt-8 space-y-4">
        {steps.map((step, idx) => (
          <li key={step} className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-4">
            <p className="text-sm font-semibold text-[var(--sx-navy)]">Step {idx + 1}</p>
            <p className="mt-1 text-[15px] text-zinc-600">{step}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8">
        <Link
          href="/contact"
          className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-7 text-[15px] font-semibold text-white transition hover:bg-[var(--sx-navy-soft)]"
        >
          Book Consultation
        </Link>
      </div>
    </PageLayout>
  );
}
