import crypto from "crypto";

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

export function verifyRazorpaySignature(rawBody, signature, secret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex").toLowerCase();
  const sig = String(signature).toLowerCase();
  return timingSafeEqualHex(expected, sig);
}

export function parsePaymentEvent(data) {
  const payload = data?.payload || {};
  const paymentEntity = payload?.payment?.entity || {};
  const paymentLink = payload?.payment_link?.entity || {};
  const notes = paymentEntity.notes || paymentLink.notes || {};
  const phoneRaw =
    paymentEntity.contact ||
    paymentEntity.customer_id ||
    notes.stratxcel_phone ||
    payload?.payment_link?.entity?.customer?.contact ||
    "";
  const phone = String(phoneRaw).replace(/\D/g, "");
  const amountPaise = Number(paymentEntity.amount);
  const amountRupees = Number.isFinite(amountPaise) ? Math.round(amountPaise) / 100 : null;
  return {
    event: String(data?.event || ""),
    phone,
    amount_paise: Number.isFinite(amountPaise) ? amountPaise : null,
    amount_rupees: amountRupees,
    payment_id: paymentEntity.id || paymentEntity.payment_id || paymentEntity.order_id || "",
    payment_link_id: paymentLink.id || paymentLink.payment_link_id || "",
    raw_event_id: data?.id || null,
  };
}
