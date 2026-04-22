import { fetchFunnelMetrics, fetchRevenueMetrics } from "./supabase.js";

export async function getDashboardCore() {
  const [funnel, revenue] = await Promise.all([fetchFunnelMetrics(), fetchRevenueMetrics()]);
  const total = Number(funnel.total || 0);
  const statusMap = new Map((funnel.by_status || []).map((r) => [r.status, Number(r.count || 0)]));
  const qualified =
    (statusMap.get("qualified") || 0) +
    (statusMap.get("proposal") || 0) +
    (statusMap.get("closing") || 0) +
    (statusMap.get("closed_won") || 0);
  const won = statusMap.get("closed_won") || 0;
  const conversion = total > 0 ? Number(((won / total) * 100).toFixed(2)) : 0;
  return {
    funnel: {
      total_leads: total,
      qualified_leads: qualified,
      won_leads: won,
      conversion_rate_pct: conversion,
      by_status: funnel.by_status || [],
    },
    revenue,
  };
}
