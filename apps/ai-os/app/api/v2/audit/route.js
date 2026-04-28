import { NextResponse } from "next/server";
import { V2_ROLES } from "@/lib/v2/rbac";
import { requireApiUser, requireRateLimit, requireRole } from "@/lib/v2/server-guard";

export async function GET(request) {
  const limited = requireRateLimit(request, { namespace: "v2-audit-list", max: 60, windowMs: 60000 });
  if (limited) return limited;

  const auth = await requireApiUser(request);
  if (auth.errorResponse) return auth.errorResponse;
  const denied = requireRole(auth.role, [V2_ROLES.SUPER_ADMIN, V2_ROLES.MANAGER]);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") || "").trim();
  const action = String(searchParams.get("action") || "").trim();
  const from = String(searchParams.get("from") || "").trim();
  const to = String(searchParams.get("to") || "").trim();
  const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit") || 50)));

  let query = auth.supabase
    .from("audit_logs")
    .select("id, actor_email, action, entity_type, entity_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q) {
    query = query.or(`actor_email.ilike.%${q}%,entity_id.ilike.%${q}%,action.ilike.%${q}%`);
  }
  if (action) {
    query = query.eq("action", action);
  }
  if (from) {
    query = query.gte("created_at", from);
  }
  if (to) {
    query = query.lte("created_at", to);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message || "Could not load audit logs" }, { status: 500 });
  }

  return NextResponse.json({ logs: data || [] }, { status: 200 });
}
