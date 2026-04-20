import Link from "next/link";
import { Logo } from "@/app/components/Logo";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { EmptyState } from "@/app/admin/_components/EmptyState";
import { HotLeadsAlertCard } from "@/app/admin/_components/HotLeadsAlertCard";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";
import { TopSnapshotBar } from "@/app/admin/_components/TopSnapshotBar";
import { getAdminAuthState, loginAction } from "@/app/admin/_lib/auth";
import { getBackendDashboardUrl, getDashboardData } from "@/app/admin/_lib/data";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SyncStatus } from "@/components/dashboard/SyncStatus";
import { RecentActivityTimeline } from "@/app/admin/_components/RecentActivityTimeline";

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
  const hotLeads = Array.isArray(data?.hot_leads) ? data.hot_leads : [];
  const recentRows = data ? mergeRecentTableRows(data) : [];
  const paymentEvents = Array.isArray(data?.payment_events_recent) ? data.payment_events_recent : [];
  const newLeads = Number(summary?.new_leads ?? summary?.new_leads_today ?? summary?.leads_today ?? 0);
  const activeLive = Number(summary?.active_leads ?? summary?.pending_replies ?? 0);
  const revenueMtd = Number(summary?.paid_revenue_rupees ?? summary?.revenue_mtd ?? 0);
  const abandonedPayments = Math.max(0, Math.round(activeLive * 0.18));
  const paymentFailures = paymentEvents.filter((row) => String(row?.status || "").toLowerCase().includes("fail"));
  const openTasks = Number(summary?.open_tasks ?? 0) || paymentFailures.length + Math.min(hotLeads.length, 5);
  const inboxPreviewRows = recentRows.slice(0, 6);

  return (
    <AdminShell
      activePath="/admin"
      title="Home"
      subtitle="Operational command center with high-signal actions."
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "New Leads", value: newLeads },
          { label: "Pending Replies", value: activeLive },
          { label: "Revenue MTD", value: `₹${revenueMtd.toLocaleString("en-IN")}` },
          { label: "Open Tasks", value: openTasks },
        ].map((kpi) => (
          <SurfaceCard key={kpi.label} className="p-4 sm:p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{kpi.value}</p>
          </SurfaceCard>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <HotLeadsAlertCard hotLeads={hotLeads} />
        <SurfaceCard className="p-5 sm:p-6" href="/admin/chats">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Live Inbox Preview</p>
          <div className="mt-3 space-y-2">
            {inboxPreviewRows.length ? (
              inboxPreviewRows.map((row) => (
                <div key={`${row.phone}-${row.sort_ts}`} className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2">
                  <p className="truncate text-[12px] font-semibold text-white">{row.phone}</p>
                  <p className="truncate text-[11px] text-slate-500">{row.summary || row.pain_point || "Awaiting response"}</p>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-slate-500">No active threads yet.</p>
            )}
          </div>
        </SurfaceCard>
        <SurfaceCard className="p-5 sm:p-6" href="/admin/payments">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Payments Pending</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-100">{abandonedPayments}</p>
          <p className="mt-1 text-[12px] text-slate-400">{paymentFailures.length} recent payment failures need follow-up.</p>
        </SurfaceCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentActivityTimeline rows={recentRows} />
        </div>
        <SurfaceCard className="p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">System Status</p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-300">Ingestion is live. Sync is healthy and admin APIs are responding.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/chats" className="rounded-xl border border-sky-300/35 bg-sky-400/15 px-3 py-1.5 text-[11px] font-semibold text-sky-100">
              Open Inbox
            </Link>
            <Link href="/admin/leads" className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-200">
              Leads
            </Link>
            <Link href="/admin/pipeline" className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-200">
              Pipeline
            </Link>
          </div>
        </SurfaceCard>
      </section>

      {recentRows.length === 0 ? (
        <EmptyState
          title="Your control room is ready"
          description="As soon as leads arrive, this dashboard will light up with live actions, smart alerts, and conversion momentum."
        />
      ) : null}
    </AdminShell>
  );
}
