const FALLBACK_USAGE_TODAY = { tokens: 18420, requests: 126 };
const FALLBACK_OPENAI_MONTHLY_COST_INR = 9420;
const FALLBACK_CALLING_COST_INR = Number(process.env.NEXT_PUBLIC_EXOTEL_MONTHLY_INR || process.env.EXOTEL_MONTHLY_INR || 2200);
const FALLBACK_VOICE_COST_INR = Number(
  process.env.NEXT_PUBLIC_ELEVENLABS_MONTHLY_INR || process.env.ELEVENLABS_MONTHLY_INR || 1650,
);

function toSafeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function formatInr(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    toSafeNumber(value),
  );
}

export function estimateUsageAndCost(summary = {}) {
  const totalLeads = Math.max(0, toSafeNumber(summary.total_leads));
  const conversions = Math.max(0, toSafeNumber(summary.booked_calls));
  const openAiCost = Math.max(FALLBACK_OPENAI_MONTHLY_COST_INR, toSafeNumber(summary.openai_monthly_cost_inr, FALLBACK_OPENAI_MONTHLY_COST_INR));
  const callingCost = Math.max(0, FALLBACK_CALLING_COST_INR);
  const voiceCost = Math.max(0, FALLBACK_VOICE_COST_INR);
  const totalMonthlyCost = openAiCost + callingCost + voiceCost;

  return {
    usageToday: FALLBACK_USAGE_TODAY,
    openAiCost,
    callingCost,
    voiceCost,
    totalMonthlyCost,
    costPerLead: totalLeads > 0 ? totalMonthlyCost / totalLeads : 0,
    costPerConversion: conversions > 0 ? totalMonthlyCost / conversions : 0,
  };
}

