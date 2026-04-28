import { NextResponse } from "next/server";
import { adminApiHeaders, backendBase } from "@/app/admin/_lib/backendFetch";
import { V2_ROLES } from "@/lib/v2/rbac";
import { requireApiUser, requireRateLimit, requireRole } from "@/lib/v2/server-guard";

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

function isMetadataTagText(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;
  return /^\[(need|objection|stage|summary):[^\]]+\]$/.test(text);
}

function normalizeMessage(row = {}, idx = 0, phone = "") {
  const senderRaw = String(row?.sender || row?.role || "").toLowerCase();
  const sender = senderRaw === "user" ? "user" : "admin";
  const text = String(row?.text || row?.message || "");
  const createdAt = row?.created_at || row?.timestamp_utc || row?.timestamp || new Date().toISOString();
  return {
    id: row?.id || `${phone}-${createdAt}-${idx}`,
    phone,
    sender,
    text,
    created_at: createdAt,
  };
}

export async function GET(request, { params }) {
  const limited = requireRateLimit(request, { namespace: "v2-inbox-detail", max: 120, windowMs: 60000 });
  if (limited) return limited;

  const auth = await requireApiUser(request);
  if (auth.errorResponse) return auth.errorResponse;
  const denied = requireRole(auth.role, [V2_ROLES.SUPER_ADMIN, V2_ROLES.MANAGER, V2_ROLES.SUPPORT]);
  if (denied) return denied;

  const { phone } = await params;
  const digits = digitsOnly(phone);
  if (!digits) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const proxyUrl = `${backendBase()}/api/messages/${encodeURIComponent(digits)}`;
  const response = await fetch(proxyUrl, {
    headers: adminApiHeaders(),
    cache: "no-store",
  });

  const raw = await response.text();
  const payload = parseJsonSafe(raw);
  if (!response.ok) {
    return NextResponse.json({ error: payload?.error || "Could not fetch chat detail" }, { status: response.status });
  }

  const [{ data: assignment }, { data: tags }, { data: notes }] = await Promise.all([
    auth.supabase.from("inbox_assignments").select("assigned_name, assigned_user_id").eq("phone", digits).maybeSingle(),
    auth.supabase.from("inbox_tags").select("id, tag").eq("phone", digits).order("created_at", { ascending: false }),
    auth.supabase
      .from("inbox_notes")
      .select("id, note, created_at")
      .eq("phone", digits)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const sourceRows = Array.isArray(payload?.messages)
    ? payload.messages
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  const messages = sourceRows
    .map((row, idx) => normalizeMessage(row, idx, digits))
    .filter((row) => row.text && !isMetadataTagText(row.text))
    .sort((a, b) => Date.parse(String(a.created_at || "")) - Date.parse(String(b.created_at || "")));

  return NextResponse.json({
    phone: digits,
    messages,
    assignment: assignment || null,
    tags: (tags || []).map((row) => row.tag),
    notes: notes || [],
  });
}
