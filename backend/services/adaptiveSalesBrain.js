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
 * @returns {{ buyer_type: string, intent_score: number }}
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

  score = Math.min(100, Math.max(0, Math.round(score)));

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

  return { buyer_type, intent_score: score };
}
