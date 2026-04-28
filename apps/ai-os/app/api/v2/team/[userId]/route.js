import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/v2/audit";
import { normalizeRole, V2_ROLES } from "@/lib/v2/rbac";
import { requireApiUser, requireRateLimit, requireRole } from "@/lib/v2/server-guard";

export async function PATCH(request, { params }) {
  const limited = requireRateLimit(request, { namespace: "v2-team-update", max: 30, windowMs: 60000 });
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

  const admin = createAdminClient();
  const updates = {};
  const appMetadata = {};
  const userMetadata = {};

  if (body?.role) {
    const role = normalizeRole(body.role);
    appMetadata.role = role;
    userMetadata.role = role;
    updates.role = role;
  }
  if (typeof body?.full_name === "string") {
    const fullName = String(body.full_name).trim();
    userMetadata.full_name = fullName;
    updates.full_name = fullName;
  }
  if (typeof body?.is_active === "boolean") {
    updates.is_active = body.is_active;
  }

  if (Object.keys(appMetadata).length || Object.keys(userMetadata).length) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: Object.keys(appMetadata).length ? appMetadata : undefined,
      user_metadata: Object.keys(userMetadata).length ? userMetadata : undefined,
    });
    if (authError) {
      return NextResponse.json({ error: authError.message || "Could not update auth user" }, { status: 500 });
    }
  }

  if (Object.keys(updates).length) {
    const { error: profileError } = await admin.from("team_members").upsert({
      user_id: userId,
      ...updates,
    });
    if (profileError) {
      return NextResponse.json({ error: profileError.message || "Could not update team member" }, { status: 500 });
    }
  }

  if (Object.keys(updates).length) {
    await writeAuditLog(auth.supabase, auth.user, {
      action: "team.user_updated",
      entity_type: "user",
      entity_id: userId,
      payload: updates,
    });
    if (updates.role) {
      await writeAuditLog(auth.supabase, auth.user, {
        action: "team.role_changed",
        entity_type: "user",
        entity_id: userId,
        payload: { role: updates.role },
      });
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
