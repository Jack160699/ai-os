import { insertLeadEvent, saveMessage, upsertLeadRecord, upsertSalesOpportunity } from "./supabase.js";

function cleanPhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function parseUTM(payload = {}) {
  return {
    source: String(payload.source || payload.utm_source || "direct").trim() || "direct",
    medium: String(payload.medium || payload.utm_medium || "").trim() || null,
    campaign: String(payload.campaign || payload.utm_campaign || "").trim() || null,
    adset: String(payload.adset || payload.utm_adset || "").trim() || null,
    ad: String(payload.ad || payload.utm_ad || "").trim() || null,
  };
}

export async function captureLead(payload = {}) {
  const phone = cleanPhone(payload.phone);
  if (!phone) {
    return { ok: false, error: "phone is required" };
  }

  const name = String(payload.name || "").trim() || null;
  const email = String(payload.email || "").trim() || null;
  const note = String(payload.message || payload.note || "").trim();
  const utm = parseUTM(payload);
  const now = new Date().toISOString();
  const status = String(payload.status || "new").trim();

  await upsertLeadRecord({
    phone,
    name,
    email,
    status,
    source: utm.source,
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
    utm_adset: utm.adset,
    utm_ad: utm.ad,
    last_seen_at: now,
    created_at: now,
  });

  await upsertSalesOpportunity({
    phone,
    stage: "new",
    qualification_state: "unqualified",
    source: utm.source,
    updated_at: now,
    next_followup_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  });

  await insertLeadEvent({
    phone,
    event_type: "lead_captured",
    event_value: status,
    payload: { utm, email, name },
    created_at: now,
  });

  if (note) {
    await saveMessage(phone, note, "user");
  }

  return { ok: true, lead: { phone, name, email, status, utm } };
}
