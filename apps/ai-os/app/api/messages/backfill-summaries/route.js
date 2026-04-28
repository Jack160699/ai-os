import { NextResponse } from "next/server";

export async function POST(request) {
  void request;
  return NextResponse.json({ ok: true, route: "backfill live" }, { status: 200 });
}
