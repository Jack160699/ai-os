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

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function phoneMatches(a, b) {
  const x = normalizePhone(a);
  const y = normalizePhone(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return x.slice(-10) && y.slice(-10) && x.slice(-10) === y.slice(-10);
}

function toDetailShape({ phone, state, messages }) {
  const normalizedMessages = (Array.isArray(messages) ? messages : [])
    .map((row, idx) => normalizeMessage(row, idx, phone))
    .filter((m) => !isMetadataTagText(m.text))
    .sort((a, b) => Date.parse(String(a.created_at || "")) - Date.parse(String(b.created_at || "")));
  const transcript = normalizedMessages.map((m) => ({
    role: m.sender === "user" ? "user" : "assistant",
    text: m.text,
    timestamp_utc: m.created_at,
  }));
  return {
    phone,
    message_count: normalizedMessages.length,
    state: state && typeof state === "object" ? state : {},
    messages: normalizedMessages,
    transcript,
    suggestions: [],
  };
}

function buildSystemFallbackMessage(phone, text, ts) {
  const clean = String(text || "").trim();
  const fallbackText = !clean || isMetadataTagText(clean)
    ? "Recent conversation detected, but full WhatsApp history is not available yet."
    : clean;
  return [
    {
      id: `${phone}-${ts}-fallback`,
      sender: "admin",
      text: fallbackText,
      created_at: ts || new Date().toISOString(),
    },
  ];
}

function extractDashboardConversation(dashboardData, digits) {
  const pipeline = Array.isArray(dashboardData?.recent_pipeline) ? dashboardData.recent_pipeline : [];
  const leads = Array.isArray(dashboardData?.recent_leads) ? dashboardData.recent_leads : [];
  const rows = [...pipeline, ...leads];
  return rows.find((row) => phoneMatches(row?.phone, digits)) || null;
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
  const [leadRes, messagesRes, chatsRes, dashboardRes] = await Promise.all([
    fetch(`${base}/inbox/lead/${encodeURIComponent(digits)}`, { cache: "no-store", headers }),
    fetch(`${base}/api/messages/${encodeURIComponent(digits)}`, { cache: "no-store", headers }),
    fetch(`${base}/api/chats`, { cache: "no-store", headers }),
    fetch(`${base}/dashboard.json`, { cache: "no-store", headers }),
  ]);

  const leadData = await leadRes.json().catch(() => ({}));
  const messagesData = await messagesRes.json().catch(() => ({}));
  const chatsData = await chatsRes.json().catch(() => ({}));
  const dashboardData = await dashboardRes.json().catch(() => ({}));

  const leadTranscript = Array.isArray(leadData?.transcript) ? leadData.transcript : [];
  const leadMessages = leadTranscript.map((row, idx) =>
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
  const messagesRows = Array.isArray(messagesData?.messages) ? messagesData.messages : [];
  const cleanMessagesRows = messagesRows.filter((row) => !isMetadataTagText(row?.text || row?.message));
  const cleanLeadMessages = leadMessages.filter((row) => !isMetadataTagText(row?.text));
  const state = leadData?.state || {};

  if (messagesRes.ok && cleanMessagesRows.length > 0) {
    const shaped = toDetailShape({ phone: digits, state, messages: cleanMessagesRows });
    return NextResponse.json({ ...shaped, source_used: "api_messages" }, { status: 200 });
  }

  if (leadRes.ok && cleanLeadMessages.length > 0) {
    const shaped = toDetailShape({ phone: digits, state, messages: cleanLeadMessages });
    return NextResponse.json({ ...shaped, source_used: "inbox_lead" }, { status: 200 });
  }

  const chatRows = Array.isArray(chatsData?.conversations) ? chatsData.conversations : [];
  const chatRow = chatRows.find((row) => phoneMatches(row?.phone, digits)) || null;
  if (chatRow) {
    const ts = chatRow?.last_time || new Date().toISOString();
    const text = chatRow?.last_message || "Recent chat detected in conversation list.";
    const shaped = toDetailShape({
      phone: digits,
      state,
      messages: buildSystemFallbackMessage(digits, text, ts),
    });
    return NextResponse.json({ ...shaped, source_used: "api_chats_reconstructed" }, { status: 200 });
  }

  const dashboardRow = extractDashboardConversation(dashboardData, digits);
  if (dashboardRow) {
    const ts = dashboardRow?.last_reply_time || dashboardRow?.timestamp_utc || new Date().toISOString();
    const text = dashboardRow?.summary || dashboardRow?.pain_point || "Recent dashboard conversation detected.";
    const shaped = toDetailShape({
      phone: digits,
      state,
      messages: buildSystemFallbackMessage(digits, text, ts),
    });
    return NextResponse.json({ ...shaped, source_used: "dashboard_reconstructed" }, { status: 200 });
  }

  const empty = toDetailShape({ phone: digits, state, messages: [] });
  return NextResponse.json({ ...empty, source_used: "none" }, { status: 200 });
}
