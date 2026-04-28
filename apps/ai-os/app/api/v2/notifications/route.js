import { NextResponse } from "next/server";
import { requireApiUser, requireRateLimit } from "@/lib/v2/server-guard";

export async function GET(request) {
  const limited = requireRateLimit(request, { namespace: "v2-notifications-get", max: 100, windowMs: 60000 });
  if (limited) return limited;

  const auth = await requireApiUser(request);
  if (auth.errorResponse) return auth.errorResponse;
  if (!auth.supabase) {
    return NextResponse.json({ notifications: [], unread: 0 }, { status: 200 });
  }

  const { data, error } = await auth.supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at, meta")
    .or(`user_id.eq.${auth.user.id},user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message || "Could not load notifications" }, { status: 500 });
  }

  const unread = (data || []).filter((row) => !row.is_read).length;
  return NextResponse.json({ notifications: data || [], unread }, { status: 200 });
}

export async function PATCH(request) {
  const limited = requireRateLimit(request, { namespace: "v2-notifications-patch", max: 30, windowMs: 60000 });
  if (limited) return limited;

  const auth = await requireApiUser(request);
  if (auth.errorResponse) return auth.errorResponse;
  if (!auth.supabase) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body?.mark_all_read) {
    const { error } = await auth.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", auth.user.id)
      .eq("is_read", false);
    if (error) {
      return NextResponse.json({ error: error.message || "Could not update notifications" }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ error: "unsupported_operation" }, { status: 400 });
}
