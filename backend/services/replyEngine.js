import { inferCtaFromReply, inferResponseStyle, savePhaseDPromptPerformance, trackPhaseDAnalytics } from "./phaseDAnalytics.js";

export async function recordPhaseDBotTurn({ phone, replyText, source, adaptive, niche, lang, userTurnCount }) {
  const cta = inferCtaFromReply(replyText);
  const style = inferResponseStyle(replyText);
  const excerpt = String(replyText || "").slice(0, 280);
  const isFirst = userTurnCount === 1;
  await trackPhaseDAnalytics({
    phone,
    event_type: "replied",
    meta: {
      buyer_type: adaptive.buyer_type,
      intent_score: adaptive.intent_score,
      niche,
      language: lang,
      cta_used: cta,
      response_style: style,
      is_first_reply: isFirst,
      reply_excerpt: excerpt,
    },
  });
  await savePhaseDPromptPerformance({
    phone: String(phone),
    reply_excerpt: String(replyText || "").slice(0, 320),
    buyer_type: adaptive.buyer_type ?? null,
    intent_score: Number.isFinite(Number(adaptive.intent_score)) ? Math.round(Number(adaptive.intent_score)) : null,
    niche,
    language: lang,
    cta_used: cta,
    response_style: style,
    is_first_reply: isFirst,
    source,
    outcome_hint: isFirst ? "first_reply" : "replied",
    created_at: new Date().toISOString(),
  });
}
