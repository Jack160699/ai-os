import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  aggregateConversationsFromMessages,
  fetchRecentMessageRows,
} from "@/lib/admin/messagesDb";

export const dynamic = "force-dynamic";

function toTs(value) {
  const t = Date.parse(String(value || ""));
  return Number.isFinite(t) ? t : 0;
}

/**
 * Lists conversations from Supabase `messages` only (no backend or dashboard fallback).
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
        updated_at: new Date().toISOString(),
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") || "").trim().toLowerCase();
  const temperature = String(searchParams.get("temperature") || "all").toLowerCase();
  const unreadOnly = String(searchParams.get("unread_only") || "") === "1";

  try {
    const rows = await fetchRecentMessageRows(supabase);
    let conversations = aggregateConversationsFromMessages(rows);

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

    return NextResponse.json(
      {
        source_used: "messages_table",
        conversations,
        updated_at: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "messages_query_failed", message: String(err?.message || err) },
      { status: 500 },
    );
  }
}
