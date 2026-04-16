/**
 * POST /api/payments/create-link
 * Body JSON: { amount, name, phone, description?, email? }
 */

import { createPaymentLink, getResolvedRazorpayKeySource } from "@/lib/payments/razorpay";

export async function POST(request) {
  try {
    console.log({
      has_key_id: !!process.env.RAZORPAY_LIVE_KEY_ID,
      has_secret: !!process.env.RAZORPAY_LIVE_KEY_SECRET,
      node_env: process.env.NODE_ENV,
    });

    const liveKeyId = String(process.env.RAZORPAY_LIVE_KEY_ID || "").trim();
    const liveKeySecret = String(process.env.RAZORPAY_LIVE_KEY_SECRET || "").trim();
    const missing = [];
    if (!liveKeyId) missing.push("RAZORPAY_LIVE_KEY_ID");
    if (!liveKeySecret) missing.push("RAZORPAY_LIVE_KEY_SECRET");
    if (missing.length > 0) {
      return Response.json(
        { ok: false, error: `LIVE KEY MISSING: ${missing.join(", ")}` },
        { status: 500 }
      );
    }

    const src = getResolvedRazorpayKeySource();
    console.log(
      `[payments/create-link] create-link key prefix: ${src.keyPrefix} source=${src.idSource} has_secret=${src.hasSecret} env=${src.isProd ? "production" : "non_production"}`
    );
    const body = await request.json().catch(() => ({}));
    const { amount, name, phone, description, email } = body;

    if (amount === undefined || amount === null || amount === "") {
      return Response.json({ ok: false, error: "amount is required" }, { status: 400 });
    }
    if (!name || !String(name).trim()) {
      return Response.json({ ok: false, error: "name is required" }, { status: 400 });
    }
    if (!phone || !String(phone).trim()) {
      return Response.json({ ok: false, error: "phone is required" }, { status: 400 });
    }

    const out = await createPaymentLink({
      amount,
      name,
      phone,
      description,
      email,
    });

    return Response.json({
      ok: true,
      payment_link: out.short_url,
      short_url: out.short_url,
      id: out.id,
      amount_paise: out.amount_paise,
    });
  } catch (e) {
    const message = e?.message || String(e);
    console.error("[payments/create-link]", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
