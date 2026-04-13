import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { adminApiHeaders, backendBase } from "@/app/admin/_lib/backendFetch";

export async function POST(request, { params }) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const { phone } = await params;
  const digits = decodeURIComponent(phone || "").replace(/\D/g, "");
  if (!digits) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const text = typeof body?.text === "string" ? body.text : "";

  const res = await fetch(`${backendBase()}/inbox/reply`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({ phone: digits, text }),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
