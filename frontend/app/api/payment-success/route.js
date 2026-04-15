import { NextResponse } from "next/server";
import { flaskBotBase } from "@/app/admin/_lib/flaskBotBase";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const payload = {
    razorpay_payment_id: body?.razorpay_payment_id,
    razorpay_order_id: body?.razorpay_order_id,
    razorpay_signature: body?.razorpay_signature,
    amount: body?.amount ?? 499,
    source: body?.source ?? "website_checkout",
  };

  const res = await fetch(`${flaskBotBase()}/api/payment-success`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({ error: "invalid_response" }));
  return NextResponse.json(data, { status: res.status });
}
