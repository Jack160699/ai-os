import { getResetBatchId } from "@/lib/batch";
import {
  computeDailyAlerts,
  computeDashboardKpis,
  getAiInsights,
  getHotLeads,
  getInboxThreadCount,
  getLeadsForBatch,
  getPaymentLinksForBatch,
  getPipelineStages,
} from "@/lib/queries";
import {
  buildFunnelWithConversion,
  buildLeadSourceBreakdown,
  buildPremiumKpis,
  buildRevenueWithForecast,
  buildTimelineItems,
} from "@/lib/dashboard-chart-data";
import { StatusHubDashboard } from "@/components/os/status-hub-dashboard";

export async function HomeContent() {
  const batchId = await getResetBatchId();
  const [stages, leads, hot, insights, paymentLinks, inboxThreadCount] = await Promise.all([
    getPipelineStages(batchId),
    getLeadsForBatch(batchId),
    getHotLeads(batchId, 8),
    getAiInsights(batchId, 8),
    getPaymentLinksForBatch(batchId),
    getInboxThreadCount(batchId),
  ]);
  const kpis = await computeDashboardKpis(batchId, stages, leads);
  const alerts = computeDailyAlerts({ leads, paymentLinks, kpis, stages });

  const wonId = stages.find((s) => s.stage_key === "won")?.id;
  const revenueForecast = buildRevenueWithForecast(leads, wonId, 14, 7);
  const funnelViz = buildFunnelWithConversion(stages, leads);
  const leadSources = buildLeadSourceBreakdown(leads, 6);
  const premiumKpis = buildPremiumKpis(leads, stages, paymentLinks, { conversionRate: kpis.conversionRate });
  const timeline = buildTimelineItems(leads, paymentLinks, stages, 5);

  const pendingPayments = paymentLinks.filter((p) => p.status === "pending" || p.status === "partially_paid").length;
  const unreplied = leads.filter((l) => l.has_unreplied && !l.archived).length;

  const revDelta = premiumKpis[0]?.deltaText ?? "";
  const subtitle = [revDelta, `${hot.length} hot leads`, `${pendingPayments} pending payments`, `${unreplied} threads need attention`]
    .filter(Boolean)
    .join(" · ");

  return (
    <StatusHubDashboard
      subtitle={subtitle}
      premiumKpis={premiumKpis}
      revenueForecast={revenueForecast}
      funnelViz={funnelViz}
      leadSources={leadSources}
      alerts={alerts}
      insights={insights.map((a) => ({ id: a.id, summary: a.summary }))}
      timeline={timeline}
      operationsExtras={{
        pendingReplies: kpis.pendingReplies,
        inboxThreads: inboxThreadCount,
        pendingPayments,
      }}
    />
  );
}
