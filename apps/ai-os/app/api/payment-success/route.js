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

  const text = await res.text().catch(() => "");
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    return NextResponse.json(
      { error: "checkout_upstream_error", detail: text.slice(0, 200) },
      { status: res.status >= 400 ? res.status : 502 }
    );
  }
  try {
    const data = JSON.parse(text || "{}");
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "checkout_upstream_invalid_json" }, { status: 502 });
  }
}
