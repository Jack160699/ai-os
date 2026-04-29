import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMessagesForPhoneThread } from "@/lib/admin/messagesDb";

function isMetadataTagText(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;
  return /^\[(need|objection|stage):[^\]]+\]$/.test(text);
}

function normalizeMessage(row = {}, idx = 0, phone = "") {
  const senderRaw = String(row.sender || row.role || "").toLowerCase();
  const sender = senderRaw === "user" ? "user" : "admin";
  const text = String(row.text || row.message || "");
  const createdAt = row.created_at || row.timestamp_utc || row.timestamp || new Date().toISOString();
  return {
    id: row.id || `${phone}-${createdAt}-${idx}`,
    sender,
    text,
    created_at: createdAt,
  };
}

function toDetailShape({ phone, messages }) {
  const normalizedMessages = (Array.isArray(messages) ? messages : [])
    .map((row, idx) => normalizeMessage(row, idx, phone))
    .filter((m) => !isMetadataTagText(m.text))
    .sort((a, b) => Date.parse(String(a.created_at || "")) - Date.parse(String(b.created_at || "")));
  return {
    phone,
    message_count: normalizedMessages.length,
    messages: normalizedMessages,
  };
}

export async function GET(request, { params }) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const { phone } = await params;
  const digits = decodeURIComponent(phone || "").replace(/\D/g, "");
  if (!digits) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      {
        error: "supabase_not_configured",
        message: String(e?.message || e),
        phone: digits,
        source_used: "messages_table",
        real_count: 0,
        messages: [],
      },
      { status: 503 },
    );
  }

  try {
    const dbRows = await fetchMessagesForPhoneThread(supabase, digits);
    const shaped = toDetailShape({ phone: digits, messages: dbRows });
    return NextResponse.json(
      {
        phone: digits,
        source_used: "messages_table",
        real_count: shaped.message_count,
        messages: shaped.messages,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "messages_query_failed", message: String(err?.message || err), phone: digits },
      { status: 500 },
    );
  }
}
