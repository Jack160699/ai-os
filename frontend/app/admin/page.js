import Link from "next/link";
import { Logo } from "@/app/components/Logo";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { EmptyState } from "@/app/admin/_components/EmptyState";
import { KpiStatCard } from "@/app/admin/_components/KpiStatCard";
import { MiniBarsClient } from "@/app/admin/_components/MiniBarsClient";
import { StaggerFeed } from "@/app/admin/_components/StaggerFeed";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";
import { getAdminAuthState, loginAction } from "@/app/admin/_lib/auth";
import { getBackendDashboardUrl, getDashboardData } from "@/app/admin/_lib/data";
import { activeShareTrend, bookedTrend, hotTrend, seriesHalfMomentum } from "@/app/admin/_lib/trends";

export const metadata = {
  title: "Admin Dashboard - Stratxcel",
  robots: { index: false, follow: false },
};

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
      <main className="min-h-screen bg-[#05070c] px-4 py-16 text-slate-100 sm:px-6">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
          <Logo variant="dark" />
          <h1 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">Admin</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">Internal workspace. Sign in to continue.</p>
          <form action={loginAction} className="mt-6 space-y-3">
            <input
              name="password"
              type="password"
              placeholder="Password"
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/[0.2] focus:ring-2 focus:ring-white/[0.06]"
            />
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#6366f1] to-[#2563eb] text-sm font-semibold text-white transition-[filter] duration-150 hover:brightness-110"
            >
              Continue
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
  const leadMomentum = seriesHalfMomentum(trend);
  const activeTrend = activeShareTrend(summary);
  const bookedT = bookedTrend(summary);
  const hotT = hotTrend(summary);

  const activityItems = recentRows.slice(0, 7).map((item, idx) => ({
    id: `${item.phone}-${idx}`,
    title: item.phone,
    subtitle: item.business_type,
    badge: item.status,
  }));

  const hotItems = hotLeads.slice(0, 6).map((lead, idx) => ({
    id: `${lead.phone || "hot"}-${idx}`,
    title: lead.phone || "—",
    subtitle: [lead.business_type, lead.pain_point, lead.intent_score].filter(Boolean).join(" · ") || undefined,
  }));

  return (
    <AdminShell
      activePath="/admin"
      title="Dashboard"
      subtitle="High-signal operating view. Deep analytics and workflows live in dedicated modules."
    >
      {error ? (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3 text-[13px] text-rose-100">
          Could not load <span className="font-mono text-[12px] text-rose-200/90">{getBackendDashboardUrl()}</span>
          <span className="mt-1 block text-rose-200/80">{error}</span>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStatCard
          index={0}
          label="Total leads"
          value={String(summary.total_leads ?? 0)}
          hint="Unique conversations started"
          trend={leadMomentum}
        />
        <KpiStatCard
          index={1}
          label="Active leads"
          value={String(summary.active_leads ?? 0)}
          hint="Open pipeline requiring follow-up"
          trend={activeTrend}
        />
        <KpiStatCard
          index={2}
          label="Booked calls"
          value={String(summary.booked_calls ?? 0)}
          hint={`Conversion ${conversionPct}%`}
          trend={bookedT}
        />
        <KpiStatCard
          index={3}
          label="Hot leads"
          value={String(summary.hot_leads_count ?? 0)}
          hint="Priority prospects to action now"
          trend={hotT}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <SurfaceCard
          className="border-amber-400/20 bg-gradient-to-b from-amber-400/[0.06] to-transparent p-6 hover:border-amber-400/28"
          delay={0.04}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-200/75">Needs attention</p>
          <ul className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-amber-50/95">
            <li className="flex gap-2">
              <span className="select-none text-amber-200/50">•</span>
              <span>{summary.hot_leads_count ?? 0} hot leads need immediate outreach.</span>
            </li>
            <li className="flex gap-2">
              <span className="select-none text-amber-200/50">•</span>
              <span>{summary.active_leads ?? 0} active leads await the next touchpoint.</span>
            </li>
            <li className="flex gap-2">
              <span className="select-none text-amber-200/50">•</span>
              <span>{summary.cold_leads ?? 0} leads moved cold; consider revival workflows.</span>
            </li>
          </ul>
        </SurfaceCard>

        <SurfaceCard className="p-6" delay={0.06}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Quick actions</p>
          <div className="mt-4 grid gap-2">
            {[
              { href: "/admin/leads", label: "Review lead queue" },
              { href: "/admin/pipeline", label: "Open pipeline board" },
              { href: "/admin/automation", label: "Tune automations" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-[13px] font-medium text-slate-200 transition-colors duration-150 hover:border-white/[0.11] hover:bg-white/[0.05]"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <SurfaceCard className="p-6" delay={0.05}>
          <p className="text-sm font-semibold tracking-tight text-white">Live activity</p>
          <StaggerFeed
            items={activityItems}
            emptyTitle="No recent activity"
            emptyDescription="When pipeline and completed leads update, they will stream in here."
          />
        </SurfaceCard>

        <SurfaceCard className="p-6" delay={0.07}>
          <p className="text-sm font-semibold tracking-tight text-white">Recent hot leads</p>
          <StaggerFeed
            items={hotItems}
            emptyTitle="No hot leads"
            emptyDescription="Scored hot prospects will surface here for fast follow-up."
          />
        </SurfaceCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <MiniBarsClient title="7-day leads pulse" points={trend} emptyHint="No trend data yet" />
        <SurfaceCard className="p-6" delay={0.08}>
          <p className="text-sm font-semibold tracking-tight text-white">Top pain points</p>
          <div className="mt-5 space-y-4">
            {painPoints.length === 0 ? (
              <EmptyState
                title="No pain-point clusters yet"
                description="When transcripts accumulate, themes rank here automatically."
                className="py-10"
              />
            ) : (
              painPoints.map((item) => (
                <div key={String(item.label)}>
                  <div className="mb-1.5 flex items-center justify-between text-[12px] text-slate-400">
                    <span className="font-medium text-slate-300">{item.label}</span>
                    <span className="tabular-nums text-slate-500">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                      style={{ width: `${Math.max(6, ((item.count || 0) / painMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>
      </section>
    </AdminShell>
  );
}
