/**
 * Phase D: weekly rollups from `lead_events` → `conversion_metrics` + founder-facing summary text.
 */

import { log } from "../utils/logger.js";
import {
  fetchLeadEventsSince,
  fetchPromptPerformanceSince,
  insertConversionMetric,
} from "./supabase.js";

function isoWeekKey(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function inc(obj, key, n = 1) {
  const k = String(key || "unknown");
  obj[k] = (obj[k] || 0) + n;
}

function analyzeEvents(events) {
  const typeCounts = {};
  const ctaCounts = {};
  const nicheCounts = {};
  const styleCounts = {};
  const languageCounts = {};
  let inbound = 0;
  let replied = 0;
  let firstReplies = 0;
  let totalMsgs = 0;

  for (const ev of events || []) {
    const t = String(ev?.event_type || "").trim();
    if (!t) continue;
    totalMsgs += 1;
    const canon = t === "phase_c_followup_sent" ? "followup_sent" : t;
    inc(typeCounts, canon);
    const p = ev?.payload && typeof ev.payload === "object" ? ev.payload : {};
    if (t === "inbound_message") inbound += 1;
    if (t === "replied") {
      replied += 1;
      if (p.is_first_reply) firstReplies += 1;
      if (p.cta_used) inc(ctaCounts, p.cta_used);
      if (p.response_style) inc(styleCounts, p.response_style);
    }
    if (p.niche) inc(nicheCounts, p.niche);
    if (p.language) inc(languageCounts, p.language);
  }

  const topKeys = (obj, limit = 5) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ") || "—";

  const dropoff =
    inbound > 0 ? `${Math.round((1 - replied / inbound) * 100)}% no bot reply yet (inbound→replied)` : "n/a";

  const q = Number(typeCounts.qualified || 0);
  const hot = Number(typeCounts.hot_lead || 0);
  const won = Number(typeCounts.closed_won || 0);
  const dropoffStages =
    inbound > 0
      ? `rough funnel: inbound ${inbound} → replied ${replied} → qualified ${q} → hot ${hot} → won ${won}`
      : "n/a";

  return {
    typeCounts,
    top_ctas: topKeys(ctaCounts),
    top_niches: topKeys(nicheCounts),
    top_reply_styles: topKeys(styleCounts),
    top_languages: topKeys(languageCounts),
    inbound,
    replied,
    first_replies: firstReplies,
    dropoff_summary: dropoff,
    dropoff_stage_line: dropoffStages,
    total_events: totalMsgs,
  };
}

function analyzePromptRows(rows) {
  const topExcerpts = (predicate, limit = 4) => {
    const m = {};
    for (const r of rows || []) {
      if (!predicate(r)) continue;
      const k = String(r.reply_excerpt || "")
        .trim()
        .slice(0, 96);
      if (k.length < 10) continue;
      m[k] = (m[k] || 0) + 1;
    }
    return (
      Object.entries(m)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([k, v]) => `${v}x ${k}`)
        .join(" | ") || "—"
    );
  };

  return {
    top_first_reply_copy: topExcerpts(
      (r) => r.is_first_reply === true || String(r.outcome_hint || "") === "first_reply"
    ),
    top_followup_copy: topExcerpts(
      (r) =>
        String(r.outcome_hint || "") === "followup_sent" || /followup|scheduler/i.test(String(r.source || ""))
    ),
  };
}

export function mergePhaseDAnalysis(events, promptRows) {
  return { ...analyzeEvents(events), ...analyzePromptRows(promptRows) };
}

