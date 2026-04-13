import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/app/admin/_lib/auth";

/**
 * Require Next admin session cookie (same as AdminShell login).
 */
export function assertAdminRequest(request) {
  const secret = process.env.ADMIN_DASHBOARD_PASSWORD || "";
  if (!secret) {
    return null;
  }
  const cookie = request.cookies.get(AUTH_COOKIE)?.value ?? "";
  try {
    const a = Buffer.from(cookie, "utf8");
    const b = Buffer.from(secret, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
