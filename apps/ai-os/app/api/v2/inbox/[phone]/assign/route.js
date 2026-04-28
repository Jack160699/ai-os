import { NextResponse } from "next/server";
import { createNotification } from "@/lib/v2/notify";
import { V2_ROLES } from "@/lib/v2/rbac";
import { writeAuditLog } from "@/lib/v2/audit";
import { requireApiUser, requireRateLimit, requireRole } from "@/lib/v2/server-guard";

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export async function POST(request, { params }) {
  const limited = requireRateLimit(request, { namespace: "v2-inbox-assign", max: 80, windowMs: 60000 });
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const assignedUserId = body?.assigned_user_id ? String(body.assigned_user_id) : null;
  const assignedName = body?.assigned_name ? String(body.assigned_name) : "Unassigned";

  const { error } = await auth.supabase.from("inbox_assignments").upsert({
    phone: digits,
    assigned_user_id: assignedUserId,
    assigned_name: assignedName,
  });

  if (error) {
    return NextResponse.json({ error: error.message || "Could not assign chat" }, { status: 500 });
  }

  await writeAuditLog(auth.supabase, auth.user, {
    action: "chat.assigned",
    entity_type: "conversation",
    entity_id: digits,
    payload: { assigned_user_id: assignedUserId, assigned_name: assignedName },
  });
  if (assignedUserId) {
    await createNotification(auth.supabase, {
      user_id: assignedUserId,
      type: "task_assigned",
      title: "New chat assigned",
      body: `Conversation ${digits} assigned to you`,
      meta: { phone: digits },
    });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
