import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { adminApiHeaders, backendBase } from "@/app/admin/_lib/backendFetch";

export async function POST(request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") === "1";
  const body = await request.json().catch(() => ({}));
  const limit = Number.parseInt(String(body?.limit || url.searchParams.get("limit") || "300"), 10) || 300;

  try {
    const backendUrl = `${backendBase()}/api/messages/backfill-summaries`;
    const backendRes = await fetch(backendUrl, {
      method: "POST",
      headers: adminApiHeaders(),
      cache: "no-store",
      body: JSON.stringify({ dry_run: dryRun ? 1 : 0, limit }),
    });
    const data = await backendRes.json().catch(() => ({}));
    const scanned = Number(data?.scanned || 0);
    const inserted = Number(data?.inserted || 0);
    const skipped = Math.max(0, scanned - inserted);
    return NextResponse.json(
      {
        ok: Boolean(data?.ok),
        dry_run: dryRun,
        scanned,
        inserted,
        skipped,
      },
      { status: backendRes.ok ? 200 : 500 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        dry_run: dryRun,
        scanned: 0,
        inserted: 0,
        skipped: 0,
      },
      { status: 500 },
    );
  }
}
