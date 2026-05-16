import { NextResponse } from "next/server";
import { validateAuditLeadPayload } from "@/app/lib/auditLeadValidation";

export const dynamic = "force-dynamic";

const PLACEHOLDER = "https://YOUR_N8N_WEBHOOK_URL";

export async function POST(request) {
  const webhookUrl = String(process.env.N8N_AUDIT_WEBHOOK_URL || "").trim();
  if (!webhookUrl || webhookUrl === PLACEHOLDER) {
    return NextResponse.json(
      {
        error: "webhook_not_configured",
        message: "Lead capture is not configured yet. Set N8N_AUDIT_WEBHOOK_URL on the server.",
      },
      { status: 503 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = validateAuditLeadPayload(body);
  if (!result.ok) {
    return NextResponse.json({ error: "validation_failed", errors: result.errors }, { status: 422 });
  }

  const payload = {
    business_name: result.data.business_name,
    website: result.data.website,
    instagram: result.data.instagram,
    problem: result.data.problem,
    phone: result.data.phone,
  };

  try {
    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const snippet = (await upstream.text().catch(() => "")).slice(0, 200);
      return NextResponse.json(
        {
          error: "upstream_error",
          message: "We could not reach our inbox. Please try again in a moment.",
          detail: snippet || undefined,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "network_error", message: "Connection failed. Check your network and try again." },
      { status: 502 }
    );
  }
}
