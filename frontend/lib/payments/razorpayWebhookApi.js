/**
 * POST /api/webhook/razorpay — Razorpay webhooks (signature verified).
 * Forwards normalized events to Flask when BOT_API_URL + INTERNAL_PAYMENT_WEBHOOK_SECRET are set.
 */

import crypto from "node:crypto";

function timingSafeEqualHex(a, b) {
  try {
    const ba = Buffer.from(String(a || ""), "hex");
    const bb = Buffer.from(String(b || ""), "hex");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function verifySignature(rawBody, signature, secret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex").toLowerCase();
  const sig = String(signature).toLowerCase();
  return timingSafeEqualHex(expected, sig);
}

function pickPhone(payload) {
  const pl = payload?.payment_link?.entity;
  const ent = payload?.payment?.entity || {};
  const fromPay = ent.contact || ent.customer_id;
  if (fromPay) return String(fromPay).replace(/\D/g, "");
  const notes = ent.notes || pl?.notes || {};
  if (notes.stratxcel_phone) return String(notes.stratxcel_phone).replace(/\D/g, "");
  const cust = pl?.customer || {};
  if (cust.contact) return String(cust.contact).replace(/\D/g, "");
  return "";
}

function pickAmountRupees(payload) {
  const ent = payload?.payment?.entity;
  if (!ent || ent.amount == null) return null;
  const paise = Number(ent.amount);
  if (!Number.isFinite(paise)) return null;
  return Math.round(paise) / 100;
}

function pickPaymentId(payload) {
  return (
    payload?.payment?.entity?.id ||
    payload?.payment?.entity?.payment_id ||
    payload?.payment?.entity?.order_id ||
    ""
  );
}

function pickPaymentLinkId(payload) {
  return payload?.payment_link?.entity?.id || payload?.payment_link?.entity?.payment_link_id || "";
}

async function forwardToFlask(body) {
  const base = String(process.env.BOT_API_URL || process.env.NEXT_PUBLIC_BOT_API_URL || "").replace(/\/+$/, "");
  const secret = String(process.env.INTERNAL_PAYMENT_WEBHOOK_SECRET || "").trim();
  if (!base || !secret) {
    console.info("[razorpay-webhook] skip Flask forward (BOT_API_URL or INTERNAL_PAYMENT_WEBHOOK_SECRET unset)");
    return;
  }
  const url = `${base}/internal/razorpay-payment`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Payment-Secret": secret,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error("[razorpay-webhook] Flask forward failed", res.status, text.slice(0, 500));
  } else {
    console.info("[razorpay-webhook] Flask forward ok", res.status);
  }
}

export async function POST(request) {
  const secret = String(
    process.env.RAZORPAY_LIVE_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || ""
  ).trim();
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || request.headers.get("X-Razorpay-Signature") || "";

  if (!secret) {
    console.error("[razorpay-webhook] RAZORPAY_LIVE_WEBHOOK_SECRET not set");
    return Response.json({ ok: false, error: "webhook not configured" }, { status: 503 });
  }

  if (!verifySignature(rawBody, signature, secret)) {
    console.error("[razorpay-webhook] invalid signature");
    return Response.json({ ok: false, error: "invalid signature" }, { status: 400 });
  }

  let data;
  try {
    data = JSON.parse(rawBody || "{}");
  } catch (e) {
    console.error("[razorpay-webhook] invalid json", e);
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const event = String(data.event || "");
  console.info("[razorpay-webhook] event=", event);

  const payload = data.payload || {};
  const successEvents = new Set(["payment_link.paid", "payment.captured"]);

  if (!successEvents.has(event)) {
    return Response.json({ ok: true, ignored: true, event });
  }

  const phone = pickPhone(payload);
  const amountRupees = pickAmountRupees(payload);
  const paymentId = pickPaymentId(payload);
  const paymentLinkId = pickPaymentLinkId(payload);

  if (!phone) {
    console.warn("[razorpay-webhook] could not resolve phone from payload");
  }

  await forwardToFlask({
    event,
    phone,
    amount_rupees: amountRupees,
    amount_paise: payload?.payment?.entity?.amount ?? null,
    payment_id: paymentId,
    payment_link_id: paymentLinkId,
    raw_event_id: data.id || null,
  });

  return Response.json({ ok: true, received: true, event });
}
