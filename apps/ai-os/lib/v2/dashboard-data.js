import { createClient } from "@/lib/supabase/server";

function startOfTodayIso() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return start.toISOString();
}

function backendBase() {
  const raw =
    process.env.BACKEND_API_URL ||
    process.env.API_URL ||
    process.env.BOT_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:5000";
  return String(raw).replace(/\/+$/, "");
}

function backendHeaders() {
  const pwd = process.env.BACKEND_DASHBOARD_PASSWORD || process.env.DASHBOARD_PASSWORD || "";
  const headers = { "Content-Type": "application/json" };
  if (pwd) headers["X-Dashboard-Password"] = pwd;
  return headers;
}

export async function getV2DashboardData() {
  const supabase = await createClient();
  const since = startOfTodayIso();

  const [messagesToday, teamActive, notesPending, paymentLogs] = await Promise.all([
    supabase.from("messages").select("id", { count: "exact", head: true }).gte("created_at", since).eq("direction", "in"),
    supabase.from("team_members").select("user_id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("inbox_notes").select("id", { count: "exact", head: true }).gte("created_at", since),
    fetch(`${backendBase()}/dashboard.json`, { cache: "no-store", headers: backendHeaders() }).then((r) =>
      r.json().catch(() => ({})),
    ),
  ]);

  const events = Array.isArray(paymentLogs?.payment_events_recent) ? paymentLogs.payment_events_recent : [];
  const pendingPayments = events.filter((row) => {
    const status = String(row?.status || "").toLowerCase();
    return status.includes("pending") || status.includes("created");
  }).length;

  const recentActivity = (Array.isArray(paymentLogs?.recent_pipeline) ? paymentLogs.recent_pipeline : [])
    .slice(0, 4)
    .map((row) => row?.summary || row?.pain_point || "Lead activity updated")
    .filter(Boolean);

  return {
    metrics: [
      { label: "Chats Today", value: String(messagesToday.count || 0) },
      { label: "Pending Tasks", value: String(notesPending.count || 0) },
      { label: "Payments Due", value: String(pendingPayments) },
      { label: "Active Team Members", value: String(teamActive.count || 0) },
    ],
    activity: recentActivity,
  };
}
