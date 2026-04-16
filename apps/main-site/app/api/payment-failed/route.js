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

  const res = await fetch(`${flaskBotBase()}/api/payment-failed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
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
