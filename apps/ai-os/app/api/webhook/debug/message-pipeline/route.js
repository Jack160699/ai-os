import { NextResponse } from "next/server";
import { backendBase } from "@/app/admin/_lib/backendFetch";

export async function POST(req) {
  try {
    const body = await req.json();
    const password = req.headers.get("x-dashboard-password");

    if (password !== process.env.BACKEND_DASHBOARD_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, text, direction } = body || {};
    const response = await fetch(`${backendBase()}/api/aiops/debug/message-pipeline`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dashboard-Password": password,
      },
      body: JSON.stringify({ phone, text, direction }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Debug pipeline failed" },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("DEBUG PIPELINE ERROR:", err);
    return NextResponse.json({ error: err?.message || "unknown_error" }, { status: 500 });
  }
}
