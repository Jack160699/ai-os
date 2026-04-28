import { PageHeader } from "@/components/v2/page-header";
import { AnalyticsCharts } from "@/components/v2/analytics-charts";
import { getV2AnalyticsData } from "@/lib/v2/analytics-data";

export default async function AnalyticsPage() {
  const data = await getV2AnalyticsData();
  return (
    <section>
      <PageHeader title="Analytics" subtitle="Chats, payments, and team output trends for launch monitoring." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(data.kpis || []).map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-black/10 bg-[var(--v2-surface)] p-4 shadow-sm dark:border-white/10">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--v2-muted)]">{metric.label}</p>
            <p className="mt-2 text-xl font-semibold">{metric.value}</p>
          </article>
        ))}
      </div>
      <AnalyticsCharts data={data} />
    </section>
  );
}
