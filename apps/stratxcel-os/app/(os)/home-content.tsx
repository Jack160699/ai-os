import Link from "next/link";
import { getResetBatchId } from "@/lib/batch";
import {
  computeDailyAlerts,
  computeDashboardKpis,
  getAiInsights,
  getHotLeads,
  getInboxSnapshot,
  getLeadsForBatch,
  getPaymentLinksForBatch,
  getPipelineStages,
} from "@/lib/queries";
import { buildConversionSeries, buildFunnelCounts, buildRevenueTrend } from "@/lib/dashboard-chart-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardCharts } from "@/components/os/dashboard-charts";

const money = (cents: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    Math.round(cents / 100),
  );

export async function HomeContent() {
  const batchId = await getResetBatchId();
  const [stages, leads, hot, insights, snapshot, paymentLinks] = await Promise.all([
    getPipelineStages(batchId),
    getLeadsForBatch(batchId),
    getHotLeads(batchId, 8),
    getAiInsights(batchId, 5),
    getInboxSnapshot(batchId, 4),
    getPaymentLinksForBatch(batchId),
  ]);
  const kpis = await computeDashboardKpis(batchId, stages, leads);
  const alerts = computeDailyAlerts({ leads, paymentLinks, kpis, stages });

  const wonId = stages.find((s) => s.stage_key === "won")?.id;
  const lostId = stages.find((s) => s.stage_key === "lost")?.id;
  const revenueTrend = buildRevenueTrend(leads, wonId, 14);
  const funnel = buildFunnelCounts(stages, leads);
  const conversion = buildConversionSeries(leads, wonId, lostId, 14);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Command center</h1>
          <p className="mt-1 text-sm text-slate-400">Today, in this batch — only what moves revenue.</p>
        </div>
        <p className="text-[11px] font-mono text-slate-500">Batch {batchId.slice(0, 8)}…</p>
      </div>

      {alerts.length > 0 ? (
        <Card className="sx-card rounded-xl border-amber-500/25 bg-amber-500/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Today&apos;s alerts</CardTitle>
            <CardDescription className="text-xs">Rule-based signals for revenue execution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="flex gap-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2.5 text-sm text-slate-200"
              >
                <Badge
                  variant={a.severity === "critical" ? "hot" : a.severity === "warning" ? "warm" : "secondary"}
                  className="h-5 shrink-0"
                >
                  {a.severity}
                </Badge>
                <p className="min-w-0 leading-snug">{a.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Revenue today", value: money(kpis.revenueTodayCents), hint: "Won deals updated today (proxy)." },
          { label: "Active leads", value: String(kpis.activeLeads), hint: "Excludes won/lost." },
          { label: "Conversion", value: `${kpis.conversionRate}%`, hint: "Won ÷ (won + lost)." },
          { label: "Pending replies", value: String(kpis.pendingReplies), hint: "Leads flagged unreplied." },
        ].map((k) => (
          <Card key={k.label} className="sx-card rounded-xl border-white/[0.08]">
            <CardHeader className="space-y-1 pb-2 pt-4">
              <CardDescription className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{k.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums tracking-tight md:text-3xl">{k.value}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 text-xs leading-relaxed text-slate-500">{k.hint}</CardContent>
          </Card>
        ))}
      </div>

      <DashboardCharts revenueTrend={revenueTrend} funnel={funnel} conversion={conversion} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="sx-card rounded-xl border-white/[0.08]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">Hot leads</CardTitle>
              <CardDescription className="text-xs">Priority follow-ups</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline" className="border-white/10">
              <Link href="/leads">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {hot.length === 0 ? <p className="text-sm text-slate-500">No hot leads in this batch.</p> : null}
            {hot.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{l.full_name}</p>
                  <p className="truncate text-xs text-slate-500">{l.phone ?? "—"}</p>
                </div>
                <Badge variant="secondary">AI {l.ai_score}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="sx-card rounded-xl border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-base font-medium">AI insights</CardTitle>
            <CardDescription className="text-xs">Short, actionable signals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.length === 0 ? (
              <p className="text-sm text-slate-500">No insights yet. Insert `activities` rows with kind = ai_insight.</p>
            ) : null}
            {insights.map((a) => (
              <div key={a.id} className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200">
                {a.summary}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="sx-card rounded-xl border-white/[0.08]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium">Inbox snapshot</CardTitle>
            <CardDescription className="text-xs">Latest threads</CardDescription>
          </div>
          <Button asChild size="sm" variant="outline" className="border-white/10">
            <Link href="/inbox">Open inbox</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {snapshot.length === 0 ? <p className="text-sm text-slate-500">No conversations yet.</p> : null}
          {snapshot.map((c) => (
            <div
              key={c.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{c.lead.full_name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{c.last_preview ?? "—"}</p>
              </div>
              <Badge
                variant={c.lead.temperature === "hot" ? "hot" : c.lead.temperature === "warm" ? "warm" : "cold"}
                className="shrink-0 capitalize"
              >
                {c.lead.temperature}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="sx-card rounded-xl border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-base font-medium">Quick actions</CardTitle>
          <CardDescription className="text-xs">One tap to the next move</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/leads">Add lead</Link>
          </Button>
          <Button asChild variant="secondary" className="flex-1">
            <Link href="/more/payments">Payment links</Link>
          </Button>
          <Button asChild variant="secondary" className="flex-1">
            <Link href="/more/proposals">Proposal templates</Link>
          </Button>
        </CardContent>
      </Card>

      <Separator className="bg-white/10" />
      <p className="text-center text-xs text-slate-600">StratXcel OS — operator speed over dashboard theater.</p>
    </div>
  );
}
