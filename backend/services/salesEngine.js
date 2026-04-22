import { insertLeadEvent, upsertLeadRecord, upsertSalesOpportunity } from "./supabase.js";
import { log } from "../utils/logger.js";

const QUAL_STATES = new Set(["unqualified", "engaged", "qualified", "proposal_sent", "closed_won", "closed_lost"]);

export function computeQualificationState(signals = {}) {
  if (signals.payment_intent || signals.ready_to_buy) return "proposal_sent";
  if (signals.budget && signals.need && signals.timeline) return "qualified";
  if (signals.replied || signals.interested) return "engaged";
  return "unqualified";
}

export function hotLead(signals = {}) {
  const budget = Number(signals.budget || 0);
  if (signals.ready_to_buy) return true;
  if (budget >= Number(process.env.HOT_LEAD_BUDGET_MIN || 30000)) return true;
  if (signals.urgency && budget > 0) return true;
  return false;
}

export async function updateQualification(phone, incoming = {}) {
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
  const nextFollowupAt =
    state === "closed_won" || state === "closed_lost"
      ? null
      : new Date(Date.now() + (isHot ? 60 : 180) * 60 * 1000).toISOString();

  await upsertLeadRecord({
    phone,
    status: stage,
    budget: incoming.budget ?? null,
    urgency: Boolean(incoming.urgency),
    service: incoming.service || null,
    updated_at: now,
  });

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
  return { ok: true, state, stage, hot: isHot, next_followup_at: nextFollowupAt };
}
