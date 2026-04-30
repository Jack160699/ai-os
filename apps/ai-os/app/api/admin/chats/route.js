import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function toTs(value) {
  const t = Date.parse(String(value || ""));
  return Number.isFinite(t) ? t : 0;
}

function digitsOnly(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/**
 * Lists chats from `messages` only — grouped by stored `phone` (newest-first wins per key).
 */
export async function GET(request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      {
        error: "supabase_not_configured",
        message: String(e?.message || e),
        source_used: "messages_table",
        conversations: [],
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") || "").trim().toLowerCase();
  const temperature = String(searchParams.get("temperature") || "all").toLowerCase();
  const unreadOnly = String(searchParams.get("unread_only") || "") === "1";

  const { data, error } = await supabase
    .from("messages")
    .select("phone, body, created_at, direction")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = Array.isArray(data) ? data : [];
  /** One row per logical number: rows are newest-first, so first hit per key is latest message. */
  const conversationsMap = {};

  for (const msg of rows) {
    const raw = String(msg?.phone ?? "").trim();
    const d = digitsOnly(raw);
    const phoneKey = d.length >= 10 ? d.slice(-10) : d || raw;
    if (!phoneKey) continue;
    if (!conversationsMap[phoneKey]) {
      conversationsMap[phoneKey] = {
        phone: phoneKey,
        last_message: String(msg?.body ?? ""),
        updated_at: msg.created_at,
      };
    }
  }

  let conversations = Object.values(conversationsMap).map((c) => ({
    phone: c.phone,
    name: c.phone,
    temperature: "warm",
    unread: 0,
    last_message: c.last_message,
    last_time: c.updated_at || new Date().toISOString(),
  }));

  if (q) {
    conversations = conversations.filter(
      (c) => String(c.phone).includes(q) || String(c.last_message || "").toLowerCase().includes(q),
    );
  }
  if (temperature && temperature !== "all") {
    conversations = conversations.filter((c) => String(c.temperature || "").toLowerCase() === temperature);
  }
  if (unreadOnly) {
    conversations = conversations.filter((c) => Number(c.unread || 0) > 0);
  }

  conversations.sort((a, b) => toTs(b.last_time) - toTs(a.last_time));

  return NextResponse.json({
    source_used: "messages_table",
    conversations,
    updated_at: new Date().toISOString(),
  });
}
