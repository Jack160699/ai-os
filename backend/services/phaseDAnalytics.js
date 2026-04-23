/**
 * Phase D: structured funnel analytics on top of `lead_events` + `prompt_performance`.
 */

import { insertLeadEvent, insertPromptPerformanceRow } from "./supabase.js";
import { log } from "../utils/logger.js";

export const PHASE_D_EVENT_TYPES = new Set([
  "inbound_message",
  "replied",
  "qualified",
  "hot_lead",
  "followup_sent",
  "call_requested",
  "payment_intent",
  "closed_won",
  "closed_lost",
  "founder_decision_action",
]);

function enabled() {
  return process.env.PHASE_D_ANALYTICS_ENABLED !== "0";
}

export function inferCtaFromReply(text) {
  const t = String(text || "").toLowerCase();
  if (/reply with a number|reply with number/.test(t)) return "number_pick_menu";
  if (/quick call|call today|book a call|schedule a call/.test(t)) return "quick_call_cta";
  if (/want (me )?to share|want examples|3 options|best package/.test(t)) return "options_or_examples_cta";
  if (/reply yes|say yes|yes and/.test(t)) return "yes_commit_cta";
  if (/payment link|pay now|invoice|upi/.test(t)) return "payment_path_cta";
  if (/\?\s*$/.test(String(text || "").trim())) return "question_close";
  return "general_soft_cta";
}

export function inferResponseStyle(text) {
  const s = String(text || "");
  if (/✅|🔥|🚀|📈|👋|👍|👌|😊/.test(s)) return "emoji_structured";
  if (/\n\s*\n/.test(s) && s.split("\n").length >= 4) return "multi_paragraph";
  if (s.length < 120) return "short_punchy";
  return "balanced";
}

function cleanMeta(meta = {}) {
  const out = {};
  if (meta.buyer_type != null) out.buyer_type = String(meta.buyer_type);
  if (meta.intent_score != null && Number.isFinite(Number(meta.intent_score))) {
    out.intent_score = Math.round(Number(meta.intent_score));
  }
  if (meta.niche != null) out.niche = String(meta.niche).slice(0, 120);
  if (meta.language != null) out.language = String(meta.language).slice(0, 32);
  if (meta.cta_used != null) out.cta_used = String(meta.cta_used).slice(0, 120);
  if (meta.response_style != null) out.response_style = String(meta.response_style).slice(0, 64);
  if (meta.source != null) out.source = String(meta.source).slice(0, 64);
  if (meta.reply_excerpt != null) out.reply_excerpt = String(meta.reply_excerpt).slice(0, 280);
  if (meta.is_first_reply != null) out.is_first_reply = Boolean(meta.is_first_reply);
  if (meta.followup_variant != null) out.followup_variant = String(meta.followup_variant).slice(0, 64);
  if (meta.extra && typeof meta.extra === "object") out.extra = meta.extra;
  return out;
}

export async function savePhaseDPromptPerformance(row) {
  if (!enabled()) return;
  try {
    await insertPromptPerformanceRow(row);
  } catch (err) {
    log.warn("savePhaseDPromptPerformance failed", { err: err?.message || String(err) });
  }
}

export async function trackPhaseDAnalytics({ phone, event_type, meta = {} }) {
  if (!enabled()) return;
  if (!phone || !PHASE_D_EVENT_TYPES.has(event_type)) {
    log.debug("phase_d_track_skip", { phone: Boolean(phone), event_type });
    return;
  }
  const now = new Date().toISOString();
  const payload = cleanMeta(meta);
  try {
    await insertLeadEvent({
      phone: String(phone),
      event_type,
      event_value: String(meta.headline || event_type).slice(0, 500),
      payload,
      created_at: now,
    });
  } catch (err) {
    log.warn("trackPhaseDAnalytics failed", { err: err?.message || String(err), event_type });
  }
}

export async function trackFounderDecisionAction({ phone, reflection }) {
  if (!enabled()) return;
  const r = reflection || {};
  return trackPhaseDAnalytics({
    phone,
    event_type: "founder_decision_action",
    meta: {
      headline: String(r.problem_detected || "founder_decision_action"),
      source: r.source || "typed",
      extra: {
        problem_detected: r.problem_detected || null,
        secondary_problem: r.secondary_problem || null,
        action_suggested: r.action_suggested || null,
        backup_action: r.backup_action || null,
        certainty: r.certainty ?? null,
        founder_message: r.founder_message || null,
      },
    },
  });
}
