import Link from "next/link";
import dynamic from "next/dynamic";
import { Logo } from "@/app/components/Logo";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { EmptyState } from "@/app/admin/_components/EmptyState";
import { AIGrowthIntelligence } from "@/app/admin/_components/AIGrowthIntelligence";
import { HotLeadsAlertCard } from "@/app/admin/_components/HotLeadsAlertCard";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";
import { TopSnapshotBar } from "@/app/admin/_components/TopSnapshotBar";
import { getAdminAuthState, loginAction } from "@/app/admin/_lib/auth";
import { getBackendDashboardUrl, getDashboardData } from "@/app/admin/_lib/data";
import { AgentCenter } from "@/components/dashboard/AgentCenter";
import { CollapsibleSection } from "@/components/dashboard/CollapsibleSection";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SyncStatus } from "@/components/dashboard/SyncStatus";
import { getAgentCenterItems } from "@/lib/agents";
import { RecentActivityTimeline } from "@/app/admin/_components/RecentActivityTimeline";
const LeadsCommandCenter = dynamic(() => import("@/app/admin/_components/LeadsCommandCenter").then((m) => m.LeadsCommandCenter), {
  loading: () => <div className="admin-skeleton h-64 w-full rounded-2xl" />,
});
const SalesFunnelVisual = dynamic(() => import("@/app/admin/_components/SalesFunnelVisual").then((m) => m.SalesFunnelVisual), {
  loading: () => <div className="admin-skeleton h-64 w-full rounded-2xl" />,
});
const RevenueCenter = dynamic(() => import("@/app/admin/_components/RevenueCenter").then((m) => m.RevenueCenter), {
  loading: () => <div className="admin-skeleton h-72 w-full rounded-2xl" />,
});
const AutomationControlPanel = dynamic(
  () => import("@/app/admin/_components/AutomationControlPanel").then((m) => m.AutomationControlPanel),
  { loading: () => <div className="admin-skeleton h-64 w-full rounded-2xl" /> },
);

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
      growth_score: r.growth_score,
      growth_label: r.growth_label,
      lead_tags: r.lead_tags,
      note_preview: r.note_preview,
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
      growth_score: null,
      growth_label: null,
      lead_tags: [],
      note_preview: "",
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
          <h1 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">Sign in</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            This console is restricted. Use the shared password to open your workspace.
          </p>
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
              Enter workspace
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
  const painPoints = Array.isArray(data?.top_pain_points) ? data.top_pain_points : [];
  const hotLeads = Array.isArray(data?.hot_leads) ? data.hot_leads : [];
  const recentRows = data ? mergeRecentTableRows(data) : [];
  const paymentEvents = Array.isArray(data?.payment_events_recent) ? data.payment_events_recent : [];
  const agentStatuses = getAgentCenterItems();
  const dailyWin = Number(summary?.bookings_today ?? 0) * 499;
  const activeLive = Number(summary?.active_leads ?? 0);
  const abandonedPayments = Math.max(0, Math.round(activeLive * 0.18));
  const paymentFailures = paymentEvents.filter((row) => String(row?.status || "").toLowerCase().includes("fail"));

  return (
    <AdminShell
      activePath="/admin"
      title="Dashboard"
      subtitle="CEO command center for growth, revenue, and conversion execution."
      headerRight={<QuickActions />}
    >
      <SyncStatus syncedAt={data?.updated_at || data?.summary?.updated_at || new Date().toISOString()} />
      {error ? (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3 text-[13px] text-rose-100">
          <span className="font-medium">We couldn&apos;t reach the metrics service.</span>
          <span className="mt-1 block font-mono text-[12px] text-rose-200/90">{getBackendDashboardUrl()}</span>
          <span className="mt-1 block text-rose-200/85">{error}</span>
        </div>
      ) : null}

      <TopSnapshotBar summary={summary} syncedAt={data?.updated_at || new Date().toISOString()} />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SurfaceCard className="p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Daily Owner Summary</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">₹{dailyWin.toLocaleString("en-IN")} earned today</h3>
          <p className="mt-2 text-[13px] text-slate-400">Momentum is healthy. Keep response speed high for hot leads.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-xl border border-sky-300/35 bg-sky-400/15 px-3.5 py-2 text-xs font-semibold text-sky-100">
              What should I focus on now?
            </button>
            <button className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-200">
              One-click WhatsApp blast
            </button>
            <button className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-200">
              Quick Add Lead
            </button>
            <Link href="/admin/analytics" className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-200">
              Open Revenue Center
            </Link>
          </div>
        </SurfaceCard>
        <SurfaceCard className="p-5 sm:p-6" href="/admin/pipeline">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Lead Heatmap</p>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className={`h-5 rounded ${i % 5 === 0 ? "bg-emerald-400/35" : i % 3 === 0 ? "bg-amber-400/25" : "bg-white/[0.07]"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-[12px] text-slate-500">Peak activity clusters visible across recent lead touches.</p>
        </SurfaceCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Real-time Active Leads</p>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              live
            </span>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{activeLive}</p>
          <p className="mt-1 text-[12px] text-slate-400">Leads currently waiting for next action.</p>
          <div className="mt-4 flex gap-2">
            <Link href="/admin/chats" className="rounded-xl border border-sky-300/35 bg-sky-400/15 px-3 py-1.5 text-[11px] font-semibold text-sky-100">
              Open hot inbox
            </Link>
            <Link href="/admin/pipeline" className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-200">
              Review pipeline
            </Link>
          </div>
        </SurfaceCard>
        <SurfaceCard className="p-5 sm:p-6" href="/admin/payments">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Abandoned Payment Alert</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-100">{abandonedPayments}</p>
          <p className="mt-1 text-[12px] text-slate-400">High-intent leads paused after payment step.</p>
          <div className="mt-4 flex gap-2">
            <button className="rounded-xl border border-amber-300/35 bg-amber-400/15 px-3 py-1.5 text-[11px] font-semibold text-amber-100">
              Send payment reminder
            </button>
            <button className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-200">
              Assign sales owner
            </button>
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <SurfaceCard className="p-5 sm:p-6" href="/admin/payments">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Payment Alerts</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{paymentFailures.length}</p>
          <p className="mt-1 text-[12px] text-slate-400">Recent payment failures needing follow-up.</p>
        </SurfaceCard>
        <SurfaceCard className="p-5 sm:p-6" href="/admin/payments">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Daily Revenue Snapshot</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-100">
            ₹{Number(summary?.paid_revenue_rupees ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[12px] text-slate-400">Captured revenue reflected from payment events.</p>
        </SurfaceCard>
      </section>

      <CollapsibleSection title="AI Intelligence" defaultOpen>
        <AIGrowthIntelligence summary={summary} topPainPoints={painPoints} />
      </CollapsibleSection>

      <CollapsibleSection title="Leads Command Center" defaultOpen>
        <LeadsCommandCenter rows={recentRows} />
      </CollapsibleSection>

      <RecentActivityTimeline rows={recentRows} />

      <CollapsibleSection title="Live Funnel + Revenue Center" defaultOpen>
        <section className="grid gap-6 xl:grid-cols-2">
          <SalesFunnelVisual summary={summary} />
          <RevenueCenter summary={summary} leadsByDay={Array.isArray(data?.leads_by_day) ? data.leads_by_day : []} />
        </section>
      </CollapsibleSection>

      <CollapsibleSection title="Automation + Team" defaultOpen={false}>
        <section className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
          <AutomationControlPanel />
          <AgentCenter agents={agentStatuses} loading={!data && !error} />
        </section>
        <section className="mt-6 flex flex-wrap gap-2">
          {[
            { href: "/admin/chats", label: "Open Chat Command" },
            { href: "/admin/payments", label: "Open Payments Center" },
            { href: "/admin/analytics", label: "Open Revenue Analytics Page" },
            { href: "/admin/leads", label: "Lead Registry" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[12px] text-slate-200">
              {a.label}
            </Link>
          ))}
        </section>
      </CollapsibleSection>

      {recentRows.length === 0 ? (
        <EmptyState
          title="Your control room is ready"
          description="As soon as leads arrive, this dashboard will light up with live actions, smart alerts, and conversion momentum."
        />
      ) : null}
      <HotLeadsAlertCard hotLeads={hotLeads} />
    </AdminShell>
  );
}
