import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { adminApiHeaders } from "@/app/admin/_lib/backendFetch";
import { backendBase } from "@/app/admin/_lib/backendFetch";

export const dynamic = "force-dynamic";

function toTs(value) {
  const t = Date.parse(String(value || ""));
  return Number.isFinite(t) ? t : 0;
}

function normalizeConversations(data) {
  if (Array.isArray(data?.conversations)) {
    const rows = data.conversations.map((row) => ({
      phone: String(row?.phone || row?.id || "").replace(/\D/g, ""),
      name: row?.name || row?.title || String(row?.phone || row?.id || "").replace(/\D/g, "") || "Lead",
      temperature: String(row?.temperature || row?.temp || "warm").toLowerCase(),
      unread: Number(row?.unread ?? row?.unread_count ?? 0) || 0,
      last_message: row?.last_message || row?.lastMessage || row?.snippet || row?.text || "",
      last_time:
        row?.last_time || row?.timestamp || row?.updated_at || row?.created_at || new Date().toISOString(),
    })).filter((row) => row.phone);
    rows.sort((a, b) => toTs(b.last_time) - toTs(a.last_time));
    return {
      conversations: rows,
      updated_at: data?.updated_at || new Date().toISOString(),
    };
  }

  const sourceRows = Array.isArray(data)
    ? data
    : Array.isArray(data?.messages)
      ? data.messages
      : [];
  const byPhone = new Map();
  for (const row of sourceRows) {
    const phone = String(row?.phone || "").replace(/\D/g, "");
    if (!phone) continue;
    if (!byPhone.has(phone)) byPhone.set(phone, []);
    byPhone.get(phone).push(row);
  }

  const conversations = Array.from(byPhone.entries()).map(([phone, rows]) => {
    rows.sort(
      (a, b) =>
        toTs(b?.created_at || b?.last_time || b?.timestamp_utc) -
        toTs(a?.created_at || a?.last_time || a?.timestamp_utc),
    );
    const latest = rows[0] || {};
    const unread = rows.filter((r) => String(r?.sender || "").toLowerCase() === "user").length;
    return {
      phone,
      name: latest?.name || phone,
      temperature: String(latest?.temperature || "warm").toLowerCase(),
      unread,
      last_message: latest?.text || latest?.last_message || "",
      last_time: latest?.created_at || latest?.last_time || latest?.timestamp_utc || new Date().toISOString(),
    };
  });
  conversations.sort((a, b) => toTs(b.last_time) - toTs(a.last_time));
  return {
    conversations,
    updated_at: data?.updated_at || new Date().toISOString(),
  };
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
  const res = await fetch(`${backendBase()}/api/chats`, { cache: "no-store", headers: adminApiHeaders() });
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
