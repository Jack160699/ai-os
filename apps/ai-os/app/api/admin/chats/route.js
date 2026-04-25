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
    return {
      conversations: data.conversations,
      updated_at: data?.updated_at || new Date().toISOString(),
    };
  }

  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.messages)
      ? data.messages
      : [];
  if (!rows.length) {
    return {
      conversations: [],
      updated_at: data?.updated_at || new Date().toISOString(),
    };
  }

  const byPhone = new Map();
  for (const row of rows) {
    const phone = String(row?.phone || "").replace(/\D/g, "");
    if (!phone) continue;
    if (!byPhone.has(phone)) byPhone.set(phone, []);
    byPhone.get(phone).push(row);
  }

  const conversations = Array.from(byPhone.entries()).map(([phone, phoneRows]) => {
    phoneRows.sort((a, b) =>
      toTs(b?.created_at || b?.last_time || b?.timestamp_utc) -
      toTs(a?.created_at || a?.last_time || a?.timestamp_utc)
    );
    const latest = phoneRows[0] || {};
    const unread = phoneRows.filter((r) => String(r?.sender || "").toLowerCase() === "user").length > 0 ? 1 : 0;
    return {
      phone,
      name: latest?.name || "Lead",
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
 * Proxies Flask `GET /api/chats` (conversations from server-side memory.json).
 */
export async function GET(request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const temperature = searchParams.get("temperature") || "all";
  const unreadOnly = searchParams.get("unread_only") || "";

  const url = new URL(`${backendBase()}/api/chats`);
  if (q) url.searchParams.set("q", q);
  if (temperature) url.searchParams.set("temperature", temperature);
  if (unreadOnly) url.searchParams.set("unread_only", unreadOnly);

  const res = await fetch(url.toString(), { cache: "no-store", headers: adminApiHeaders() });
  const data = await res.json().catch(() => ({}));
  const normalized = normalizeConversations(data);
  if (process.env.INBOX_DEBUG === "1") {
    const n = normalized.conversations.length;
    console.info("[inbox-api] proxy /api/chats status=", res.status, "threads=", n);
  }
  return NextResponse.json(normalized, { status: res.status });
}
