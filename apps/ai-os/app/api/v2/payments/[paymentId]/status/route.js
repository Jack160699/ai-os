import { NextResponse } from "next/server";
import { createNotification } from "@/lib/v2/notify";
import { V2_ROLES } from "@/lib/v2/rbac";
import { writeAuditLog } from "@/lib/v2/audit";
import { requireApiUser, requireRateLimit, requireRole } from "@/lib/v2/server-guard";

export async function PATCH(request, { params }) {
  const limited = requireRateLimit(request, { namespace: "v2-payments-status", max: 40, windowMs: 60000 });
  if (limited) return limited;

  const auth = await requireApiUser(request);
  if (auth.errorResponse) return auth.errorResponse;
  const denied = requireRole(auth.role, [V2_ROLES.SUPER_ADMIN, V2_ROLES.MANAGER, V2_ROLES.FINANCE]);
  if (denied) return denied;

  const { paymentId } = await params;
  if (!paymentId) {
    return NextResponse.json({ error: "missing_payment_id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const status = String(body?.status || "").trim().toLowerCase();
  if (!status) {
    return NextResponse.json({ error: "status_required" }, { status: 400 });
  }

  await writeAuditLog(auth.supabase, auth.user, {
    action: "payment.status_changed",
    entity_type: "payment",
    entity_id: paymentId,
    payload: { status },
  });
  if (status.includes("pending")) {
    await createNotification(auth.supabase, {
      user_id: null,
      type: "payment_pending",
      title: "Payment pending",
      body: `Payment ${paymentId} moved to pending`,
      meta: { payment_id: paymentId, status },
    });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
