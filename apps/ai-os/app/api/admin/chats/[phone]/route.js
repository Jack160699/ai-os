import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { adminApiHeaders } from "@/app/admin/_lib/backendFetch";
import { backendBase } from "@/app/admin/_lib/backendFetch";

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

  const base = backendBase();
  const headers = adminApiHeaders();
  console.log("[admin/chats/[phone]] fetch_start", { phone: digits, endpoint: "/api/messages/:phone" });
  const messagesRes = await fetch(`${base}/api/messages/${encodeURIComponent(digits)}`, { cache: "no-store", headers });
  const messagesData = await messagesRes.json().catch(() => ({}));

  const messagesRows = Array.isArray(messagesData?.messages) ? messagesData.messages : [];
  const realMessages = messagesRows.filter((row) => !isMetadataTagText(row?.text || row?.message));
  const shaped = toDetailShape({ phone: digits, messages: realMessages });
  const realCount = Number(messagesData?.real_count || shaped.message_count || 0);
  const hasReal = messagesRes.ok && realCount > 0 && shaped.message_count > 0;

  if (hasReal) {
    const payload = {
      phone: digits,
      source_used: "messages_table",
      real_count: shaped.message_count,
      fallback_count: 0,
      messages: shaped.messages,
    };
    console.log("[admin/chats/[phone]] real_messages_found", {
      phone: digits,
      source_used: payload.source_used,
      real_count: payload.real_count,
      fallback_count: payload.fallback_count,
      backend_status: messagesRes.status,
    });
    return NextResponse.json(payload, { status: 200 });
  }

  const noRealMessage = [
    {
      id: `${digits}-no-real-messages`,
      sender: "admin",
      text: "No real WhatsApp messages found for this number",
      created_at: new Date().toISOString(),
    },
  ];
  const payload = {
    phone: digits,
    source_used: "no_real_messages",
    real_count: 0,
    fallback_count: 1,
    messages: noRealMessage,
  };
  console.log("[admin/chats/[phone]] no_real_messages", {
    phone: digits,
    source_used: payload.source_used,
    real_count: payload.real_count,
    fallback_count: payload.fallback_count,
    backend_status: messagesRes.status,
  });
  return NextResponse.json(payload, { status: 200 });
}
