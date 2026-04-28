import { createClient } from "@/lib/supabase/server";
import { getV2DashboardData } from "@/lib/v2/dashboard-data";

function lastNDates(days) {
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    out.push(date.toISOString().slice(0, 10));
  }
  return out;
}

function groupCountByDate(rows, dateKey = "created_at") {
  const map = new Map();
  for (const row of rows || []) {
    const key = String(row?.[dateKey] || "").slice(0, 10);
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

export async function getV2AnalyticsData() {
  const supabase = await createClient();
  const [messagesRes, paymentsRes, teamRes, dashboard] = await Promise.all([
    supabase.from("messages").select("created_at, direction").eq("direction", "in").order("created_at", { ascending: false }).limit(500),
    supabase.from("audit_logs").select("created_at, action").eq("entity_type", "payment").order("created_at", { ascending: false }).limit(500),
    supabase.from("audit_logs").select("created_at, action").or("action.eq.chat.reply_sent,action.eq.chat.assigned").order("created_at", { ascending: false }).limit(500),
    getV2DashboardData(),
  ]);

  const dates = lastNDates(7);
  const messagesMap = groupCountByDate(messagesRes.data);
  const paymentsMap = groupCountByDate(paymentsRes.data);
  const teamMap = groupCountByDate(teamRes.data);

  const timeline = dates.map((date) => ({
    date: date.slice(5),
    chats: messagesMap.get(date) || 0,
    payments: paymentsMap.get(date) || 0,
    team_output: teamMap.get(date) || 0,
  }));

  return {
    timeline,
    kpis: dashboard.metrics,
  };
}
