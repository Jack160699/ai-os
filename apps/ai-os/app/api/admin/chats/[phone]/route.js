import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { adminApiHeaders } from "@/app/admin/_lib/backendFetch";
import { backendBase } from "@/app/admin/_lib/backendFetch";

export async function GET(request, { params }) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const { phone } = await params;
  const digits = decodeURIComponent(phone || "").replace(/\D/g, "");
  if (!digits) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const url = `${backendBase()}/inbox/lead/${encodeURIComponent(digits)}`;
  const res = await fetch(url, { cache: "no-store", headers: adminApiHeaders() });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
