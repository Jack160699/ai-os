/**
 * Razorpay client + payment link creation (StratXcel AI OS).
 * Env:
 * - Key id: RAZORPAY_LIVE_KEY_ID (server-side only for create-link route)
 * - Secret: RAZORPAY_LIVE_KEY_SECRET (server-side only)
 * Non-production fallback: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
 * (Kept in sync with backend/payments/razorpay.js for the monorepo layout.)
 *
 * Dynamic import avoids Next.js bundler/runtime crashes from top-level `require` in `razorpay`.
 */

/** @type {import("razorpay") | null} */
let _instance = null;
let _configLogged = false;

function maskSecret(value) {
  const v = String(value || "");
  if (!v) return "(empty)";
  if (v.length < 10) return "(set)";
  return `${v.slice(0, 6)}...${v.slice(-3)} (len=${v.length})`;
}

function resolveKeys() {
  const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production" ||
    String(process.env.VERCEL_ENV || "").toLowerCase() === "production";
  const liveId = String(process.env.RAZORPAY_LIVE_KEY_ID || "").trim();
  const fallbackId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const liveSecret = String(process.env.RAZORPAY_LIVE_KEY_SECRET || "").trim();
  const fallbackSecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  const keyId = isProd ? liveId : (liveId || fallbackId);
  const keySecret = isProd ? liveSecret : (liveSecret || fallbackSecret);
  const idSource = process.env.RAZORPAY_LIVE_KEY_ID
    ? "RAZORPAY_LIVE_KEY_ID"
    : fallbackId
      ? "RAZORPAY_KEY_ID"
      : "(missing)";
  const secretSource = liveSecret
    ? "RAZORPAY_LIVE_KEY_SECRET"
    : fallbackSecret
      ? "RAZORPAY_KEY_SECRET"
      : "(missing)";
  return { keyId, keySecret, idSource, secretSource, isProd };
}

export function getResolvedRazorpayKeySource() {
  const { keyId, keySecret, idSource, secretSource, isProd } = resolveKeys();
  return {
    idSource,
    secretSource,
    isProd,
    keyPrefix: keyId ? keyId.slice(0, 8) : "missing",
    hasSecret: Boolean(keySecret),
  };
}

/**
 * @returns {Promise<import("razorpay")>}
 */
export async function getRazorpay() {
  const { keyId, keySecret, idSource, secretSource, isProd } = resolveKeys();

  if (!_configLogged) {
    _configLogged = true;
    const mode = keyId.startsWith("rzp_live_") ? "live" : keyId.startsWith("rzp_test_") ? "test" : "unknown";
    console.info(
      `[razorpay-config] id_source=${idSource} secret_source=${secretSource} mode=${mode} key_id=${maskSecret(keyId)} key_secret=${maskSecret(keySecret)}`
    );
  }

  if (!keyId || !keySecret) {
    if (isProd) {
      if (!keyId && !keySecret) throw new Error("LIVE KEY MISSING: RAZORPAY_LIVE_KEY_ID, RAZORPAY_LIVE_KEY_SECRET");
      if (!keyId) throw new Error("LIVE KEY MISSING: RAZORPAY_LIVE_KEY_ID");
      throw new Error("LIVE KEY MISSING: RAZORPAY_LIVE_KEY_SECRET");
    }
    throw new Error("Razorpay is not configured: set RAZORPAY_LIVE_KEY_ID and RAZORPAY_LIVE_KEY_SECRET");
  }
  if (isProd && !keyId.startsWith("rzp_live_")) {
    throw new Error("Unsafe Razorpay config in production: key id is not live.");
  }
  if (!_instance) {
    const { default: Razorpay } = await import("razorpay");
    _instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _instance;
}

/**
 * @param {{ amount: number | string, name: string, phone: string, description?: string, email?: string }} p
 * @returns {Promise<{ short_url: string, id: string, amount_paise: number }>}
 */
export async function createPaymentLink({ amount, name, phone, description, email }) {
  const rp = await getRazorpay();
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
    console.info(`[razorpay] createPaymentLink success id=${String(id)} short_url=${String(shortUrl)}`);
    return { short_url: String(shortUrl), id: String(id), amount_paise: amountPaise };
  } catch (err) {
    const msg = err?.error?.description || err?.message || String(err);
    console.error("[razorpay] createPaymentLink failed:", msg, err?.error || "");
    throw new Error(msg);
  }
}
