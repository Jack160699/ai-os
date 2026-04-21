import type { Lead, PaymentLink, PipelineStage } from "@/lib/models";

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(isoDay(d));
  }
  return out;
}

function parseDay(s: string): number {
  return new Date(s + "T12:00:00.000Z").getTime();
}

/** Won revenue by `updated_at` day (proxy for close date). */
export function buildRevenueTrend(leads: Lead[], wonStageId: string | undefined, days = 14): { day: string; revenue: number }[] {
  const keys = lastNDays(days);
  const map = new Map(keys.map((k) => [k, 0]));
  if (!wonStageId) return keys.map((day) => ({ day, revenue: 0 }));
  for (const l of leads) {
    if (l.archived || l.pipeline_stage_id !== wonStageId) continue;
    const day = l.updated_at?.slice(0, 10);
    if (!day || !map.has(day)) continue;
    map.set(day, (map.get(day) ?? 0) + (l.estimated_value_cents ?? 0));
  }
  return keys.map((day) => ({ day, revenue: Math.round((map.get(day) ?? 0) / 100) }));
}

export function buildFunnelCounts(stages: PipelineStage[], leads: Lead[]): { stage: string; count: number; fill: string }[] {
  const sorted = [...stages].sort((a, b) => a.sort_order - b.sort_order);
  const palette = ["#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#34d399", "#94a3b8"];
  return sorted.map((s, i) => ({
    stage: s.label,
    count: leads.filter((l) => !l.archived && l.pipeline_stage_id === s.id).length,
    fill: palette[i % palette.length] ?? "#94a3b8",
  }));
}

/** Daily win rate among leads whose terminal stage changed that day (best-effort from `updated_at`). */
export function buildConversionSeries(
  leads: Lead[],
  wonStageId: string | undefined,
  lostStageId: string | undefined,
  days = 14,
): { day: string; rate: number }[] {
  const keys = lastNDays(days);
  const out: { day: string; rate: number }[] = [];
  for (const day of keys) {
    let w = 0;
    let l = 0;
    for (const lead of leads) {
      if (lead.archived) continue;
      const d = lead.updated_at?.slice(0, 10);
      if (d !== day) continue;
      if (wonStageId && lead.pipeline_stage_id === wonStageId) w += 1;
      else if (lostStageId && lead.pipeline_stage_id === lostStageId) l += 1;
    }
    const denom = w + l;
    out.push({ day, rate: denom === 0 ? 0 : Math.round((1000 * w) / denom) / 10 });
  }
  return out;
}

export type RevenueForecastPoint = {
  day: string;
  label: string;
  actual: number | null;
  forecast: number;
};

/** Last `actualDays` of won revenue + `forecastDays` forward projection (linear on trailing window). */
export function buildRevenueWithForecast(
  leads: Lead[],
  wonStageId: string | undefined,
  actualDays = 14,
  forecastDays = 7,
): RevenueForecastPoint[] {
  const trend = buildRevenueTrend(leads, wonStageId, actualDays);
  if (trend.length === 0) return [];

  const trail = 5;
  const ys = trend.slice(-trail).map((t) => t.revenue);
  const n = ys.length;
  let slope = 0;
  if (n >= 2) {
    const meanX = (n - 1) / 2;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - meanX) * (ys[i] - meanY);
      den += (i - meanX) ** 2;
    }
    slope = den === 0 ? 0 : num / den;
  }
  const last = trend[trend.length - 1];
  const lastVal = last?.revenue ?? 0;
  const lastTime = parseDay(last.day);

  const out: RevenueForecastPoint[] = trend.map((t) => ({
    day: t.day,
    label: t.day.slice(5),
    actual: t.revenue,
    forecast: t.revenue,
  }));

  const dayMs = 86400000;
  for (let i = 1; i <= forecastDays; i++) {
    const t = new Date(lastTime + i * dayMs);
    const day = isoDay(t);
    const projected = Math.max(0, Math.round(lastVal + slope * (trail - 1 + i)));
    out.push({
      day,
      label: day.slice(5),
      actual: null,
      forecast: projected,
    });
  }

  return out;
}

export type LeadSourceSlice = { name: string; value: number; fill: string };

const SOURCE_PALETTE = ["#38bdf8", "#818cf8", "#c084fc", "#34d399", "#f472b6", "#94a3b8"];

/** Non-archived leads grouped by `source` for donut / bars. */
export function buildLeadSourceBreakdown(leads: Lead[], top = 6): LeadSourceSlice[] {
  const map = new Map<string, number>();
  for (const l of leads) {
    if (l.archived) continue;
    const key = (l.source && l.source.trim()) || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, top);
  const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
  return sorted.map(([name, value], i) => ({
    name,
    value: Math.round((1000 * value) / total) / 10,
    fill: SOURCE_PALETTE[i % SOURCE_PALETTE.length] ?? "#94a3b8",
  }));
}

export type FunnelStageViz = {
  stage: string;
  count: number;
  fill: string;
  pctFromPrev: number | null;
};

/** Ordered funnel with conversion % vs previous stage (first stage: null). */
export function buildFunnelWithConversion(stages: PipelineStage[], leads: Lead[]): FunnelStageViz[] {
  const base = buildFunnelCounts(stages, leads);
  return base.map((row, i) => {
    const prev = i > 0 ? base[i - 1].count : 0;
    const pctFromPrev =
      i === 0 || prev === 0 ? null : Math.min(100, Math.round((1000 * row.count) / prev) / 10);
    return { ...row, pctFromPrev };
  });
}

export type KpiDelta = {
  label: string;
  value: string;
  deltaText: string;
  deltaPositive: boolean;
  sparkline?: number[];
};

