import { createPaymentLink } from "../payments/razorpay.js";
import { fetchLeadByPhone, savePaymentLink } from "./supabase.js";
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
