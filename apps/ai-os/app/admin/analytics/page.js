import { AdminShell } from "@/app/admin/_components/AdminShell";
import { DonutScoreChartClient } from "@/app/admin/_components/DonutScoreChartClient";
import { MiniBarsClient } from "@/app/admin/_components/MiniBarsClient";
import { RevenueCenter } from "@/app/admin/_components/RevenueCenter";
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
  const summary = data?.summary || {};
  const sourceRoi = Array.isArray(data?.source_roi) ? data.source_roi : [];

  return (
    <AdminShell
      activePath="/admin/analytics"
      title="Revenue & Conversion Analytics"
      subtitle="Executive financial visibility across today, 7 days, 30 days, and lifetime."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SurfaceCard className="p-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Gross revenue</p>
          <p className="mt-2 text-2xl font-semibold text-white">₹{Number(summary.paid_revenue_rupees || 0).toLocaleString("en-IN")}</p>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Paid sessions sold</p>
          <p className="mt-2 text-2xl font-semibold text-white">{Number(summary.payments_count_30d || 0).toLocaleString("en-IN")}</p>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Avg order value</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            ₹
            {(Number(summary.paid_revenue_rupees || 0) / Math.max(1, Number(summary.payments_count_30d || 0))).toFixed(0)}
          </p>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Refund %</p>
          <p className="mt-2 text-2xl font-semibold text-white">0.0%</p>
        </SurfaceCard>
      </div>

      <RevenueCenter summary={summary} leadsByDay={leadsByDay} />

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        <MiniBarsClient title="Leads / day" points={leadsByDay} from="#172554" to="#38bdf8" />
        <MiniBarsClient title="Follow-ups / day" points={followupsByDay} from="#4c1d95" to="#c4b5fd" />
        <MiniBarsClient title="Bookings / day" points={bookingsByDay} from="#7c2d12" to="#fdba74" />
      </div>
      <SurfaceCard className="p-6 sm:p-8" delay={0.06}>
        <p className="text-sm font-semibold tracking-tight text-white">Score mix</p>
        <p className="mt-1 text-[12px] text-slate-500">How urgency buckets balance across scored traffic.</p>
        <DonutScoreChartClient data={scorePie} />
      </SurfaceCard>

      <SurfaceCard className="p-6">
        <p className="text-sm font-semibold tracking-tight text-white">Source ROI</p>
        <p className="mt-1 text-[12px] text-slate-500">Signals from conversion logs — rank by composite ROI score.</p>
        {sourceRoi.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-4 py-10 text-center text-[13px] text-slate-500">
            No source-level events yet. As WhatsApp journeys log conversions, ROI rows appear here automatically.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="admin-table min-w-[640px] w-full text-left text-[12px]">
              <thead>
                <tr>
                  {["Source", "Started", "CTA", "Paid", "Conv. index %", "ROI score"].map((h) => (
                    <th key={h} className="px-2 py-2 text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sourceRoi.map((row) => (
                  <tr key={row.source} className="border-t border-white/[0.06]">
                    <td className="px-2 py-2.5 font-medium text-slate-200">{row.source}</td>
                    <td className="px-2 py-2.5 text-slate-400">{row.started_signals}</td>
                    <td className="px-2 py-2.5 text-slate-400">{row.cta_signals}</td>
                    <td className="px-2 py-2.5 text-slate-400">{row.paid_signals}</td>
                    <td className="px-2 py-2.5 text-slate-400">{row.conversion_index_pct}</td>
                    <td className="px-2 py-2.5 text-emerald-200/90">{row.roi_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard className="p-6">
        <p className="text-sm font-semibold tracking-tight text-white">Conversion event exports</p>
        <p className="mt-1 text-[12px] text-slate-500">Download structured logs for date, started, CTA shown, paid, source, language, and path selected.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/dashboard/conversion.csv" className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-100">
            Download CSV
          </a>
          <a href="/dashboard/conversion.json" className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-100">
            View JSON
          </a>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
          Email digests: POST <span className="font-mono text-slate-400">/internal/digest-daily</span> and{" "}
          <span className="font-mono text-slate-400">/internal/digest-weekly</span> on your bot host with header{" "}
          <span className="font-mono text-slate-400">X-Followup-Cron-Secret</span> (same secret as follow-up cron). Set{" "}
          <span className="font-mono text-slate-400">SMTP_HOST</span>, <span className="font-mono text-slate-400">SMTP_USER</span>,{" "}
          <span className="font-mono text-slate-400">SMTP_PASSWORD</span>, <span className="font-mono text-slate-400">OWNER_DIGEST_EMAIL</span>.
        </p>
      </SurfaceCard>
    </AdminShell>
  );
}
