import type { Lead, PipelineStage } from "@/lib/models";

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
