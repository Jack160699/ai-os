/**
 * Operator AI: turn CEO analytics into decisions + actions (WhatsApp-first).
 */

import { getDashboardCore } from "./dashboardMetrics.js";
import {
  fetchLeadMemoryForPhones,
  fetchLeadMemoryOperatorSnapshot,
  fetchLeads,
  fetchRevenueMetrics,
} from "./supabase.js";
import { loadWeeklyOptimizationAnalysis } from "./phaseDOptimizer.js";
import {
  buildSalesExecutionActionBlock,
  cacheOwnerExecutionDrafts,
} from "./salesExecutionEngine.js";

const DEFAULT_ACTION_MENU = [
  "Hot leads + drafts",
  "Weekly plan",
  "Pending follow-ups",
  "Revenue snapshot",
];

const MENU_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];
const CEO_MESSAGE_MAX = 3900;

function combineOperatorAndExecution(baseText, executionText) {
  const base = String(baseText || "").trim();
  const extra = String(executionText || "").trim();
  if (!extra) return base.slice(0, CEO_MESSAGE_MAX);
  const sep = "\n\n";
  const maxExtra = Math.max(0, CEO_MESSAGE_MAX - base.length - sep.length);
  if (maxExtra < 120) return base.slice(0, CEO_MESSAGE_MAX);
  const trimmed = extra.length > maxExtra ? `${extra.slice(0, maxExtra - 30)}\n…(drafts trimmed — open dashboard for full list)` : extra;
  return `${base}${sep}${trimmed}`.slice(0, CEO_MESSAGE_MAX);
}

