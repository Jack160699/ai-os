import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { mapRazorpayLinkStatus } from "@/lib/revenue/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (!secret) {
    return NextResponse.json({ ok: false, error: "RAZORPAY_WEBHOOK_SECRET not configured" }, { status: 501 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  let payload: { event?: string; payload?: { payment_link?: { entity?: { id?: string; status?: string } } } };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const entity = payload.payload?.payment_link?.entity;
  const providerRef = entity?.id;
  if (!providerRef) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
  }

  const remoteStatus = String(entity?.status ?? "");
  const mapped = mapRazorpayLinkStatus(remoteStatus);

  const { data: rows, error: findErr } = await admin.from("payment_links").select("id, paid_at").eq("provider_ref", providerRef).limit(1);
  if (findErr) {
    return NextResponse.json({ ok: false, error: findErr.message }, { status: 500 });
  }
  const row = rows?.[0];
  if (!row) {
    return NextResponse.json({ ok: true, ignored: true, reason: "unknown_provider_ref" });
  }

  const update: Record<string, unknown> = {
    status: mapped,
    last_synced_at: new Date().toISOString(),
  };
  if (mapped === "paid" || mapped === "partially_paid") {
    update.paid_at = new Date().toISOString();
  }

  const { error: upErr } = await admin.from("payment_links").update(update).eq("id", row.id);
  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
