import { PageHeader } from "@/components/v2/page-header";
import { getV2DashboardData } from "@/lib/v2/dashboard-data";
import { validateLaunchEnv } from "@/lib/v2/env";

export default async function DashboardPage() {
  const env = validateLaunchEnv();
  const data = await getV2DashboardData();
  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Executive overview of conversations, payments, and team throughput."
        action={
          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-[var(--v2-muted)] transition hover:border-white/20 hover:bg-white/[0.05]">
              Export
            </button>
            <button className="rounded-xl border border-[#3b82f6]/35 bg-[#3b82f6]/14 px-3 py-2 text-xs text-[#bdd2ff] transition hover:bg-[#3b82f6]/20">
              New Report
            </button>
          </div>
        }
      />
      {!env.ok ? (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100">
          Setup required: missing env keys ({env.missing.join(", ")}). Running in degraded mode.
        </div>
      ) : null}
      {data.degraded ? (
        <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-[var(--v2-muted)] dark:border-white/10 dark:bg-white/[0.03]">
          Backend service is currently unreachable. Showing partial dashboard data.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-white/10 bg-[#0f131a] px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.22)]"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--v2-muted)]">{metric.label}</p>
            <p className="mt-3 text-xl font-semibold leading-tight">{metric.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0f131a] px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.22)]">
          <h2 className="text-base font-semibold tracking-tight">Recent Activity</h2>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--v2-muted)]">
            {data.activity.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#6fa0ff]" />
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
            {data.activity.length === 0 ? <li className="rounded-xl px-3 py-2">No activity today</li> : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f131a] px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.22)]">
          <h2 className="text-base font-semibold tracking-tight">Quick Actions</h2>
          <div className="mt-3 grid gap-2">
            <button className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-sm text-[var(--v2-muted)] transition hover:border-white/20 hover:bg-white/[0.05]">
              Open unassigned conversations
            </button>
            <button className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-sm text-[var(--v2-muted)] transition hover:border-white/20 hover:bg-white/[0.05]">
              Review pending payments
            </button>
            <button className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-sm text-[var(--v2-muted)] transition hover:border-white/20 hover:bg-white/[0.05]">
              Invite new team member
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
