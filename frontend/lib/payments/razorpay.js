/**
 * Razorpay client + payment link creation (StratXcel AI OS).
 * Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
 * (Kept in sync with backend/payments/razorpay.js for the monorepo layout.)
 */

import Razorpay from "razorpay";

/** @type {Razorpay | null} */
let _instance = null;

/**
 * @returns {Razorpay}
 */
export function getRazorpay() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
  }
  if (!_instance) {
    _instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _instance;
}

/**
 * @param {{ amount: number | string, name: string, phone: string, description?: string, email?: string }} p
 * @returns {Promise<{ short_url: string, id: string, amount_paise: number }>}
 */
export async function createPaymentLink({ amount, name, phone, description, email }) {
  const rp = getRazorpay();
  const rupees = Number(String(amount).replace(/,/g, "").trim());
  if (!Number.isFinite(rupees) || rupees <= 0) {
    throw new Error("Invalid amount");
  }
  const amountPaise = Math.round(rupees * 100);
  if (amountPaise < 100) {
    throw new Error("Amount must be at least ₹1 (100 paise)");
  }

  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits || digits.length < 8) {
    throw new Error("Invalid phone: need digits with country code");
  }

  const contact = `+${digits}`;
  const custName = String(name || "Customer").trim().slice(0, 120) || "Customer";
  const desc = String(description || "StratXcel payment").trim().slice(0, 250) || "StratXcel payment";

  const fallbackEmail = String(process.env.RAZORPAY_CUSTOMER_EMAIL_FALLBACK || "").trim();
  const custEmail = String(email || "").trim() || fallbackEmail;
  if (!custEmail || !custEmail.includes("@")) {
    throw new Error("Customer email required: pass `email` in the request body or set RAZORPAY_CUSTOMER_EMAIL_FALLBACK");
  }

  const ref = `sx_${Date.now().toString(36)}_${digits.slice(-6)}`;

  const body = {
    amount: amountPaise,
    currency: "INR",
    accept_partial: false,
    description: desc,
    reference_id: ref,
    customer: {
      name: custName,
      contact,
      email: custEmail,
    },
    notify: {
      sms: true,
      email: Boolean(String(process.env.RAZORPAY_NOTIFY_EMAIL || "").trim() === "1"),
    },
    reminder_enable: true,
    notes: {
      stratxcel_phone: digits,
      stratxcel_name: custName,
    },
  };

  try {
    const link = await rp.paymentLink.create(body);
    const shortUrl = link?.short_url;
    const id = link?.id;
    if (!shortUrl || !id) {
      console.error("[razorpay] unexpected create response:", link);
      throw new Error("Razorpay did not return short_url or id");
    }
    return { short_url: String(shortUrl), id: String(id), amount_paise: amountPaise };
  } catch (err) {
    const msg = err?.error?.description || err?.message || String(err);
    console.error("[razorpay] createPaymentLink failed:", msg, err?.error || "");
    throw new Error(msg);
  }
}
