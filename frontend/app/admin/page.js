import { Logo } from "@/app/components/Logo";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { getAdminAuthState, loginAction } from "@/app/admin/_lib/auth";
import { getBackendDashboardUrl, getDashboardData } from "@/app/admin/_lib/data";

export const metadata = {
  title: "Admin Dashboard - Stratxcel",
  robots: { index: false, follow: false },
};

function KpiCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.05] sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-[1.85rem]">{value}</p>
      <p className="mt-1 text-[12px] text-slate-400">{hint}</p>
    </div>
  );
}

function MiniBars({ title, points, emptyHint = "No data yet." }) {
  const list = Array.isArray(points) ? points : [];
  const max = Math.max(1, ...list.map((d) => Number(d.count) || 0));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{emptyHint}</p>
      ) : (
        <div className="mt-4 flex h-40 items-end gap-2 sm:gap-3">
          {list.map((point) => (
            <div key={String(point.date)} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-[#7C3AED] to-[#A78BFA]"
                  style={{ height: `${Math.max(8, ((Number(point.count) || 0) / max) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">{point.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function mergeRecentTableRows(data) {
  const pipeline = Array.isArray(data?.recent_pipeline) ? data.recent_pipeline : [];
  const completed = Array.isArray(data?.recent_leads) ? data.recent_leads : [];
  const rows = [];

  for (const r of pipeline) {
    rows.push({
      phone: r.phone ?? "-",
      business_type: r.business_type ?? "-",
      pain_point: r.pain_point ?? "-",
      intent: r.intent ?? "-",
      intent_score: r.intent_score ?? "-",
      urgency: r.urgency ?? "-",
      summary: r.summary ?? "-",
      followup_stage: r.followup_stage ?? "-",
      status: r.status ?? "-",
      sort_ts: r.last_reply_time || "",
    });
  }
  for (const e of completed) {
    rows.push({
      phone: e.phone ?? "-",
      business_type: e.business_type ?? "-",
      pain_point: e.pain_point ?? "-",
      intent: e.intent ?? "-",
      intent_score: e.intent_score ?? "-",
      urgency: e.urgency ?? "-",
      summary: e.summary ?? "-",
      followup_stage: "-",
      status: "completed",
      sort_ts: e.timestamp_utc || "",
    });
  }
  rows.sort((a, b) => String(b.sort_ts).localeCompare(String(a.sort_ts)));
  return rows.slice(0, 35);
}

export default async function AdminPage() {
  const { authed } = await getAdminAuthState();

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#0B1220] px-4 py-14 text-slate-100 sm:px-6">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-7">
          <Logo variant="dark" />
          <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Internal access only.</p>
          <form action={loginAction} className="mt-5 space-y-3">
            <input
              name="password"
              type="password"
              placeholder="Password"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/30"
            />
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#45C4FF] to-[#1E3A8A] text-sm font-semibold text-white transition hover:brightness-110"
            >
              Open Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  let data;
  let error = "";
  try {
    data = await getDashboardData();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load dashboard data";
  }

  const summary = data?.summary || {};
  const trend = Array.isArray(data?.trend_7d) ? data.trend_7d : [];
  const painPoints = Array.isArray(data?.top_pain_points) ? data.top_pain_points : [];
  const hotLeads = Array.isArray(data?.hot_leads) ? data.hot_leads : [];
  const recentRows = data ? mergeRecentTableRows(data) : [];
  const painMax = Math.max(1, ...painPoints.map((d) => d.count || 0));

  const conversionPct = summary.conversion_rate_pct ?? summary.conversion_rate ?? 0;

  return (
    <AdminShell
      activePath="/admin"
      title="Dashboard"
      subtitle="High-signal operating view. Deep analytics and workflows are in dedicated modules."
    >
      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Could not load `{getBackendDashboardUrl()}`: {error}
        </div>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Leads" value={summary.total_leads ?? 0} hint="Unique conversations started" />
        <KpiCard label="Active Leads" value={summary.active_leads ?? 0} hint="Open pipeline requiring follow-up" />
        <KpiCard label="Booked Calls" value={summary.booked_calls ?? 0} hint={`Conversion: ${conversionPct}%`} />
        <KpiCard label="Hot Leads" value={summary.hot_leads_count ?? 0} hint="Priority prospects to action now" />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200/80">Needs Attention</p>
          <ul className="mt-3 space-y-2 text-sm text-amber-100">
            <li>• {summary.hot_leads_count ?? 0} hot leads need immediate outreach.</li>
            <li>• {summary.active_leads ?? 0} active leads are awaiting next touchpoint.</li>
            <li>• {summary.cold_leads ?? 0} leads moved cold; consider revival workflows.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Quick Actions</p>
          <div className="mt-3 grid gap-2">
            <a href="/admin/leads" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.08]">
              Review lead queue
            </a>
            <a href="/admin/pipeline" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.08]">
              Open pipeline board
            </a>
            <a href="/admin/automation" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.08]">
              Tune follow-up automations
            </a>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-semibold text-white">Live Activity Feed</p>
          <ul className="mt-3 space-y-2">
            {recentRows.slice(0, 7).map((item, idx) => (
              <li key={`${item.phone}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
                <span className="text-slate-200">{item.phone}</span>
                <span className="text-slate-400"> · {item.business_type}</span>
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{item.status}</span>
              </li>
            ))}
            {recentRows.length === 0 ? <li className="text-sm text-slate-400">No recent activity.</li> : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-semibold text-white">Recent Hot Leads</p>
          <ul className="mt-3 space-y-2">
            {hotLeads.slice(0, 6).map((lead, idx) => (
              <li key={`${lead.phone || "hot"}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <p className="text-sm font-medium text-white">{lead.phone || "-"}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {lead.business_type || "-"} · {lead.pain_point || "-"} · {lead.intent_score || "-"}
                </p>
              </li>
            ))}
            {hotLeads.length === 0 ? <li className="text-sm text-slate-400">No hot leads right now.</li> : null}
          </ul>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <MiniBars title="7 Day Leads Pulse" points={trend} />
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-semibold text-white">Top Pain Points</p>
          <div className="mt-4 space-y-3">
            {painPoints.length === 0 ? (
              <p className="text-sm text-slate-400">No data yet.</p>
            ) : (
              painPoints.map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-slate-300">
                    <span>{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#45C4FF] to-[#1E3A8A]"
                      style={{ width: `${Math.max(5, ((item.count || 0) / painMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
