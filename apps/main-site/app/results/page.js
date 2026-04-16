import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "Results — Stratxcel",
};

export default function ResultsPage() {
  const outcomes = [
    "+32% faster lead response",
    "3x follow-up consistency",
    "18 hrs/week saved",
  ];

  return (
    <PageLayout title="Results" eyebrow="Outcomes">
      <p>
        We measure impact through operating behavior and business outcomes, not vanity dashboards.
      </p>
      <ul className="mt-8 space-y-4">
        {outcomes.map((item) => (
          <li key={item} className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-4">
            <p className="text-[15px] font-semibold text-[var(--sx-navy)]">{item}</p>
          </li>
        ))}
      </ul>
    </PageLayout>
  );
}
