import { AdminShell } from "@/app/admin/_components/AdminShell";
import { EmptyState } from "@/app/admin/_components/EmptyState";
import { MiniBarsClient } from "@/app/admin/_components/MiniBarsClient";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";
import { requireAdminAuth } from "@/app/admin/_lib/auth";
import { getDashboardData } from "@/app/admin/_lib/data";

export default async function AdminAnalyticsPage() {
  await requireAdminAuth();
  let data = {};
  try {
    data = await getDashboardData();
  } catch {
    data = {};
  }
  const leadsByDay = Array.isArray(data?.leads_by_day) ? data.leads_by_day : [];
  const followupsByDay = Array.isArray(data?.followups_by_day) ? data.followups_by_day : [];
  const bookingsByDay = Array.isArray(data?.bookings_by_day) ? data.bookings_by_day : [];
  const scorePie = Array.isArray(data?.score_pie) ? data.score_pie : [];

  return (
    <AdminShell
      activePath="/admin/analytics"
      title="Analytics"
      subtitle="Deep performance trends, funnel behavior, and quality distribution."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <MiniBarsClient title="Leads by day" points={leadsByDay} from="#1e3a8a" to="#60a5fa" />
        <MiniBarsClient title="Follow-ups by day" points={followupsByDay} from="#6d28d9" to="#a78bfa" />
        <MiniBarsClient title="Bookings by day" points={bookingsByDay} from="#c2410c" to="#fb923c" />
      </div>
      <SurfaceCard className="p-6 sm:p-8" delay={0.06}>
        <p className="text-sm font-semibold tracking-tight text-white">Hot / warm / cold distribution</p>
        {scorePie.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No score distribution"
              description="Intent scoring outputs will aggregate into this view once volume builds."
              className="py-10"
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {scorePie.map((s) => (
              <div
                key={String(s.label)}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 transition-[border-color,background-color] duration-150 hover:border-white/[0.11] hover:bg-white/[0.04]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{s.label}</p>
                <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-white">{s.count ?? 0}</p>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </AdminShell>
  );
}
