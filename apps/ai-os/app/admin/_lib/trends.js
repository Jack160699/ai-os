/** Server-safe helpers for KPI trend copy (no client deps). */

export function seriesHalfMomentum(series) {
  const pts = Array.isArray(series) ? series.map((p) => Number(p.count) || 0) : [];
  if (pts.length < 4) {
    return { label: "Building history", direction: "neutral" };
  }
  const mid = Math.max(1, Math.floor(pts.length / 2));
  const first = pts.slice(0, mid).reduce((a, b) => a + b, 0);
  const second = pts.slice(mid).reduce((a, b) => a + b, 0);
  const base = Math.max(1, first);
  const pct = Math.round(((second - first) / base) * 100);
  return {
    label: `${pct > 0 ? "+" : ""}${pct}% vs prior window`,
    direction: pct > 2 ? "up" : pct < -2 ? "down" : "neutral",
  };
}

export function activeShareTrend(summary) {
  const total = Number(summary.total_leads) || 0;
  const active = Number(summary.active_leads) || 0;
  if (total <= 0) {
    return { label: "Awaiting first leads", direction: "neutral" };
  }
  const pct = Math.round((active / total) * 100);
  return {
    label: `${pct}% of funnel active`,
    direction: "neutral",
  };
}

export function bookedTrend(summary) {
  const w = Number(summary.bookings_week) || 0;
  return {
    label: w ? `${w} booked · last 7d` : "No bookings · 7d",
    direction: "neutral",
  };
}

export function hotTrend(summary) {
  const scored = Number(summary.hot_score_count) || 0;
  const queue = Number(summary.hot_leads_count) || 0;
  if (scored > 0) {
    return {
      label: `${scored} scored hot`,
      direction: queue > 3 ? "up" : "neutral",
    };
  }
  return { label: "Queue clear", direction: "neutral" };
}
