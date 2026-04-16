import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { POST as createPaymentLinkPost } from "@/lib/payments/createPaymentLinkApi";

export const dynamic = "force-dynamic";
/** Razorpay SDK uses Node APIs — never Edge for this route. */
export const runtime = "nodejs";

export async function POST(request) {
  console.log("ENV CHECK", {
    has_key_id: !!process.env.RAZORPAY_LIVE_KEY_ID,
    has_secret: !!process.env.RAZORPAY_LIVE_KEY_SECRET,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
  });

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
