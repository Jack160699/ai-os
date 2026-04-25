import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { adminApiHeaders } from "@/app/admin/_lib/backendFetch";
import { backendBase } from "@/app/admin/_lib/backendFetch";

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

function toDetailShape({ phone, state, messages }) {
  const normalizedMessages = (Array.isArray(messages) ? messages : [])
    .map((row, idx) => normalizeMessage(row, idx, phone))
    .sort((a, b) => Date.parse(String(a.created_at || "")) - Date.parse(String(b.created_at || "")));
  const transcript = normalizedMessages.map((m) => ({
    role: m.sender === "user" ? "user" : "assistant",
    text: m.text,
    timestamp_utc: m.created_at,
  }));
  return {
    phone,
    state: state && typeof state === "object" ? state : {},
    messages: normalizedMessages,
    transcript,
    suggestions: [],
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
  const leadUrl = `${base}/inbox/lead/${encodeURIComponent(digits)}`;
  const leadRes = await fetch(leadUrl, { cache: "no-store", headers });
  const leadData = await leadRes.json().catch(() => ({}));

  const leadTranscript = Array.isArray(leadData?.transcript) ? leadData.transcript : [];
  if (leadRes.ok && leadTranscript.length > 0) {
    const fromLead = leadTranscript.map((row, idx) =>
      normalizeMessage(
        {
          id: row.id,
          sender: row.sender || row.role,
          text: row.text,
          created_at: row.created_at || row.timestamp_utc,
        },
        idx,
        digits,
      ),
    );
    return NextResponse.json(
      toDetailShape({
        phone: digits,
        state: leadData?.state || {},
        messages: fromLead,
      }),
      { status: 200 },
    );
  }

  const messagesUrl = `${base}/api/messages/${encodeURIComponent(digits)}`;
  const messagesRes = await fetch(messagesUrl, { cache: "no-store", headers });
  const messagesData = await messagesRes.json().catch(() => ({}));
  const fallbackMessages = Array.isArray(messagesData?.messages) ? messagesData.messages : [];
  if (messagesRes.ok && fallbackMessages.length > 0) {
    return NextResponse.json(
      toDetailShape({
        phone: digits,
        state: leadData?.state || {},
        messages: fallbackMessages,
      }),
      { status: 200 },
    );
  }

  return NextResponse.json(
    toDetailShape({
      phone: digits,
      state: leadData?.state || {},
      messages: [],
    }),
    { status: 200 },
  );
}
