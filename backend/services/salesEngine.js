import {
  fetchSalesOpportunityByPhone,
  insertLeadEvent,
  upsertLeadRecord,
  upsertSalesOpportunity,
} from "./supabase.js";
import { log } from "../utils/logger.js";
import { trackPhaseDAnalytics } from "./phaseDAnalytics.js";

const QUAL_STATES = new Set(["unqualified", "engaged", "qualified", "proposal_sent", "closed_won", "closed_lost"]);

export function computeQualificationState(signals = {}) {
  if (signals.payment_intent || signals.ready_to_buy) return "proposal_sent";
  if (signals.budget && signals.need && signals.timeline) return "qualified";
  if (signals.replied || signals.interested) return "engaged";
  return "unqualified";
}

export function hotLead(signals = {}) {
  const intent = Number(signals.intent_score);
  if (Number.isFinite(intent) && intent > 70) return true;
  const budget = Number(signals.budget || 0);
  if (signals.ready_to_buy) return true;
  if (budget >= Number(process.env.HOT_LEAD_BUDGET_MIN || 30000)) return true;
  if (signals.urgency && budget > 0) return true;
  return false;
}

export async function updateQualification(phone, incoming = {}) {
  const prevOpp = await fetchSalesOpportunityByPhone(phone);
  const prevState = String(prevOpp?.qualification_state || "");
  const prevHot = Boolean(prevOpp?.hot);

  const state = QUAL_STATES.has(incoming.state)
    ? incoming.state
    : computeQualificationState(incoming);
  const now = new Date().toISOString();

  const stageMap = {
    unqualified: "new",
    engaged: "contacted",
    qualified: "qualified",
    proposal_sent: "proposal",
    closed_won: "closed_won",
    closed_lost: "closed_lost",
  };

  const stage = stageMap[state] || "new";
  const isHot = hotLead(incoming);
  const intentScore = Number(incoming.intent_score);
  const nextFollowupAt =
    state === "closed_won" || state === "closed_lost"
      ? null
      : new Date(Date.now() + (isHot ? 60 : 180) * 60 * 1000).toISOString();

  const leadRow = {
    phone,
    status: stage,
    budget: incoming.budget ?? null,
    urgency: Boolean(incoming.urgency),
    service: incoming.service || null,
    updated_at: now,
  };
  if (isHot) {
    leadRow.temperature = "hot";
    if (Number.isFinite(intentScore)) {
      leadRow.ai_score = Math.round(intentScore);
    }
  }
  await upsertLeadRecord(leadRow);

  await upsertSalesOpportunity({
    phone,
    stage,
    qualification_state: state,
    budget: incoming.budget ?? null,
    urgency: Boolean(incoming.urgency),
    service: incoming.service || null,
    hot: isHot,
    next_followup_at: nextFollowupAt,
    updated_at: now,
  });

  await insertLeadEvent({
    phone,
    event_type: "qualification_updated",
    event_value: state,
    payload: incoming,
    created_at: now,
  });

  if (isHot) {
    log.info("hot_lead_handoff_alert", {
      phone: `${String(phone).slice(0, 4)}…`,
      state,
      budget: incoming.budget ?? null,
    });
  }

  const niche = incoming.service || null;
  const metaBase = {
    buyer_type: incoming.buyer_type,
    intent_score: incoming.intent_score,
    niche,
    language: incoming.language || null,
  };

  if (state === "qualified" && prevState !== "qualified") {
    await trackPhaseDAnalytics({ phone, event_type: "qualified", meta: metaBase });
  }
  if (isHot && !prevHot) {
    await trackPhaseDAnalytics({ phone, event_type: "hot_lead", meta: metaBase });
  }
  if (state === "closed_won" && prevState !== "closed_won") {
    await trackPhaseDAnalytics({ phone, event_type: "closed_won", meta: metaBase });
  }
  if (state === "closed_lost" && prevState !== "closed_lost") {
    await trackPhaseDAnalytics({ phone, event_type: "closed_lost", meta: metaBase });
  }

  return { ok: true, state, stage, hot: isHot, next_followup_at: nextFollowupAt };
}
