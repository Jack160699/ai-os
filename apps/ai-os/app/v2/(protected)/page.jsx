import { PageHeader } from "@/components/v2/page-header";
import { getV2DashboardData } from "@/lib/v2/dashboard-data";

export default async function DashboardPage() {
  const data = await getV2DashboardData();
  return (
    <section>
      <PageHeader
        title="Dashboard"
        subtitle="Operational snapshot across chats, payments, and team performance."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-black/10 bg-[var(--v2-surface)] p-4 shadow-sm dark:border-white/10"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--v2-muted)]">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-[var(--v2-surface)] p-4 shadow-sm dark:border-white/10">
        <h2 className="text-base font-semibold">Recent Activity</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--v2-muted)]">
          {data.activity.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]"
            >
              {item}
            </li>
          ))}
          {data.activity.length === 0 ? <li className="rounded-xl px-3 py-2">No recent activity yet.</li> : null}
        </ul>
      </div>
    </section>
  );
}
