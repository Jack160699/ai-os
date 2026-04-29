import { DashboardHeaderActions } from "@/components/v2/dashboard-header-actions";
import { PageHeader } from "@/components/v2/page-header";
import { DashboardCanvas } from "@/components/v2/dashboard-canvas";
import { getV2DashboardData } from "@/lib/v2/dashboard-data";
import { validateLaunchEnv } from "@/lib/v2/env";

export default async function DashboardPage() {
  const env = validateLaunchEnv();
  const data = await getV2DashboardData();
  return (
    <section className="space-y-6">
      <PageHeader page="dashboard" action={<DashboardHeaderActions />} />
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

      <DashboardCanvas metrics={data.metrics} activity={data.activity} />
    </section>
  );
}
