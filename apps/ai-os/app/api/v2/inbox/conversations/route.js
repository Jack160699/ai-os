import { NextResponse } from "next/server";
import { V2_ROLES } from "@/lib/v2/rbac";
import { requireApiUser, requireRateLimit, requireRole } from "@/lib/v2/server-guard";

function parseJsonSafe(text) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

function normalizeConversationRow(row = {}) {
  const phone = String(row?.phone || "").replace(/\D/g, "");
  const lastMessageRaw = String(row?.last_message || "");
  const lastMessage = /^\[(need|objection|stage|summary):[^\]]+\]$/i.test(lastMessageRaw.trim()) ? "" : lastMessageRaw;
  return {
    phone,
    name: row?.name || phone || "Lead",
    unread: Number(row?.unread ?? 0) || 0,
    last_message: lastMessage,
    last_time: row?.last_time || row?.created_at || null,
  };
}

export async function GET(request) {
  try {
    const limited = requireRateLimit(request, { namespace: "v2-inbox-conversations", max: 90, windowMs: 60000 });
    if (limited) return limited;

    const auth = await requireApiUser(request);
    if (auth.errorResponse) return auth.errorResponse;
    const denied = requireRole(auth.role, [V2_ROLES.SUPER_ADMIN, V2_ROLES.MANAGER, V2_ROLES.SUPPORT]);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get("q") || "").trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const query = params.toString();

    const adminUrl = query ? `/api/admin/chats?${query}` : "/api/admin/chats";
    const response = await fetch(new URL(adminUrl, request.nextUrl.origin), {
      headers: { cookie: request.headers.get("cookie") || "" },
      cache: "no-store",
    });

    const raw = await response.text();
    const payload = parseJsonSafe(raw);
    if (!response.ok) {
      return NextResponse.json({ error: payload?.error || "Could not fetch conversations" }, { status: response.status });
    }

    const rows = (Array.isArray(payload?.conversations) ? payload.conversations : [])
      .map(normalizeConversationRow)
      .filter((row) => row.phone);
    const phones = rows.map((row) => row.phone);

    let assignments = [];
    let tags = [];
    if (auth.supabase && phones.length > 0) {
      const pair = await Promise.all([
        auth.supabase.from("inbox_assignments").select("phone, assigned_user_id, assigned_name").in("phone", phones),
        auth.supabase.from("inbox_tags").select("phone, tag").in("phone", phones),
      ]);
      assignments = pair[0].data || [];
      tags = pair[1].data || [];
    }

    const assignmentMap = new Map((assignments || []).map((row) => [row.phone, row]));
    const tagsMap = new Map();
    for (const row of tags || []) {
      const list = tagsMap.get(row.phone) || [];
      list.push(row.tag);
      tagsMap.set(row.phone, list);
    }

    const conversations = rows.map((row) => {
      const phone = String(row?.phone || "").replace(/\D/g, "");
      const assignment = assignmentMap.get(phone);
      return {
        ...row,
        assigned_to: assignment?.assigned_name || "Unassigned",
        assigned_user_id: assignment?.assigned_user_id || null,
        tags: tagsMap.get(phone) || [],
      };
    });

    return NextResponse.json({ conversations, updated_at: payload?.updated_at || new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "service_unavailable", message: error?.message || "Could not fetch conversations" },
      { status: 503 },
    );
  }
}
