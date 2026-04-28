import { NextResponse } from "next/server";
import { adminApiHeaders, backendBase } from "@/app/admin/_lib/backendFetch";
import { createNotification } from "@/lib/v2/notify";
import { V2_ROLES } from "@/lib/v2/rbac";
import { writeAuditLog } from "@/lib/v2/audit";
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

export async function POST(request, { params }) {
  const limited = requireRateLimit(request, { namespace: "v2-inbox-reply", max: 50, windowMs: 60000 });
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

  const body = await request.text();
  const proxyUrl = `${backendBase()}/inbox/reply`;
  const parsedBody = parseJsonSafe(body);
  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      ...adminApiHeaders(),
    },
    body: JSON.stringify({ phone: digits, text: parsedBody?.text || parsedBody?.message || "" }),
  });
  const payload = parseJsonSafe(await response.text());

  if (response.ok && payload?.ok !== false) {
    await writeAuditLog(auth.supabase, auth.user, {
      action: "chat.reply_sent",
      entity_type: "conversation",
      entity_id: digits,
      payload: { phone: digits },
    });
    await createNotification(auth.supabase, {
      user_id: auth.user.id,
      type: "task_assigned",
      title: "Reply sent",
      body: `Reply sent to ${digits}`,
      meta: { phone: digits },
    });
  }

  return NextResponse.json(payload, { status: response.status });
}
