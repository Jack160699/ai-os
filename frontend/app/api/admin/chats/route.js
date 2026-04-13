import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { adminApiHeaders, backendBase } from "@/app/admin/_lib/backendFetch";

export const dynamic = "force-dynamic";

/**
 * Proxies Flask `GET /inbox.json` for the admin live inbox conversation list.
 */
export async function GET(request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const temperature = searchParams.get("temperature") || "all";
  const unreadOnly = searchParams.get("unread_only") || "";

  const url = new URL(`${backendBase()}/inbox.json`);
  if (q) url.searchParams.set("q", q);
  if (temperature) url.searchParams.set("temperature", temperature);
  if (unreadOnly) url.searchParams.set("unread_only", unreadOnly);

  const res = await fetch(url.toString(), { cache: "no-store", headers: adminApiHeaders() });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
