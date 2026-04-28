import { NextResponse } from "next/server";
import { adminApiHeaders, backendBase } from "@/app/admin/_lib/backendFetch";
import { validateLaunchEnv } from "@/lib/v2/env";
import { routeErrorResponse } from "@/lib/v2/diagnostics";
import { requireApiUser, requireRateLimit } from "@/lib/v2/server-guard";

async function checkDb(supabase) {
  if (!supabase) return { ok: true, detail: "skipped_no_supabase" };
  const { error } = await supabase.from("team_members").select("user_id").limit(1);
  return { ok: !error, detail: error?.message || "ok" };
}

async function checkInboxApi() {
  try {
    const res = await fetch(`${backendBase()}/api/chats`, { cache: "no-store", headers: adminApiHeaders() });
    return { ok: res.ok, detail: `status_${res.status}` };
  } catch (error) {
    return { ok: false, detail: error?.message || "network_error" };
  }
}

async function checkNotifications(supabase, userId) {
  if (!supabase) return { ok: true, detail: "skipped_no_supabase" };
  const { error } = await supabase.from("notifications").select("id").or(`user_id.eq.${userId},user_id.is.null`).limit(1);
  return { ok: !error, detail: error?.message || "ok" };
}

export async function GET(request) {
  try {
    const limited = requireRateLimit(request, { namespace: "v2-health", max: 40, windowMs: 60000 });
    if (limited) return limited;

    const auth = await requireApiUser(request);
    if (auth.errorResponse) return auth.errorResponse;

    const [db, inboxApi, notifications] = await Promise.all([
      checkDb(auth.supabase),
      checkInboxApi(),
      checkNotifications(auth.supabase, auth.user.id),
    ]);

    const env = validateLaunchEnv();
    const authCheck = { ok: true, detail: auth.user.email || "ok" };
    const checks = {
      auth: authCheck,
      db,
      inbox_api: inboxApi,
      notifications,
      env,
    };
    const ok = Object.values(checks).every((row) => row?.ok !== false);

    return NextResponse.json(
      { ok, checks, checked_at: new Date().toISOString(), diagnostics: { backend_base: backendBase() } },
      { status: ok ? 200 : 503 },
    );
  } catch (error) {
    return routeErrorResponse("api.v2.health", error);
  }
}
