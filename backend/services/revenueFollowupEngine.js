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
  if (Number.isFinite(score) && score > 70) return 6 * HOUR_MS;
  const bt = String(lm.buyer_type || "").toLowerCase();
  if (bt === "fast_buyer") return 6 * HOUR_MS;
  if (bt === "skeptic") return DAY_MS;
  if (bt === "budget_buyer") return 2 * DAY_MS;
  if (bt === "ghosted_return_lead") return 3 * DAY_MS;
  return 7 * DAY_MS;
}

export function buildPhaseCFollowupMessage(leadMemory) {
  const lm = leadMemory || {};
  const bt = String(lm.buyer_type || "explorer").toLowerCase();
  const hint = String(lm.last_summary || "").trim().slice(0, 160);
  const tail = hint ? `\n\nEarlier you mentioned: "${hint}"` : "";

  if (bt === "fast_buyer" || (Number.isFinite(Number(lm.intent_score)) && Number(lm.intent_score) > 70)) {
    return `Quick ping 👋 Still want to move forward today?${tail}\n\nReply YES and I'll share the clean next step + timeline 🚀`.trim();
  }
  if (bt === "skeptic") {
    return `Hey — totally get wanting clarity before next steps.${tail}\n\nWant a simple breakdown of how we work + what to expect (no pressure)? 👍`.trim();
  }
  if (bt === "budget_buyer") {
    return `Checking in 👋${tail}\n\nIf budget's tight, we can start small and still get momentum. Want 2–3 starter options that fit?`.trim();
  }
  if (bt === "ghosted_return_lead") {
    return `Welcome back 👋${tail}\n\nWhenever you're ready, tell me your #1 goal right now and I'll suggest the fastest path.`.trim();
  }
  return `Gentle follow-up from Stratxcel 👋${tail}\n\nWhat would help you most this week — leads, website polish, or something else?`.trim();
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
    if (isClosedStage(lm.stage)) continue;
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
    const nextAt = new Date(Date.now() + Math.max(delay, gap)).toISOString();

    await saveMessage(phone, msg, "bot");
    await upsertLeadMemory(phone, {
      last_followup_sent_at: now,
      next_followup_at: nextAt,
    });

    await insertLeadEvent({
      phone,
      event_type: "phase_c_followup_sent",
      event_value: String(lm.buyer_type || "unknown"),
      payload: { intent_score: lm.intent_score, stage: lm.stage, next_followup_at: nextAt },
      created_at: now,
    });
  }

  log.info("phase_c_followup_sweep", { due: due.length, sent });
  return { ok: true, due: due.length, sent };
}
