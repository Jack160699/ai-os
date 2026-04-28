import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/v2/audit";
import { normalizeRole, V2_ROLES } from "@/lib/v2/rbac";
import { requireApiUser, requireRateLimit, requireRole } from "@/lib/v2/server-guard";

function teamRowFromAuth(user, teamMeta) {
  const appRole = user?.app_metadata?.role || user?.user_metadata?.role;
  const role = normalizeRole(teamMeta?.role || appRole);
  const name =
    teamMeta?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "User";
  return {
    id: user.id,
    email: user.email,
    full_name: name,
    role,
    is_active: Boolean(teamMeta?.is_active ?? true),
    last_sign_in_at: user.last_sign_in_at,
    created_at: user.created_at,
  };
}

export async function GET(request) {
  const limited = requireRateLimit(request, { namespace: "v2-team-list", max: 40, windowMs: 60000 });
  if (limited) return limited;

  const auth = await requireApiUser(request);
  if (auth.errorResponse) return auth.errorResponse;

  const denial = requireRole(auth.role, [V2_ROLES.SUPER_ADMIN]);
  if (denial) return denial;

  const admin = createAdminClient();
  const [{ data: usersData, error: usersError }, { data: teamRows, error: teamError }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
    admin.from("team_members").select("user_id, full_name, role, is_active"),
  ]);

  if (usersError) {
    return NextResponse.json({ error: usersError.message || "Could not list users" }, { status: 500 });
  }
  if (teamError) {
    return NextResponse.json({ error: teamError.message || "Could not list team members" }, { status: 500 });
  }

  const metaMap = new Map((teamRows || []).map((row) => [row.user_id, row]));
  const users = (usersData?.users || []).map((user) => teamRowFromAuth(user, metaMap.get(user.id)));

  return NextResponse.json({ users }, { status: 200 });
}

export async function POST(request) {
  const limited = requireRateLimit(request, { namespace: "v2-team-create", max: 20, windowMs: 60000 });
  if (limited) return limited;

  const auth = await requireApiUser(request);
  if (auth.errorResponse) return auth.errorResponse;

  const denial = requireRole(auth.role, [V2_ROLES.SUPER_ADMIN]);
  if (denial) return denial;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "").trim();
  const fullName = String(body?.full_name || "").trim();
  const role = normalizeRole(body?.role);

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "email and password(min 8 chars) are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || email, role },
    app_metadata: { role },
  });

  if (createError || !created?.user?.id) {
    return NextResponse.json({ error: createError?.message || "Could not create user" }, { status: 500 });
  }

  const { error: teamInsertError } = await admin.from("team_members").upsert({
    user_id: created.user.id,
    full_name: fullName || email,
    role,
    is_active: true,
  });

  if (teamInsertError) {
    return NextResponse.json({ error: teamInsertError.message || "Could not create team profile" }, { status: 500 });
  }

  await writeAuditLog(auth.supabase, auth.user, {
    action: "team.user_created",
    entity_type: "user",
    entity_id: created.user.id,
    payload: { email, role },
  });

  return NextResponse.json({ ok: true, user_id: created.user.id }, { status: 201 });
}
