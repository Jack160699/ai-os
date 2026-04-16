import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { POST as createPaymentLinkPost } from "@/lib/payments/createPaymentLinkApi";

export const dynamic = "force-dynamic";
/** Razorpay SDK uses Node APIs; avoid Edge runtime 500s. */
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const denied = assertAdminRequest(request);
    if (denied) return denied;
    return await createPaymentLinkPost(request);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : "";
    console.error("[api/payments/create-link] unhandled", message, stack);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
