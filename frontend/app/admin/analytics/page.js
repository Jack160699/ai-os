import { AdminShell } from "@/app/admin/_components/AdminShell";
import { requireAdminAuth } from "@/app/admin/_lib/auth";
import { getDashboardData } from "@/app/admin/_lib/data";

function Bars({ title, points, from = "#1E3A8A", to = "#45C4FF" }) {
  const list = Array.isArray(points) ? points : [];
  const max = Math.max(1, ...list.map((d) => Number(d.count) || 0));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-4 flex h-40 items-end gap-2">
        {list.map((p) => (
          <div key={String(p.date)} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${Math.max(8, ((Number(p.count) || 0) / max) * 100)}%`,
                  background: `linear-gradient(to top, ${from}, ${to})`,
                }}
              />
            </div>
            <span className="text-[11px] text-slate-400">{p.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <div className="grid gap-4 lg:grid-cols-3">
        <Bars title="Leads by Day" points={leadsByDay} />
        <Bars title="Follow-ups by Day" points={followupsByDay} from="#7C3AED" to="#A78BFA" />
        <Bars title="Bookings by Day" points={bookingsByDay} from="#F97316" to="#FB923C" />
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-semibold text-white">Hot / Warm / Cold Distribution</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {scorePie.map((s) => (
            <div key={String(s.label)} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{s.label}</p>
              <p className="mt-1 text-xl font-semibold text-white">{s.count ?? 0}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
