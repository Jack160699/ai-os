import { NextResponse } from "next/server";
import { flaskBotBase } from "@/app/admin/_lib/flaskBotBase";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {}

  const res = await fetch(`${flaskBotBase()}/api/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: body?.amount ?? 499 }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({ error: "invalid_response" }));
  return NextResponse.json(data, { status: res.status });
}
