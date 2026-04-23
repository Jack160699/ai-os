/**
 * Phase C: revenue follow-ups driven by `lead_memory` (buyer_type, intent_score, stage, timestamps).
 */

import { isOwnerNumber } from "./ceoBridge.js";
import { log } from "../utils/logger.js";
import {
  fetchLeadMemoryDueFollowups,
  fetchRecentMessages,
  getLeadMemory,
  insertLeadEvent,
  saveMessage,
  upsertLeadMemory,
} from "./supabase.js";
import { sendWhatsApp } from "./whatsapp.js";
import { inferCtaFromReply, inferResponseStyle, savePhaseDPromptPerformance } from "./phaseDAnalytics.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function minGapMs() {
  const h = Math.max(1, Number.parseInt(process.env.PHASE_C_MIN_HOURS_BETWEEN_FOLLOWUPS || "24", 10) || 24);
  return h * HOUR_MS;
}

/** Delay from “last bot touch” until the next scheduled engine ping. */
export function computePhaseCFollowupDelayMs(leadMemory) {
  const lm = leadMemory || {};
  const score = Number(lm.intent_score);
  const stage = String(lm.stage || "").toLowerCase();
  if (stage === "qualified" || stage === "proposal_sent") return 3 * HOUR_MS;
  if (Number.isFinite(score) && score > 78) return 4 * HOUR_MS;
  if (Number.isFinite(score) && score > 70) return 6 * HOUR_MS;
  const bt = String(lm.buyer_type || "").toLowerCase();
  if (bt === "fast_buyer") return 6 * HOUR_MS;
  if (bt === "skeptic") return DAY_MS;
  if (bt === "budget_buyer") return 2 * DAY_MS;
  if (bt === "ghosted_return_lead") return 3 * DAY_MS;
  return 7 * DAY_MS;
}

function readMemoryTag(summary, tag) {
  const s = String(summary || "");
  const m = s.match(new RegExp(`\\[${String(tag)}:([^\\]]+)\\]`));
  return m?.[1] ? m[1].trim() : "";
}

export function buildPhaseCFollowupMessage(leadMemory) {
  const lm = leadMemory || {};
  const onboardingPending = readMemoryTag(lm.last_summary, "onboarding_pending") === "1";
  if (onboardingPending) {
    return [
      "Quick onboarding reminder.",
      "Share your business name, assets link, and first 14-day goal.",
      "Once shared, setup moves immediately.",
    ].join("\n");
  }
  const bt = String(lm.buyer_type || "explorer").toLowerCase();
  const hint = String(lm.last_summary || "").trim().slice(0, 160);
  const need = readMemoryTag(lm.last_summary, "need");
  const objection = readMemoryTag(lm.last_summary, "objection");
  const service = String(lm.service_interest || "").replace(/_/g, " ").trim();
  const business = String(lm.business_type || "").replace(/_/g, " ").trim();
  const resumeLine = need ? `Resume note: continuing your ${need.replace(/_/g, " ")} priority.` : "";
  const profileLine = business || service ? `Profile fit: ${[business, service].filter(Boolean).join(" + ")}.` : "";
  const objectionLine = objection ? `Last objection handled: ${objection.replace(/_/g, " ")}.` : "";
  const tail = hint ? `\n\nEarlier you mentioned: "${hint}"` : "";

  if (bt === "fast_buyer" || (Number.isFinite(Number(lm.intent_score)) && Number(lm.intent_score) > 70)) {
    return `Quick priority follow-up 👋${tail}\n\n${resumeLine}\n${profileLine}\nAuthority note: this close flow is already working for similar businesses.\nPrice anchor is locked; your rollout plan includes timeline, support, and revisions.\nIf you're in, reply YES and I'll send your payment link now.`.trim();
  }
  if (bt === "skeptic") {
    return `Clarity follow-up 👋${tail}\n\n${resumeLine}\n${objectionLine}\nLow-risk path: milestone delivery, committed support, and revision rounds included.\nIf this works for you, reply YES and I'll lock the kickoff step.`.trim();
  }
  if (bt === "budget_buyer") {
    return `Checking in 👋${tail}\n\n${resumeLine}\nRecommendation: start with the lean ROI package now and scale after first wins.\nEthical urgency: current slots are limited this week.\nReply YES and I'll share the payment step.`.trim();
  }
  if (bt === "ghosted_return_lead") {
    return `Welcome back 👋${tail}\n\n${profileLine}\nTop path is ready: fast-start rollout with support and revisions included.\nReturning client advantage: we can add an ROI upsell once base plan is locked.\nReply YES and I'll activate the next step instantly.`.trim();
  }
  return `Follow-up from Stratxcel 👋${tail}\n\n${resumeLine}\n${profileLine}\nRecommendation is prepared for fastest ROI this week.\nIf aligned, reply YES and I'll move you to the payment step.`.trim();
}

