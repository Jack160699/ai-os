/**
 * POST /api/payments/create-link
 * Body JSON: { amount, name, phone, description?, email? }
 */

import { createPaymentLink } from "@/lib/payments/razorpay";

export async function POST(request) {
  try {
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
