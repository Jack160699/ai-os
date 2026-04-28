import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/v2/auth";
import { checkRateLimit } from "@/lib/v2/rate-limit";

export async function requireApiUser(request) {
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
