import { createPaymentLink } from "../payments/razorpay.js";
import { getRazorpay } from "../payments/razorpay.js";
import {
  fetchLatestPaymentLinkByPhone,
  fetchLeadByPhone,
  markPaymentLinkPaidByProviderId,
  savePaymentLink,
} from "./supabase.js";
import { buildCloseModeReply } from "./aiControl.js";

export async function sendInstantPaymentFlow({ phone, leadMem, lang, servicePkg, serviceKey }) {
  const lead = await fetchLeadByPhone(phone);
  const name =
    String(lead?.name || lead?.full_name || leadMem?.name || leadMem?.full_name || "Customer").trim() || "Customer";
  const email = String(lead?.email || leadMem?.email || "").trim();
  const description = `${servicePkg.packageName} | ${servicePkg.serviceLabel}`;
  let paymentLink = "";
  let requiresEmail = false;
  try {
    const out = await createPaymentLink({
      amount: servicePkg.priceInr,
      name,
      phone,
      description,
      email: email || undefined,
    });
    paymentLink = out.short_url;
    await savePaymentLink({
      phone,
      provider: "razorpay",
      provider_link_id: out.id,
      short_url: out.short_url,
      amount_paise: out.amount_paise,
      status: "created",
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    const em = String(err?.message || "").toLowerCase();
    requiresEmail = em.includes("email required");
  }
  return buildCloseModeReply({
    language: lang,
    serviceKey,
    paymentLink,
    requiresEmail,
  });
}

export function isPaymentConfirmationMessage(message) {
  const low = String(message || "").toLowerCase().trim();
  return /\b(paid|done payment|payment done)\b/.test(low);
}

export async function handlePaymentConfirmationMessage(phone) {
  const latest = await fetchLatestPaymentLinkByPhone(phone);
  if (!latest?.provider_link_id) return null;

  let status = String(latest.status || "").toLowerCase();
  let remotePaymentId = "";
  try {
    const rp = getRazorpay();
    const remote = await rp.paymentLink.fetch(String(latest.provider_link_id));
    status = String(remote?.status || status || "").toLowerCase();
    remotePaymentId = String(remote?.payment_id || "").trim();
  } catch {
    // Keep fallback on stored status.
  }

  if (status === "paid") {
    await markPaymentLinkPaidByProviderId(
      String(latest.provider_link_id),
      remotePaymentId || latest.payment_id || "",
      new Date().toISOString()
    );
    return {
      paid: true,
      text: [
        "Payment confirmed.",
        "Great — onboarding starts now.",
        "",
        "Quick onboarding details:",
        "1. Business name + niche",
        "2. Brand assets link (logo, creatives, copy)",
        "3. Primary goal for first 14 days",
      ].join("\n"),
    };
  }

  if (latest.short_url) {
    return {
      paid: false,
      text: [
        "I checked — payment is still pending.",
        "Sharing your secure link again:",
        String(latest.short_url),
      ].join("\n"),
    };
  }

  return {
    paid: false,
    text: "I checked — payment is still pending on the latest link.",
  };
}
