import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { adminApiHeaders } from "@/app/admin/_lib/backendFetch";
import { backendBase } from "@/app/admin/_lib/backendFetch";

export const dynamic = "force-dynamic";

function toTs(value) {
  const t = Date.parse(String(value || ""));
  return Number.isFinite(t) ? t : 0;
}

function mergeRecentRows(data) {
  const pipeline = Array.isArray(data?.recent_pipeline) ? data.recent_pipeline : [];
  const completed = Array.isArray(data?.recent_leads) ? data.recent_leads : [];
  const rows = [];
  for (const r of pipeline) {
    rows.push({
      phone: r.phone ?? "",
      summary: r.summary ?? r.pain_point ?? "",
      sort_ts: r.last_reply_time || "",
      temperature: r.growth_label || "warm",
      unread: 0,
    });
  }
  for (const e of completed) {
    rows.push({
      phone: e.phone ?? "",
      summary: e.summary ?? e.pain_point ?? "",
      sort_ts: e.timestamp_utc || "",
      temperature: "warm",
      unread: 0,
    });
  }
  rows.sort((a, b) => toTs(b.sort_ts) - toTs(a.sort_ts));
  return rows;
}

function normalizeConversations(data) {
  const rows = mergeRecentRows(data);
  const byPhone = new Map();
  for (const row of rows) {
    const phone = String(row.phone || "").replace(/\D/g, "");
    if (!phone || byPhone.has(phone)) continue;
    byPhone.set(phone, {
      phone,
      name: phone,
      temperature: String(row.temperature || "warm").toLowerCase(),
      unread: Number(row.unread || 0),
      last_message: row.summary || "",
      last_time: row.sort_ts || data?.updated_at || new Date().toISOString(),
    });
  }
  return {
    conversations: Array.from(byPhone.values()),
    updated_at: data?.updated_at || new Date().toISOString(),
  };
}

/**
 * Reuses dashboard preview source (`/dashboard.json`) for chats list.
 */
export async function GET(request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") || "").trim().toLowerCase();
  const temperature = String(searchParams.get("temperature") || "all").toLowerCase();
  const unreadOnly = String(searchParams.get("unread_only") || "") === "1";
  const res = await fetch(`${backendBase()}/dashboard.json`, { cache: "no-store", headers: adminApiHeaders() });
  const data = await res.json().catch(() => ({}));
  const normalized = normalizeConversations(data);
  let conversations = normalized.conversations;
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
  if (process.env.INBOX_DEBUG === "1") {
    const n = conversations.length;
    console.info("[inbox-api] proxy /api/chats status=", res.status, "threads=", n);
  }
  return NextResponse.json({ conversations, updated_at: normalized.updated_at }, { status: res.status });
}
