/**
 * Phase B: lightweight buyer profiling + intent score from WhatsApp text + thread shape.
 * No LLM calls — safe for production webhook latency.
 */

const ghostReturnDays = () =>
  Math.max(1, Number.parseInt(process.env.ADAPTIVE_GHOST_RETURN_DAYS || "5", 10) || 5);

/**
 * @param {object} params
 * @param {string} params.message
 * @param {Array<{ sender?: string }>} params.recentRows oldest→newest user/bot messages
 * @param {object|null} params.leadMemory row from `lead_memory` (may be null)
 * @returns {{
 *   buyer_type: string,
 *   intent_score: number,
 *   intent_band: "cold" | "warm" | "hot",
 *   hot_lead: boolean,
 *   buying_intent: boolean,
 *   objection_type: "expensive" | "later" | "trust" | "not_now" | null,
 *   industry: "salon" | "gym" | "clinic" | "real_estate" | "ecommerce" | "general"
 * }}
 */
export function analyzeAdaptiveSalesBrain({ message, recentRows = [], leadMemory = null }) {
  const raw = String(message || "");
  const low = raw.toLowerCase().trim();

  const userTurns = recentRows.filter((r) => String(r?.sender || "").toLowerCase() === "user").length;

  let score = 0;
  if (/\b(price|pricing|cost|charge|charges|kitna|kitne|paise|fee|fees|quote|quotation)\b/.test(low)) {
    score += 18;
  }
  if (/\b(call|phone|zoom|meet|meeting|voice|vc|video call|callback)\b/.test(low)) {
    score += 20;
  }
  if (/\b(payment|pay|advance|invoice|upi|razorpay|checkout|pay now|link bhejo|link do)\b/.test(low)) {
    score += 25;
  }
  if (/\b(urgent|urgency|asap|jaldi|turant|aaj|today|now|immediate|fatafat)\b/.test(low)) {
    score += 15;
  }
  if (
    /\b(start now|start today|ready to start|lets start|let's start|book|proceed|kar do|chalu|go ahead)\b/.test(
      low
    )
  ) {
    score += 20;
  }
  if (userTurns >= 6) score += 15;
  else if (userTurns >= 4) score += 12;
  else if (userTurns >= 2) score += 6;

  const hasBuyingIntentKeyword =
    /\b(start now|start today|ready to start|lets start|let's start|book|proceed|kar do|chalu|go ahead|pay|payment|link bhejo|send link)\b/.test(
      low
    );
  score = Math.min(100, Math.max(0, Math.round(score)));
  const intent_band = score >= 72 ? "hot" : score >= 40 ? "warm" : "cold";

  const lastAt = leadMemory?.last_contacted_at ? Date.parse(String(leadMemory.last_contacted_at)) : NaN;
  const gapMs = Number.isFinite(lastAt) ? Date.now() - lastAt : 0;
  const gapDays = gapMs / 86_400_000;
  const ghostEligible = gapDays >= ghostReturnDays();
  const comeback =
    /^(hi|hello|hey|hii|namaste|namskar|namaskar)\b/i.test(raw.trim()) ||
    /\b(sorry|busy|wapas|again|missed|baad me|bad me|was busy|ab free|free now)\b/.test(low);

  let buyer_type = "explorer";

  if (ghostEligible && userTurns <= 3 && comeback) {
    buyer_type = "ghosted_return_lead";
  } else if (/\b(scam|fake|fraud|proof|trust|doubt|bharosa|guarantee|really work|kisne kiya)\b/.test(low)) {
    buyer_type = "skeptic";
  } else if (
    /\b(payment|pay now|advance|book slot|invoice|upi|razorpay|start today|abhi start|aaj hi)\b/.test(low) ||
    (/\b(call|phone)\b/.test(low) && /\b(today|abhi|now|aaj)\b/.test(low))
  ) {
    buyer_type = "fast_buyer";
  } else if (/\b(cheap|sasta|kam budget|low budget|affordable|student|kam paise|price kam|discount)\b/.test(low)) {
    buyer_type = "budget_buyer";
  } else if ((raw.match(/\?/g) || []).length >= 2 && score < 42) {
    buyer_type = "explorer";
  }

  let objection_type = null;
  if (/\b(expensive|costly|high price|too much|mehenga|mahenga|price high|budget low)\b/.test(low)) {
    objection_type = "expensive";
  } else if (/\b(later|baad me|bad me|next month|next week|phir|not today|abhi nahi)\b/.test(low)) {
    objection_type = "later";
  } else if (/\b(trust|proof|real|genuine|fake|scam|bharosa|guarantee|reviews?)\b/.test(low)) {
    objection_type = "trust";
  } else if (/\b(not now|no need|nahi chahiye|skip|not interested|mat karo)\b/.test(low)) {
    objection_type = "not_now";
  }

  const profile = `${low} ${String(leadMemory?.business_type || "").toLowerCase()} ${String(leadMemory?.service_interest || "").toLowerCase()}`;
  let industry = "general";
  if (/\b(salon|beauty|spa|hair|makeup)\b/.test(profile)) industry = "salon";
  else if (/\b(gym|fitness|trainer|workout)\b/.test(profile)) industry = "gym";
  else if (/\b(clinic|doctor|hospital|dental|physio)\b/.test(profile)) industry = "clinic";
  else if (/\b(real estate|realtor|property|builder|broker)\b/.test(profile)) industry = "real_estate";
  else if (/\b(ecommerce|e-commerce|shopify|d2c|online store|amazon)\b/.test(profile)) industry = "ecommerce";

  const hot_lead = intent_band === "hot" || buyer_type === "fast_buyer";
  const buying_intent = hasBuyingIntentKeyword || /\b(advance|invoice|upi|razorpay)\b/.test(low);

  return { buyer_type, intent_score: score, intent_band, hot_lead, buying_intent, objection_type, industry };
}
