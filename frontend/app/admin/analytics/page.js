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
      subtitle="Volume, follow-through, and bookings—same data as the API, tuned for reading at a glance."
    >
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        <MiniBarsClient title="Leads / day" points={leadsByDay} from="#172554" to="#38bdf8" />
        <MiniBarsClient title="Follow-ups / day" points={followupsByDay} from="#4c1d95" to="#c4b5fd" />
        <MiniBarsClient title="Bookings / day" points={bookingsByDay} from="#7c2d12" to="#fdba74" />
      </div>
      <SurfaceCard className="p-6 sm:p-8" delay={0.06}>
        <p className="text-sm font-semibold tracking-tight text-white">Score mix</p>
        <p className="mt-1 text-[12px] text-slate-500">How urgency buckets balance across scored traffic.</p>
        {scorePie.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No distribution yet"
              description="Once scoring runs at volume, hot / warm / cold splits land in this panel."
              className="py-10"
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {scorePie.map((s) => (
              <div
                key={String(s.label)}
                className="cursor-default rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition-[border-color,background-color,box-shadow] duration-150 hover:border-white/[0.11] hover:bg-white/[0.04] hover:shadow-[0_14px_40px_rgba(0,0,0,0.35)]"
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
