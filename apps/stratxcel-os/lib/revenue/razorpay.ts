type CreateLinkResult = { provider_ref: string; checkout_url: string; provider_status: string };

function authHeader(): string {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.RAZORPAY_LIVE_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET ?? process.env.RAZORPAY_LIVE_KEY_SECRET;
  if (!keyId || !secret) {
    throw new Error("Razorpay is not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET).");
  }
  const token = Buffer.from(`${keyId}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

export async function createRazorpayPaymentLink(opts: {
  amountMinor: number;
  currency: string;
  description: string;
  customerName: string;
}): Promise<CreateLinkResult> {
  const res = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: opts.amountMinor,
      currency: opts.currency,
      description: opts.description.slice(0, 250),
      customer: { name: opts.customerName.slice(0, 120) },
      notify: { sms: false, email: false },
      reminder_enable: true,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Razorpay error (${res.status})`);
  }
  const data = JSON.parse(text) as { id: string; short_url: string; status: string };
  return { provider_ref: data.id, checkout_url: data.short_url, provider_status: data.status };
}

export async function fetchRazorpayPaymentLink(providerRef: string): Promise<{ status: string }> {
  const res = await fetch(`https://api.razorpay.com/v1/payment_links/${providerRef}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Razorpay fetch error (${res.status})`);
  }
  const data = JSON.parse(text) as { status: string };
  return { status: data.status };
}

export function mapRazorpayLinkStatus(status: string): "pending" | "paid" | "partially_paid" | "expired" | "cancelled" {
  const s = status.toLowerCase();
  if (s === "paid") return "paid";
  if (s === "partially_paid") return "partially_paid";
  if (s === "expired") return "expired";
  if (s === "cancelled") return "cancelled";
  return "pending";
}