async function threadHasPendingUserReply(phone) {
  const rows = await fetchRecentMessages(phone, 40);
  let lastUserTs = null;
  let lastBotTs = null;
  for (const r of rows) {
    const s = String(r?.sender || "").toLowerCase();
    const ts = r?.created_at ? Date.parse(String(r.created_at)) : NaN;
    if (!Number.isFinite(ts)) continue;
    if (s === "user") lastUserTs = ts;
    if (s === "bot") lastBotTs = ts;
  }
  if (lastUserTs == null) return false;
  if (lastBotTs == null) return true;
  return lastUserTs > lastBotTs;
}

function isClosedStage(stage) {
  const s = String(stage || "").toLowerCase();
  return s === "closed_won" || s === "closed_lost" || s === "lost" || s === "won";
}

/** After an organic bot reply (webhook AI path), schedule the next engine slot. */
export async function bumpLeadMemoryNextFollowupAfterBotReply(phone) {
  if (!phone) return;
  try {
    const row = await getLeadMemory(phone);
    const delay = computePhaseCFollowupDelayMs(row || {});
    const when = new Date(Date.now() + delay).toISOString();
    await upsertLeadMemory(phone, { next_followup_at: when });
  } catch (err) {
    log.warn("bumpLeadMemoryNextFollowupAfterBotReply failed", { err: err?.message || String(err), phone });
  }
}

export async function runLeadMemoryRevenueFollowupSweep(limit = 20) {
  const due = await fetchLeadMemoryDueFollowups(limit);
  let sent = 0;
  const gap = minGapMs();

  for (const lm of due) {
    const phone = String(lm?.phone || "");
    if (!phone) continue;
    const onboardingPending = readMemoryTag(lm.last_summary, "onboarding_pending") === "1";
    if (isClosedStage(lm.stage) && !onboardingPending) continue;
    if (await isOwnerNumber(phone)) continue;

    const lastSent = lm.last_followup_sent_at ? Date.parse(String(lm.last_followup_sent_at)) : NaN;
    if (Number.isFinite(lastSent) && Date.now() - lastSent < gap) continue;

    if (await threadHasPendingUserReply(phone)) continue;

    const msg = buildPhaseCFollowupMessage(lm);
    const ok = await sendWhatsApp(phone, msg);
    if (!ok) continue;

    sent += 1;
    const now = new Date().toISOString();
    const delay = computePhaseCFollowupDelayMs(lm);
    const nextAt = onboardingPending ? null : new Date(Date.now() + Math.max(delay, gap)).toISOString();

    await saveMessage(phone, msg, "bot");
    const nextSummary = onboardingPending
      ? String(lm.last_summary || "").replace(/\[onboarding_pending:1\]/g, "").trim() || null
      : undefined;
    await upsertLeadMemory(phone, {
      last_followup_sent_at: now,
      next_followup_at: nextAt,
      ...(nextSummary !== undefined ? { last_summary: nextSummary } : {}),
    });

    const niche = lm.business_type || lm.service_interest || null;
    await insertLeadEvent({
      phone,
      event_type: "phase_c_followup_sent",
      event_value: String(lm.buyer_type || "unknown"),
      payload: {
        intent_score: lm.intent_score,
        stage: lm.stage,
        next_followup_at: nextAt,
        buyer_type: lm.buyer_type,
        niche,
        language: null,
        followup_variant: `phase_c_${String(lm.buyer_type || "default")}`,
        reply_excerpt: msg.slice(0, 220),
      },
      created_at: now,
    });
    await savePhaseDPromptPerformance({
      phone,
      reply_excerpt: msg.slice(0, 320),
      buyer_type: lm.buyer_type ?? null,
      intent_score: Number.isFinite(Number(lm.intent_score)) ? Math.round(Number(lm.intent_score)) : null,
      niche,
      cta_used: inferCtaFromReply(msg),
      response_style: inferResponseStyle(msg),
      is_first_reply: false,
      source: "phase_c_followup",
      outcome_hint: "followup_sent",
      created_at: now,
    });
  }

  log.info("phase_c_followup_sweep", { due: due.length, sent });
  return { ok: true, due: due.length, sent };
}
