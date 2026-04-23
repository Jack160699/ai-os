export function extractLeadProfilePatch(message, existing = {}) {
  const low = String(message || "").toLowerCase();
  const patch = {};
  if (!existing?.service_interest) {
    if (/\b(website|site|landing)\b/.test(low)) patch.service_interest = "website";
    else if (/\b(ads|meta ads|google ads|lead gen)\b/.test(low)) patch.service_interest = "ads";
    else if (/\b(bot|chatbot|whatsapp bot)\b/.test(low)) patch.service_interest = "bot";
    else if (/\b(seo|gmb|google ranking)\b/.test(low)) patch.service_interest = "seo";
  }
  if (!existing?.business_type) {
    const bizMap = [
      ["salon", /\b(salon|spa|beauty)\b/],
      ["gym", /\b(gym|fitness|trainer)\b/],
      ["clinic", /\b(clinic|doctor|dental|hospital|physio)\b/],
      ["real_estate", /\b(real estate|property|builder|broker)\b/],
      ["ecommerce", /\b(ecommerce|e-commerce|shopify|d2c|online store)\b/],
    ];
    for (const [biz, re] of bizMap) {
      if (re.test(low)) {
        patch.business_type = biz;
        break;
      }
    }
  }
  if (!existing?.city) {
    const cityMatch = String(message || "").match(/\b(in|from)\s+([A-Za-z]{3,20})\b/i);
    if (cityMatch?.[2]) patch.city = cityMatch[2];
  }
  if (!existing?.budget_range) {
    const budgetMatch = low.match(/(?:₹|rs\.?|inr)?\s*(\d{2,3})\s*k\b|(?:₹|rs\.?|inr)?\s*(\d{4,6})\b/);
    if (budgetMatch) {
      patch.budget_range = budgetMatch[1] ? `${budgetMatch[1]}k` : budgetMatch[2];
    }
  }
  return patch;
}

export function parseNeedTag(message) {
  const low = String(message || "").toLowerCase();
  if (/\b(leads?|growth|pipeline)\b/.test(low)) return "lead_growth";
  if (/\b(website|site|landing)\b/.test(low)) return "website";
  if (/\b(ads|meta ads|google ads)\b/.test(low)) return "ads";
  if (/\b(automation|crm|workflow)\b/.test(low)) return "automation";
  if (/\b(branding|logo|design)\b/.test(low)) return "branding";
  if (/\b(seo|ranking|gmb)\b/.test(low)) return "seo";
  return "";
}

export function appendMemoryTag(base, tag, value) {
  const head = String(base || "").trim();
  const t = String(tag || "").trim();
  const v = String(value || "").trim();
  if (!t || !v) return head;
  const token = `[${t}:${v}]`;
  if (head.includes(token)) return head;
  return [head, token].filter(Boolean).join(" ");
}

export function readMemoryTag(summary, tag) {
  const s = String(summary || "");
  const m = s.match(new RegExp(`\\[${String(tag)}:([^\\]]+)\\]`));
  return m?.[1] ? m[1].trim() : "";
}

export function isReturningLead(leadMem) {
  const bt = String(leadMem?.buyer_type || "").toLowerCase();
  if (bt === "ghosted_return_lead") return true;
  const ts = leadMem?.last_contacted_at ? Date.parse(String(leadMem.last_contacted_at)) : NaN;
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts > 5 * 24 * 60 * 60 * 1000;
}
