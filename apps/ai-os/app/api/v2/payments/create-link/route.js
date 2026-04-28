import { NextResponse } from "next/server";
import { POST as createPaymentLinkPost } from "@/lib/payments/createPaymentLinkApi";
import { V2_ROLES } from "@/lib/v2/rbac";
import { requireApiUser, requireRole } from "@/lib/v2/server-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const auth = await requireApiUser(request);
  if (auth.errorResponse) return auth.errorResponse;
  const denied = requireRole(auth.role, [V2_ROLES.SUPER_ADMIN, V2_ROLES.MANAGER, V2_ROLES.FINANCE]);
  if (denied) return denied;

  try {
    return await createPaymentLinkPost(request);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Could not create payment link" }, { status: 500 });
  }
}