function formatFounderReport(analysis, periodDays) {
  const tc = analysis.typeCounts || {};
  const lines = [
    "Weekly Optimization Report",
    `(last ${periodDays}d; lead_events + prompt_performance)`,
    "",
    "Funnel mix:",
    `- inbound: ${tc.inbound_message || 0}`,
    `- replied: ${tc.replied || 0}`,
    `- qualified: ${tc.qualified || 0}`,
    `- hot_lead: ${tc.hot_lead || 0}`,
    `- followup_sent: ${tc.followup_sent || 0}`,
    `- call_requested: ${tc.call_requested || 0}`,
    `- payment_intent: ${tc.payment_intent || 0}`,
    `- closed_won: ${tc.closed_won || 0}`,
    `- closed_lost: ${tc.closed_lost || 0}`,
    "",
    "Top CTAs (from reply metadata):",
    analysis.top_ctas,
    "",
    "Best first-reply copy (excerpts, by frequency):",
    analysis.top_first_reply_copy || "—",
    "",
    "Best follow-up copy (excerpts):",
    analysis.top_followup_copy || "—",
    "",
    "Top niches (from metadata):",
    analysis.top_niches,
    "",
    "Top reply styles:",
    analysis.top_reply_styles,
    "",
    "Top languages:",
    analysis.top_languages,
    "",
    "Drop-off signal (rough):",
    analysis.dropoff_summary,
    "",
    "Drop-off checkpoints:",
    analysis.dropoff_stage_line,
    "",
    "First-reply wins counted:",
    String(analysis.first_replies || 0),
    "",
    "Tip: compare \"Top CTAs\" with downstream won/lost; A/B one CTA label at a time.",
  ];
  return lines.join("\n").slice(0, 3900);
}

/** Live report for founder WhatsApp command (no persistence required). */
export async function buildWeeklyOptimizationReportForFounder() {
  const days = Math.max(1, Number.parseInt(process.env.PHASE_D_REPORT_LOOKBACK_DAYS || "7", 10) || 7);
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [events, prompts] = await Promise.all([
    fetchLeadEventsSince(since, 12000),
    fetchPromptPerformanceSince(since, 6000),
  ]);
  const analysis = mergePhaseDAnalysis(events, prompts);
  return formatFounderReport(analysis, days);
}

export async function runWeeklyOptimizationJob() {
  if (process.env.PHASE_D_WEEKLY_OPTIMIZER === "0") {
    log.debug("phase_d_weekly_optimizer_disabled");
    return { ok: false, skipped: true };
  }
  const days = Math.max(1, Number.parseInt(process.env.PHASE_D_REPORT_LOOKBACK_DAYS || "7", 10) || 7);
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const until = new Date().toISOString();
  const [events, prompts] = await Promise.all([
    fetchLeadEventsSince(since, 12000),
    fetchPromptPerformanceSince(since, 6000),
  ]);
  const analysis = mergePhaseDAnalysis(events, prompts);
  await insertConversionMetric({
    period_start: since,
    period_end: until,
    scope: "global",
    metric_key: "weekly_rollups_v1",
    metric_value: Number(analysis.replied || 0),
    dimensions: { ...analysis, generated_at: until, week: isoWeekKey(new Date()) },
    created_at: until,
  });
  log.info("phase_d_weekly_optimizer_complete", {
    events: events.length,
    prompts: prompts.length,
    replied: analysis.replied,
    inbound: analysis.inbound,
  });
  return { ok: true, analysis };
}

/** Call from scheduler tick (Monday ~03:00–03:25 UTC once per ISO week key). */
export function maybeRunPhaseDWeekly() {
  if (process.env.PHASE_D_WEEKLY_OPTIMIZER === "0") return;
  const d = new Date();
  if (d.getUTCDay() !== 1) return;
  if (d.getUTCHour() !== 3) return;
  if (d.getUTCMinutes() > 25) return;
  const key = isoWeekKey(d);
  if (globalThis.__stratxcelPhaseDWeekKey === key) return;
  globalThis.__stratxcelPhaseDWeekKey = key;
  runWeeklyOptimizationJob().catch((err) => {
    log.warn("runWeeklyOptimizationJob failed", { err: err?.message || String(err) });
  });
}
