import { NextResponse } from "next/server";
import { adminApiHeaders, backendBase } from "@/app/admin/_lib/backendFetch";
import { V2_ROLES } from "@/lib/v2/rbac";
import { requireApiUser, requireRole } from "@/lib/v2/server-guard";

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export async function POST(request, { params }) {
  const auth = await requireApiUser(request);
  if (auth.errorResponse) return auth.errorResponse;
  const denied = requireRole(auth.role, [V2_ROLES.SUPER_ADMIN, V2_ROLES.MANAGER, V2_ROLES.SUPPORT]);
  if (denied) return denied;

  const { phone } = await params;
  const digits = digitsOnly(phone);
  if (!digits) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  try {
    const response = await fetch(`${backendBase()}/inbox/suggest`, {
      method: "POST",
      headers: adminApiHeaders(),
      body: JSON.stringify({ phone: digits }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "service_unavailable", message: error?.message || "Could not suggest reply" }, { status: 503 });
  }
}
