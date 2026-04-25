import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { adminApiHeaders } from "@/app/admin/_lib/backendFetch";
import { backendBase } from "@/app/admin/_lib/backendFetch";

export const dynamic = "force-dynamic";

function toTs(value) {
  const t = Date.parse(String(value || ""));
  return Number.isFinite(t) ? t : 0;
}

function normalizeApiChats(data) {
  const rows = Array.isArray(data?.conversations) ? data.conversations : [];
  const conversations = rows
    .map((row) => ({
      phone: String(row?.phone || "").replace(/\D/g, ""),
      name: row?.name || String(row?.phone || "").replace(/\D/g, "") || "Lead",
      temperature: String(row?.temperature || "warm").toLowerCase(),
      unread: Number(row?.unread ?? 0) || 0,
      last_message: row?.last_message || "",
      last_time: row?.last_time || row?.created_at || new Date().toISOString(),
    }))
    .filter((row) => row.phone);
  conversations.sort((a, b) => toTs(b.last_time) - toTs(a.last_time));
  return conversations;
}

function normalizeDashboardRows(data) {
  const pipeline = Array.isArray(data?.recent_pipeline) ? data.recent_pipeline : [];
  const leads = Array.isArray(data?.recent_leads) ? data.recent_leads : [];
  const allRows = [...pipeline, ...leads];
  const byPhone = new Map();

  for (const row of allRows) {
    const phone = String(row?.phone || "").replace(/\D/g, "");
    if (!phone) continue;
    if (!byPhone.has(phone)) {
      byPhone.set(phone, {
        phone,
        name: phone,
        temperature: String(row?.growth_label || "warm").toLowerCase(),
        unread: 0,
        last_message: row?.summary || row?.pain_point || "",
        last_time: row?.last_reply_time || row?.timestamp_utc || new Date().toISOString(),
      });
      continue;
    }
    const existing = byPhone.get(phone);
    const candidateTs = toTs(row?.last_reply_time || row?.timestamp_utc);
    const existingTs = toTs(existing?.last_time);
    if (candidateTs > existingTs) {
      byPhone.set(phone, {
        ...existing,
        last_message: row?.summary || row?.pain_point || existing.last_message,
        last_time: row?.last_reply_time || row?.timestamp_utc || existing.last_time,
      });
    }
  }

  const conversations = Array.from(byPhone.values());
  conversations.sort((a, b) => toTs(b.last_time) - toTs(a.last_time));
  return conversations;
}

/**
 * Uses backend `/api/chats` as source of truth.
 */
export async function GET(request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") || "").trim().toLowerCase();
  const temperature = String(searchParams.get("temperature") || "all").toLowerCase();
  const unreadOnly = String(searchParams.get("unread_only") || "") === "1";
  const base = backendBase();
  const headers = adminApiHeaders();
  const apiChatsUrl = `${base}/api/chats`;
  const dashboardUrl = `${base}/dashboard.json`;

  console.info("[admin/chats] backend_base=", base, "api_chats_url=", apiChatsUrl, "dashboard_url=", dashboardUrl);

  const [apiRes, dashboardRes] = await Promise.all([
    fetch(apiChatsUrl, { cache: "no-store", headers }),
    fetch(dashboardUrl, { cache: "no-store", headers }),
  ]);

  const apiData = await apiRes.json().catch(() => ({}));
  const dashboardData = await dashboardRes.json().catch(() => ({}));
  const apiConversations = normalizeApiChats(apiData);
  const dashboardConversations = normalizeDashboardRows(dashboardData);

  const sourceUsed = apiConversations.length > 0 ? "api_chats" : dashboardConversations.length > 0 ? "dashboard_fallback" : "none";
  let conversations = sourceUsed === "api_chats" ? apiConversations : dashboardConversations;

  if (q) {
    conversations = conversations.filter((c) =>
      String(c.phone).includes(q) || String(c.last_message || "").toLowerCase().includes(q)
    );
  }
  if (temperature && temperature !== "all") {
    conversations = conversations.filter((c) => String(c.temperature || "").toLowerCase() === temperature);
  }
  if (unreadOnly) {
    conversations = conversations.filter((c) => Number(c.unread || 0) > 0);
  }

  console.info(
    "[admin/chats] source_used=",
    sourceUsed,
    "api_status=",
    apiRes.status,
    "dashboard_status=",
    dashboardRes.status,
    "api_count=",
    apiConversations.length,
    "dashboard_count=",
    dashboardConversations.length,
    "returned=",
    conversations.length,
  );

  return NextResponse.json(
    {
      source_used: sourceUsed,
      api_count: apiConversations.length,
      dashboard_count: dashboardConversations.length,
      conversations,
      updated_at: new Date().toISOString(),
    },
    { status: 200 },
  );
}