function topStageProblem(stages) {
  const entries = Object.entries(stages || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  return entries[0];
}

function aggregateLeadMemoryRows(rows) {
  const n = rows.length;
  let sumIntent = 0;
  let intentN = 0;
  let highIntent = 0;
  const stages = {};
  const buyers = {};
  for (const r of rows || []) {
    const sc = Number(r.intent_score);
    if (Number.isFinite(sc)) {
      sumIntent += sc;
      intentN += 1;
      if (sc >= 70) highIntent += 1;
    }
    const st = String(r.stage || "unknown").toLowerCase();
    stages[st] = (stages[st] || 0) + 1;
    const bt = String(r.buyer_type || "unknown").toLowerCase();
    buyers[bt] = (buyers[bt] || 0) + 1;
  }
  return {
    rows_sampled: n,
    avg_intent: intentN ? Math.round(sumIntent / intentN) : 0,
    high_intent_count: highIntent,
    stages,
    buyers,
  };
}

/**
 * Build a single WhatsApp message from structured operator fields.
 * @param {object} data
 * @param {boolean} [data.insufficient]
 * @param {string[]} data.executiveSummary — 2–3 short lines
 * @param {string} data.biggestOpportunity
 * @param {string} data.biggestProblem
 * @param {string[]} data.recommendedActions — 1–2 imperative lines
 * @param {string[]} [data.actionMenu] — up to 4 labels (defaults provided)
 */
export function buildOperatorResponse(data) {
  const menu = Array.isArray(data.actionMenu) && data.actionMenu.length ? data.actionMenu : DEFAULT_ACTION_MENU;
  const exec = Array.isArray(data.executiveSummary) ? data.executiveSummary.filter(Boolean) : [];
  const actions = Array.isArray(data.recommendedActions) ? data.recommendedActions.filter(Boolean) : [];

  const lines = ["A. EXECUTIVE SUMMARY", ""];

  if (data.insufficient) {
    lines.push(
      exec[0] || "Not enough signal yet — don't optimize noise.",
      exec[1] || "Get 10 real WhatsApp convos live this week, then hit me again."
    );
  } else {
    lines.push(exec.slice(0, 3).join("\n") || "Quiet pipe — I'd force motion today, not more planning.");
  }

  lines.push("", "B. BIGGEST OPPORTUNITY", "", data.biggestOpportunity || "Intent is perishable — strike while the thread is warm.");
  lines.push("", "C. BIGGEST PROBLEM", "", data.biggestProblem || "Usually it's follow-up or offer clarity — fix one, revenue moves.");

  lines.push("", "D. RECOMMENDED ACTION", "");
  const useActions = actions.length
    ? actions.slice(0, 2)
    : ["Block 45m today: calls + paste-ready replies only.", "Fix one script (pricing or proof) before spending more on ads."];
  for (const a of useActions) {
    lines.push(`→ ${a}`);
  }

  lines.push("", "E. ACTION MENU", "");
  menu.slice(0, 4).forEach((label, i) => {
    lines.push(`${MENU_EMOJIS[i] || `${i + 1}.`} ${label}`);
  });

  return lines
    .filter((ln, idx, arr) => !(ln === "" && arr[idx - 1] === ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, CEO_MESSAGE_MAX);
}

async function loadLeadMemoryAgg() {
  const rows = await fetchLeadMemoryOperatorSnapshot(400);
  return { rows, agg: aggregateLeadMemoryRows(rows) };
}

export async function buildTodayStatsOperatorPayload() {
  const [dashboard, { agg, rows }] = await Promise.all([getDashboardCore(), loadLeadMemoryAgg()]);
  const total = Number(dashboard.funnel.total_leads || 0);
  const qualified = Number(dashboard.funnel.qualified_leads || 0);
  const won = Number(dashboard.funnel.won_leads || 0);
  const pct = Number(dashboard.funnel.conversion_rate_pct || 0);
  const qualRatio = total > 0 ? qualified / total : 0;
  const closeRatio = qualified > 0 ? won / qualified : 0;

  if (total === 0) {
    return {
      insufficient: true,
      executiveSummary: [
        "Not enough data yet — CRM shows zero active leads.",
        "Fill the top of funnel: run one acquisition push and get 10 qualified conversations logged this week.",
      ],
      biggestOpportunity: "First wins come from volume + fast replies, not dashboards. Book outbound blocks on your calendar now.",
      biggestProblem: "No pipeline visibility — you are flying blind on revenue.",
      recommendedActions: [
        "Turn on lead capture everywhere (WhatsApp + form) and route into this bot today.",
        "Reply personally to the first 5 inbound threads within 10 minutes each.",
      ],
      actionMenu: DEFAULT_ACTION_MENU,
      payload: { funnel: dashboard.funnel, lead_memory_agg: agg, lead_memory_rows: rows.length },
    };
  }

  const stageTop = topStageProblem(agg.stages);
  const exec = [
    `${total} leads live, ${qualified} qualified, ${won} closed-won — blended conversion ${pct}%.`,
    qualRatio < 0.12
      ? "Qualification is thin: most traffic is not being converted to real opportunities."
      : "Qualification is holding — push hard on the late funnel.",
    agg.high_intent_count > 0
      ? `lead_memory flags ${agg.high_intent_count} high-intent threads (avg score ${agg.avg_intent}) — treat them as cash-in-waiting.`
      : `Memory layer shows avg intent ${agg.avg_intent}; tighten prompts until you see 70+ scores spike.`,
  ];

  const biggestOpportunity =
    won > 0
      ? `Revenue is proving out (${won} wins). Double down: clone the last winning niche + CTA combo into the next 10 pitches.`
      : qualified > 0
        ? `You already have ${qualified} qualified — that is where this week's cash hides. Run tight closes, not more top-of-funnel.`
        : `Top of funnel (${total}) is the asset — convert the warmest 20% into qualified today with one sharp script.`;

  let biggestProblem = "Speed: slow follow-ups are silently killing deals after first reply.";
  if (qualRatio < 0.1) biggestProblem = "Funnel break is early: leads stall before qualification — fix discovery + intent scoring.";
  else if (closeRatio < 0.08 && qualified > 2) biggestProblem = "Funnel break is late: qualified leads are not closing — pricing, proof, or urgency is broken.";
  if (stageTop && stageTop[0] === "new" && stageTop[1] >= Math.max(3, total * 0.4)) {
    biggestProblem = `Stuck in "new": ${stageTop[1]} leads never graduate — your first-touch script is leaking money.`;
  }

  const recommendedActions = [
    qualRatio < 0.15
      ? "Rewrite the first 3 bot messages to force budget + timeline + service in one pass."
      : "Pick the top 5 qualified leads and run a 20-minute closing call block today.",
    agg.high_intent_count >= 3
      ? "Assign owners to every lead_memory 70+ score within the hour — no batching."
      : "Raise intent thresholds in copy: demand a number pick or calendar slot on first qualified reply.",
  ];

  return {
    insufficient: false,
    executiveSummary: exec,
    biggestOpportunity,
    biggestProblem,
    recommendedActions,
    actionMenu: DEFAULT_ACTION_MENU,
    payload: {
      funnel: dashboard.funnel,
      today_stats: {
        total_leads: total,
        qualified,
        won,
        conversion_rate_pct: pct,
      },
      lead_memory_agg: agg,
      lead_memory_rows: rows.length,
    },
  };
}

export async function buildHotLeadsOperatorPayload() {
  const [leads, { agg, rows: lmRows }] = await Promise.all([fetchLeads(80), loadLeadMemoryAgg()]);
  const hot = leads
    .filter((l) => String(l.temperature || "").toLowerCase() === "hot")
    .sort((a, b) => Number(b.ai_score || 0) - Number(a.ai_score || 0))
    .slice(0, 10)
    .map((l) => ({ phone: l.phone, name: l.name || l.full_name || "Lead", score: l.ai_score || 0 }));

  const phones = hot.map((h) => h.phone).filter(Boolean);
  const memByPhone = new Map();
  if (phones.length) {
    const memRows = await fetchLeadMemoryForPhones(phones, 15);
    for (const m of memRows) {
      if (m?.phone) memByPhone.set(String(m.phone), m);
    }
  }

  const payload = { hot_leads: hot, lead_memory_agg: agg, lead_memory_sample: lmRows.length };

  if (!hot.length) {
    const memHigh = agg.high_intent_count || 0;
    return {
      insufficient: false,
      executiveSummary: [
        "Zero hot flags in CRM right now — that is unacceptable if you are serious about revenue this week.",
        memHigh > 0
          ? `Contradiction: lead_memory still shows ${memHigh} high-intent profiles. Your hot scoring or follow-up discipline is off.`
          : "Memory also shows weak intent distribution — tighten qualification copy until hot leads appear.",
      ],
      biggestOpportunity: memHigh > 0
        ? "Reconcile memory vs CRM: mine those high-intent phones and force human touch today — that is found money."
        : "Turn one case study + one aggressive CTA into the bot; hot leads will pop within 48 hours if traffic is real.",
      biggestProblem: "Hot pipeline is empty — you are not extracting urgency from interested buyers.",
      recommendedActions: [
        "Pull last 20 engaged leads and call them before EOD — tag the top 3 as hot manually.",
        "Bump budget/timeline questions earlier in the WhatsApp flow.",
      ],
      actionMenu: DEFAULT_ACTION_MENU,
      payload: { ...payload, hot_leads: [] },
    };
  }

  const top = hot[0];
  const mem = memByPhone.get(String(top.phone));
  const memHint = mem?.last_summary ? String(mem.last_summary).slice(0, 120) : "";
  const exec = [
    `${hot.length} hot leads flagged — top target ${top.name} (score ${top.score}).`,
    memHint ? `Context: "${memHint}${memHint.length >= 120 ? "…" : ""}"` : "No memory blurb on the top lead — still strike first while intent is live.",
    "Rule: first human touch inside 15 minutes or you are donating deals to competitors.",
  ];

  return {
    insufficient: false,
    executiveSummary: exec,
    biggestOpportunity: "These leads already signaled heat — assign a closer and push for payment intent or calendar lock today.",
    biggestProblem: "Risk is operational: if hot leads sit in WhatsApp without ownership, you burn margin you already paid to acquire.",
    recommendedActions: [
      `Call ${top.name} now — confirm budget + decision date on the phone, then send payment link same thread.`,
      "Stand up a daily 11am hot-lead standup until conversion stabilizes.",
    ],
    actionMenu: DEFAULT_ACTION_MENU,
    payload: { ...payload, hot_leads: hot },
  };
}

export async function buildWeeklyOptimizationOperatorPayload() {
  const [{ agg, rows: lmRows }, bundle] = await Promise.all([loadLeadMemoryAgg(), loadWeeklyOptimizationAnalysis()]);
  const { analysis, days, eventsCount, promptsCount } = bundle;
  const tc = analysis.typeCounts || {};
  const inbound = Number(analysis.inbound || tc.inbound_message || 0);
  const replied = Number(analysis.replied || tc.replied || 0);
  const qualified = Number(tc.qualified || 0);
  const hot = Number(tc.hot_lead || 0);
  const won = Number(tc.closed_won || 0);
  const lost = Number(tc.closed_lost || 0);
  const fu = Number(tc.followup_sent || 0);

  const thin =
    eventsCount < 8 && promptsCount < 4 && lmRows.length < 8;

  if (thin) {
    return {
      insufficient: true,
      executiveSummary: [
        "Not enough data yet — the bot has not seen enough structured events or prompt rows this window.",
        `Window: last ${days}d. Push ~10 real prospect conversations through WhatsApp so I can run hard recommendations.`,
      ],
      biggestOpportunity: "Volume + logging: every inbound should hit lead_events with rich payloads — that is what trains the operator layer.",
      biggestProblem: "Signal starvation — you are trying to optimize noise.",
      recommendedActions: [
        "Keep Phase D analytics on and run normal traffic for one week — no shortcuts.",
        "Force one follow-up cadence for all engaged leads so followup_sent events pile up.",
      ],
      actionMenu: DEFAULT_ACTION_MENU,
      payload: { kind: "weekly_operator", days, eventsCount, promptsCount, lead_memory_rows: lmRows.length },
    };
  }

  const dropPct =
    inbound > 0 ? Math.round((1 - Math.min(replied, inbound) / inbound) * 100) : null;
  const exec = [
    `Last ${days}d: ${inbound} inbound → ${replied} bot replies → ${qualified} qualified → ${hot} hot → ${won} won (${lost} lost).`,
    dropPct != null
      ? `Reply coverage gap ~${dropPct}% (inbound→replied) — that is either traffic quality or bot uptime.`
      : "Reply coverage still building — prioritize first-response completeness.",
    `lead_memory sample: ${lmRows.length} rows, avg intent ${agg.avg_intent}, ${agg.high_intent_count} high-intent profiles.`,
  ];

  let biggestOpportunity = `Best monetization path: scale what already wins — top niches look like: ${analysis.top_niches || "diversify"}.`;
  if (String(analysis.top_ctas || "").includes("quick_call")) {
    biggestOpportunity =
      "Call CTAs are showing up strong — push calendar-first closes; money follows conversations, not PDFs.";
  } else if (won > 0 && hot > won) {
    biggestOpportunity = "You are manufacturing heat faster than closes — harvest hot_lead events into invoices this week.";
  }

  let biggestProblem =
    dropPct != null && dropPct > 35
      ? `Funnel break at first response (~${dropPct}% inbound without solid reply metadata). Fix bot coverage or shorten first reply.`
      : qualified > 0 && hot < Math.max(1, Math.floor(qualified * 0.15))
        ? "Mid-funnel stall: qualified is not converting to hot — tighten proof + urgency in the second touch."
        : lost > won && lost > 0
          ? "You are losing more than you win in this window — inspect closed_lost reasons and kill the weak offer."
          : "Follow-up density may be low relative to engaged leads — tighten Phase C + scheduler discipline.";

  if (fu < qualified * 0.2 && qualified > 2) {
    biggestProblem = "Follow-ups are under-fired vs qualified stock — you are leaving money on the table after qualification.";
  }

  const recommendedActions = [
    `Ship one A/B: double down on CTA style "${String(analysis.top_ctas || "").split(",")[0] || "question_close"}" vs your runner-up for 48h.`,
    agg.high_intent_count > 5
      ? "Route all lead_memory 70+ scores to human same-day — automation already did its job."
      : "Increase intent scoring aggressiveness in adaptive brain until hot_lead events rise.",
  ];

  return {
    insufficient: false,
    executiveSummary: exec,
    biggestOpportunity,
    biggestProblem,
    recommendedActions,
    actionMenu: DEFAULT_ACTION_MENU,
    payload: {
      kind: "weekly_operator",
      days,
      analysis_summary: {
        top_ctas: analysis.top_ctas,
        top_niches: analysis.top_niches,
        dropoff_summary: analysis.dropoff_summary,
        typeCounts: tc,
      },
      lead_memory_agg: agg,
      eventsCount,
      promptsCount,
    },
  };
}

export async function renderOperatorCeoMessage(intent, ownerPhone) {
  if (intent === "today stats") {
    const data = await buildTodayStatsOperatorPayload();
    const base = buildOperatorResponse(data);
    const exec = await buildSalesExecutionActionBlock(intent);
    if (exec.suggestions?.length && ownerPhone) {
      cacheOwnerExecutionDrafts(ownerPhone, exec.suggestions, intent);
    }
    return {
      text: combineOperatorAndExecution(base, exec.text),
      payload: { ...data.payload, execution_suggestions: exec.suggestions },
    };
  }
  if (intent === "hot leads") {
    const data = await buildHotLeadsOperatorPayload();
    const base = buildOperatorResponse(data);
    const exec = await buildSalesExecutionActionBlock(intent);
    if (exec.suggestions?.length && ownerPhone) {
      cacheOwnerExecutionDrafts(ownerPhone, exec.suggestions, intent);
    }
    return {
      text: combineOperatorAndExecution(base, exec.text),
      payload: { ...data.payload, execution_suggestions: exec.suggestions },
    };
  }
  if (intent === "weekly optimization report") {
    const data = await buildWeeklyOptimizationOperatorPayload();
    const base = buildOperatorResponse(data);
    const exec = await buildSalesExecutionActionBlock(intent);
    if (exec.suggestions?.length && ownerPhone) {
      cacheOwnerExecutionDrafts(ownerPhone, exec.suggestions, intent);
    }
    return {
      text: combineOperatorAndExecution(base, exec.text),
      payload: { ...data.payload, execution_suggestions: exec.suggestions },
    };
  }
  return null;
}

function countWarmAgingLeads(lmRows) {
  const now = Date.now();
  let n = 0;
  for (const m of lmRows || []) {
    const st = String(m.stage || "").toLowerCase();
    if (/closed|won|lost/.test(st)) continue;
    const intent = Number(m.intent_score) || 0;
    if (intent < 35 || intent >= 75) continue;
    const lc = m.last_contacted_at ? Date.parse(String(m.last_contacted_at)) : NaN;
    if (!Number.isFinite(lc) || now - lc > 36 * 3600000) n += 1;
  }
  return n;
}

/** Founder daily entry — compact, actionable, routes to other commands. */
export async function buildMorningBriefOperatorMessage() {
  const [dashboard, leads, lmSnap, rev] = await Promise.all([
    getDashboardCore(),
    fetchLeads(80),
    fetchLeadMemoryOperatorSnapshot(350),
    fetchRevenueMetrics(),
  ]);
  const total = Number(dashboard.funnel.total_leads || 0);
  const hotN = leads.filter((l) => String(l.temperature || "").toLowerCase() === "hot").length;
  const warmAging = countWarmAgingLeads(lmSnap);
  const paid = Number(rev.paid_amount_rupees || 0);
  const base = paid > 8000 ? paid : 32000;
  const low = Math.max(12000, Math.round(base * 0.3));
  const high = Math.max(low + 8000, Math.round(base * 0.75));

  const priority =
    hotN >= 2
      ? `Close ${Math.min(2, hotN)} hot lead${Math.min(2, hotN) > 1 ? "s" : ""} first — rest waits.`
      : hotN === 1
        ? "One HOT lead — hit it before noon. Momentum > meetings."
        : total > 0
          ? "No HOT flags yet — I'd fix first-touch + follow-up before buying more reach."
          : "Pipe's empty — fill it before we tune copy.";

  const risk =
    warmAging >= 3
      ? `${warmAging} warm leads aging (quiet > ~36h on intent 35–74).`
      : warmAging > 0
        ? `${warmAging} warm thread(s) drifting — nudge today.`
        : "Silent threads after 48h = dead money. Watch your inbox.";

  return [
    "Good morning.",
    "",
    "Today's priority:",
    priority,
    "",
    "Revenue opportunity (rough band):",
    `₹${low.toLocaleString("en-IN")}–₹${high.toLocaleString("en-IN")} (heuristic from paid + pipe — not a quote).`,
    "",
    "Risk:",
    risk,
    "",
    "Choose:",
    "1️⃣ Show Hot Leads → `hot leads`",
    "2️⃣ Growth Plan → `weekly optimization report`",
    "3️⃣ Follow-up Now → `pending followups`",
    "4️⃣ Revenue Moves → `revenue`",
  ]
    .join("\n")
    .slice(0, CEO_MESSAGE_MAX);
}