function sumWonRevenueInRange(leads: Lead[], wonId: string | undefined, startIso: string, endIso: string): number {
  if (!wonId) return 0;
  const start = startIso.slice(0, 10);
  const end = endIso.slice(0, 10);
  let cents = 0;
  for (const l of leads) {
    if (l.archived || l.pipeline_stage_id !== wonId) continue;
    const d = l.updated_at?.slice(0, 10);
    if (!d || d < start || d > end) continue;
    cents += l.estimated_value_cents ?? 0;
  }
  return cents;
}

function countInUpdatedRange(leads: Lead[], predicate: (l: Lead) => boolean, startIso: string, endIso: string): number {
  const start = startIso.slice(0, 10);
  const end = endIso.slice(0, 10);
  return leads.filter((l) => {
    const d = l.updated_at?.slice(0, 10);
    if (!d || d < start || d > end) return false;
    return predicate(l);
  }).length;
}

function isoRangeDaysAgo(endOffset: number, span: number): { start: string; end: string } {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - endOffset);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (span - 1));
  return { start: isoDay(start), end: isoDay(end) };
}

export function buildPremiumKpis(
  leads: Lead[],
  stages: PipelineStage[],
  paymentLinks: PaymentLink[],
  opts: { conversionRate: number },
): KpiDelta[] {
  const wonId = stages.find((s) => s.stage_key === "won")?.id;
  const lostId = stages.find((s) => s.stage_key === "lost")?.id;

  const last7 = isoRangeDaysAgo(0, 7);
  const prev7 = isoRangeDaysAgo(7, 7);

  const revNow = sumWonRevenueInRange(leads, wonId, last7.start, last7.end);
  const revPrev = sumWonRevenueInRange(leads, wonId, prev7.start, prev7.end);
  const revDelta = revPrev === 0 ? (revNow > 0 ? 100 : 0) : Math.round(((revNow - revPrev) / revPrev) * 1000) / 10;

  const hotNow = leads.filter((l) => !l.archived && l.temperature === "hot").length;
  const hotPrev = countInUpdatedRange(leads, (l) => l.temperature === "hot", prev7.start, prev7.end);
  const hotDelta = hotNow - hotPrev;

  const convSpark = buildConversionSeries(leads, wonId, lostId, 14).map((x) => x.rate);

  const pendingLinks = paymentLinks.filter((p) => p.status === "pending" || p.status === "partially_paid");
  const pendingMinor = pendingLinks.reduce((s, p) => s + (p.amount_minor ?? 0), 0);
  const pendingNowCount = pendingLinks.length;
  const pendingPrevCount = paymentLinks.filter((p) => {
    if (p.status !== "pending" && p.status !== "partially_paid") return false;
    const c = p.created_at?.slice(0, 10);
    return c && c >= prev7.start && c <= prev7.end;
  }).length;
  const payCountDelta = pendingNowCount - pendingPrevCount;

  const fmtMoney = (cents: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.round(cents / 100));

  return [
    {
      label: "Revenue (7d)",
      value: fmtMoney(revNow),
      deltaText: `${revDelta >= 0 ? "+" : ""}${revDelta}% vs prior week`,
      deltaPositive: revDelta >= 0,
      sparkline: buildRevenueTrend(leads, wonId, 7).map((r) => r.revenue),
    },
    {
      label: "Hot leads",
      value: String(hotNow),
      deltaText: `${hotDelta >= 0 ? "+" : ""}${hotDelta} vs prior week activity`,
      deltaPositive: hotDelta >= 0,
    },
    {
      label: "Conversion",
      value: `${opts.conversionRate}%`,
      deltaText: "Portfolio win ÷ (won+lost)",
      deltaPositive: opts.conversionRate >= 20,
      sparkline: convSpark,
    },
    {
      label: "Pending payments",
      value: fmtMoney(pendingMinor),
      deltaText: `${payCountDelta >= 0 ? "+" : ""}${payCountDelta} links vs prior week cohort`,
      deltaPositive: payCountDelta <= 0,
      sparkline: undefined,
    },
  ];
}

export type TimelineItem = { id: string; time: string; title: string; subtitle: string };

export function buildTimelineItems(
  leads: Lead[],
  paymentLinks: PaymentLink[],
  stages: PipelineStage[],
  limit = 5,
): TimelineItem[] {
  const proposalId = stages.find((s) => s.stage_key === "proposal")?.id;
  const items: TimelineItem[] = [];

  for (const p of paymentLinks) {
    if (p.status !== "pending" && p.status !== "partially_paid") continue;
    const exp = p.expires_at ? new Date(p.expires_at) : null;
    if (exp && exp.getTime() > Date.now()) {
      items.push({
        id: `pay-${p.id}`,
        time: exp.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
        title: "Payment link expiring",
        subtitle: `${Math.round((p.amount_minor ?? 0) / 100)} ${p.currency.toUpperCase()} · follow up`,
      });
    }
  }

  for (const l of leads) {
    if (l.archived) continue;
    if (l.temperature === "hot" && l.has_unreplied) {
      items.push({
        id: `hot-${l.id}`,
        time: "Today",
        title: `Follow-up · ${l.full_name}`,
        subtitle: "Hot · unreplied",
      });
    } else if (proposalId && l.pipeline_stage_id === proposalId) {
      items.push({
        id: `prop-${l.id}`,
        time: "This week",
        title: `Proposal · ${l.full_name}`,
        subtitle: "Review & send terms",
      });
    }
  }

  const seen = new Set<string>();
  const unique = items.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });

  if (unique.length < limit) {
    unique.push({
      id: "pipeline-review",
      time: "2:00 PM",
      title: "Pipeline review",
      subtitle: "Keep stages moving",
    });
  }

  return unique.slice(0, limit);
}
