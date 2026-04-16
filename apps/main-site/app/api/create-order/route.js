import { NextResponse } from "next/server";
import { flaskBotBase } from "@stratxcel/payments";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const res = await fetch(`${flaskBotBase()}/api/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: body?.amount ?? 499 }),
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
    const returnedKey = String(data?.key || "");
    const liveKey = String(process.env.RAZORPAY_LIVE_KEY_ID || "");
    const publicLiveKey = String(process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID || "");
    const matches = liveKey && publicLiveKey ? String(liveKey === publicLiveKey) : "unknown";
    console.log(
      `[main-site/api/create-order] returned_prefix=${returnedKey.slice(0, 8)} ` +
        `live_prefix=${liveKey.slice(0, 8)} public_live_prefix=${publicLiveKey.slice(0, 8)} ` +
        `live_public_match=${matches}`
    );
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "checkout_upstream_invalid_json" }, { status: 502 });
  }
}
