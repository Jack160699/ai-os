import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/app/admin/_lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/v2/auth";
import { checkRateLimit } from "@/lib/v2/rate-limit";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function requireApiUser(request) {
  if (!hasSupabaseConfig()) {
    const expectedPassword = process.env.ADMIN_DASHBOARD_PASSWORD || "";
    const cookieValue = request.cookies.get(AUTH_COOKIE)?.value || "";
    const legacyAuthed = !expectedPassword || cookieValue === expectedPassword;
    if (!legacyAuthed) {
      return { errorResponse: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
    }
    return {
      user: { id: "legacy-admin", email: "admin@local" },
      role: "super_admin",
      supabase: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorResponse: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }

  return { user, role: getUserRole(user), supabase };
}

export function requireRole(role, allowed) {
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (!list.includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}

export function requireRateLimit(request, { namespace, max, windowMs }) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const key = `${namespace}:${ip}`;
  const result = checkRateLimit({ key, max, windowMs });
  if (!result.ok) {
    return NextResponse.json(
      { error: "rate_limited", retry_after_ms: Math.max(0, result.resetAt - Date.now()) },
      { status: 429 },
    );
  }
  return null;
}
