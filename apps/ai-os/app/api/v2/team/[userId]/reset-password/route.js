import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/v2/audit";
import { V2_ROLES } from "@/lib/v2/rbac";
import { requireApiUser, requireRateLimit, requireRole } from "@/lib/v2/server-guard";

export async function POST(request, { params }) {
  const limited = requireRateLimit(request, { namespace: "v2-team-reset-password", max: 20, windowMs: 60000 });
  if (limited) return limited;

  const auth = await requireApiUser(request);
  if (auth.errorResponse) return auth.errorResponse;

  const denial = requireRole(auth.role, [V2_ROLES.SUPER_ADMIN]);
  if (denial) return denial;

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const password = String(body?.password || "");
  if (password.length < 8) {
    return NextResponse.json({ error: "password_must_be_at_least_8_chars" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) {
    return NextResponse.json({ error: error.message || "Could not reset password" }, { status: 500 });
  }

  await writeAuditLog(auth.supabase, auth.user, {
    action: "team.password_reset",
    entity_type: "user",
    entity_id: userId,
    payload: {},
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
