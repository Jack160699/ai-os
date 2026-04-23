/**
 * Operator AI: turn CEO analytics into decisions + actions (WhatsApp-first).
 */

import { getDashboardCore } from "./dashboardMetrics.js";
import { fetchLeadMemoryOperatorSnapshot, fetchLeads, fetchRevenueMetrics } from "./supabase.js";
import { loadWeeklyOptimizationAnalysis } from "./phaseDOptimizer.js";
import {
  buildSalesExecutionActionBlock,
  cacheOwnerExecutionDrafts,
} from "./salesExecutionEngine.js";
import { getFounderPersonalizationLines } from "./founderOperatorMemory.js";

const MENU_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];
const CEO_MESSAGE_MAX = 3900;
const INTERACTIVE_BODY_MAX = 1000;

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

function pickQuickOptions(intent, hints, data) {
  const h = hints || {};
  if (intent === "today stats") {
    if (h.pipe_empty || data.insufficient) {
      return ["morning brief", "today stats", "weekly optimization report", "hot leads"];
    }
    if (h.conversion_soft) {
      return ["weekly optimization report", "hot leads", "pending followups", "morning brief"];
    }
    if (h.high_intent) {
      return ["hot leads", "today stats", "pending followups", "revenue"];
    }
    return ["hot leads", "morning brief", "today stats", "revenue"];
  }
  if (intent === "hot leads") {
    if (h.has_hot) {
      return ["drafts preview", "pending followups", "today stats", "morning brief"];
    }
    if (h.ghost_hot) {
      return ["today stats", "weekly optimization report", "hot leads", "morning brief"];
    }
    return ["today stats", "weekly optimization report", "morning brief", "revenue"];
  }
  if (intent === "weekly optimization report") {
    if (h.thin || data.insufficient) {
      return ["today stats", "hot leads", "morning brief", "revenue"];
    }
    if (h.drop_hard) {
      return ["today stats", "pending followups", "hot leads", "morning brief"];
    }
    if (h.mid_funnel) {
      return ["hot leads", "pending followups", "today stats", "morning brief"];
    }
    return ["hot leads", "today stats", "revenue", "morning brief"];
  }
  return ["morning brief", "today stats", "hot leads", "revenue"];
}

function buildConversationalBody(data, intent) {
  const hints = data.hints || {};
  const ts = data.payload?.today_stats;
  const lines = [];

  if (intent === "today stats") {
    if (hints.pipe_empty || data.insufficient) {
      lines.push("Nothing in CRM yet.");
      lines.push("Get a few real chats going on WhatsApp first.");
      lines.push("Ping me once people are replying — I'll steer fast.");
    } else {
      const t = Number(ts?.total_leads) || 0;
      const q = Number(ts?.qualified) || 0;
      const w = Number(ts?.won) || 0;
      lines.push(`${t} leads · ${q} in a good place · ${w} won.`);
      if (hints.conversion_soft) {
        lines.push("Looks like people stall before they're really qualified.");
        lines.push("I'd tighten first replies before spending more.");
      } else if (hints.high_intent) {
        lines.push("A few threads look hot in memory — worth hitting today.");
      } else {
        lines.push("Main thing: pick 3 warm threads and move them to paid.");
      }
    }
  } else if (intent === "hot leads") {
    if (hints.has_hot) {
      const n = Number(hints.hot_count) || 0;
      lines.push(`${n} HOT in CRM right now.`);
      lines.push("Scroll down — I wrote copy you can paste.");
      lines.push("Speed beats perfect here.");
    } else if (hints.ghost_hot) {
      lines.push("No HOT tags in CRM.");
      lines.push("Memory still shows heat — scoring or follow-up's off.");
      lines.push("Call the warmest 5 manually today.");
    } else {
      lines.push("No hot list yet.");
      lines.push("Either traffic's thin or the bot isn't pulling urgency out.");
    }
  } else if (intent === "weekly optimization report") {
    if (hints.thin || data.insufficient) {
      lines.push("Thin week data-wise.");
      lines.push("Run ~10 real convos through WhatsApp, then ask again.");
    } else if (hints.drop_hard) {
      lines.push("People drop off early — first answer's probably the leak.");
      lines.push("Fix that before throwing more money at reach.");
    } else if (hints.mid_funnel) {
      lines.push("Middle of the funnel's sticky.");
      lines.push("More nudges + clearer next step usually fixes it.");
    } else {
      lines.push("Week looks busy enough to read patterns.");
      lines.push("Double down on what's already working.");
    }
  }

  while (lines.length > 5) lines.pop();
  return lines;
}

function commandToSlug(cmd) {
  return String(cmd || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function titleForMenuCommand(cmd) {
  const c = String(cmd || "")
    .trim()
    .toLowerCase();
  const map = {
    "morning brief": "Morning brief",
    "today stats": "Pipeline",
    "hot leads": "Hot leads",
    revenue: "Revenue",
    "weekly optimization report": "Growth plan",
    "pending followups": "Follow-ups",
    "drafts preview": "Send replies",
    "drafts send all": "Queue all",
    "drafts yes": "Confirm send",
    "drafts no": "Cancel batch",
  };
  return map[c] || c;
}

function rowFromCommand(cmd) {
  const c = String(cmd || "")
    .trim()
    .toLowerCase();
  return { id: commandToSlug(c) || "action", title: titleForMenuCommand(c) };
}

/** One combined quick menu: operator routes + draft step when drafts exist (max 4). */
function buildMergedMenuRows(intent, hints, data, hasExecDrafts) {
  const base = pickQuickOptions(intent, hints, data);
  const seen = new Set();
  const rows = [];

  if (hasExecDrafts) {
    rows.push({ id: "drafts_preview", title: "Send replies" });
    seen.add("drafts preview");
  }

  for (const cmd of base) {
    if (rows.length >= 4) break;
    const c = String(cmd || "")
      .trim()
      .toLowerCase();
    if (!c || seen.has(c)) continue;
    if (c === "drafts preview") continue;
    rows.push(rowFromCommand(c));
    seen.add(c);
  }

  const pad = ["revenue", "morning brief", "today stats", "hot leads", "weekly optimization report", "pending followups"];
  for (const c of pad) {
    if (rows.length >= 4) break;
    if (seen.has(c)) continue;
    rows.push(rowFromCommand(c));
    seen.add(c);
  }

  return rows.slice(0, 4);
}

function formatChooseBlockFromRows(rows) {
  const list = (rows || []).slice(0, 4);
  const out = ["", "Choose 👇"];
  list.forEach((r, i) => {
    const cmd = String(r.id || "").replace(/_/g, " ").trim() || String(r.title || "");
    out.push(`${MENU_EMOJIS[i] || `${i + 1}.`} ${cmd}`);
  });
  return out.join("\n");
}

function formatChooseBlock(options) {
  const opts = (options || []).slice(0, 4);
  const out = ["", "Choose 👇"];
  opts.forEach((cmd, i) => {
    out.push(`${MENU_EMOJIS[i] || `${i + 1}.`} ${cmd}`);
  });
  return out.join("\n");
}

/**
 * WhatsApp-native operator copy: short, conversational, context options (no A–E).
 */
export function buildOperatorResponse(data, intent) {
  const body = buildConversationalBody(data, intent);
  const options = pickQuickOptions(intent, data.hints, data);
  const text = `${body.join("\n")}${formatChooseBlock(options)}`;
  return text.trim().slice(0, CEO_MESSAGE_MAX);
}

function buildOperatorBody(data, intent) {
  return buildConversationalBody(data, intent).join("\n").trim();
}

/** Friendly reply when we don't recognise a command (owner). */
export function buildFounderUnknownHelpMessage() {
  const rows = [
    { id: "morning_brief", title: "Morning brief" },
    { id: "hot_leads", title: "Hot leads" },
    { id: "today_stats", title: "Pipeline" },
    { id: "weekly_optimization_report", title: "Growth plan" },
  ];
  const head = ["Didn't catch that.", "Use the list or paste a phrase below."];
  const text = `${head.join("\n")}${formatChooseBlockFromRows(rows)}`.trim().slice(0, CEO_MESSAGE_MAX);
  return {
    text,
    interactive: {
      body: "Pick your next move:",
      rows,
    },
  };
}

export function classifyFounderNaturalIntent(messageRaw) {
  const text = String(messageRaw || "").trim();
  const low = text.toLowerCase();
  if (!low) return { kind: "unclear", confident: false };

  // Draft/reply phrasing first: highly specific ask.
  if (
    /\b(draft|write reply|reply for this lead|message for lead|compose)\b/.test(low) ||
    /\b(reply\s*kya\s*du|kya\s*reply\s*du|is(pe|lead)\s*kya\s*bolu)\b/.test(low)
  ) {
    return { kind: "draft message", confident: true };
  }

  // Daily focus / priority asks.
  if (/\b(today|daily|priorit|what should i do|plan my day|focus)\b/.test(low)) {
    return { kind: "daily priorities", confident: true };
  }
  if (/\b(kya\s*focus\s*karu|aaj\s*kya\s*karu|aaj\s*ka\s*focus|priority\s*kya)\b/.test(low)) {
    return { kind: "daily priorities", confident: true };
  }

  // Growth / top-of-funnel asks.
  if (
    /\b(growth|more leads|scale|pipeline|get more leads)\b/.test(low) ||
    /\b(lead\s*aa\s*nahi\s*rahe|leads?\s*nahi\s*aa\s*rahe|growth\s*kaise\s*kare|zyada\s*lead)\b/.test(low)
  ) {
    return { kind: "growth advice", confident: true };
  }

  // Closing / conversion asks.
  if (
    /\b(close|closing|hot lead|conversion|convert leads|deal)\b/.test(low) ||
    /\b(close\s*nahi\s*ho\s*raha|deal\s*nahi\s*ban\s*raha|payment\s*kaise\s*close\s*karu)\b/.test(low)
  ) {
    return { kind: "close leads", confident: true };
  }

  // Revenue/downtrend asks.
  if (
    /\b(revenue|sales|cash|payment|collection|increase revenue)\b/.test(low) ||
    /\b(sales\s*kam\s*hai|revenue\s*kam\s*hai|payment\s*nahi\s*aa\s*raha)\b/.test(low)
  ) {
    return { kind: "revenue help", confident: true };
  }

  // Diagnosis / stuck-state asks.
  if (/\b(why am i not|diagnos|problem|bottleneck|what's wrong|stuck)\b/.test(low)) {
    return { kind: "diagnose problem", confident: true };
  }
  if (
    /\b(client\s*ghost\s*kar\s*raha|ghost\s*kar\s*raha|seen\s*karke\s*chod|reply\s*nahi\s*aa\s*raha)\b/.test(low)
  ) {
    return { kind: "diagnose problem", confident: true };
  }

  if (/\b(ads|adspend|facebook ads|meta ads|google ads|campaign)\b/.test(low)) {
    return { kind: "ads help", confident: true };
  }
  if (/\b(strategy|playbook|positioning|go to market|gtm)\b/.test(low)) {
    return { kind: "custom strategy", confident: true };
  }
  return { kind: "unclear", confident: false };
}

function buildClarifyFounderIntentMessage() {
  const rows = [
    { id: "daily_priorities", title: "Daily priorities" },
    { id: "close_leads", title: "Close leads" },
    { id: "growth_advice", title: "Growth advice" },
    { id: "revenue_help", title: "Revenue help" },
  ];
  const text = `Want me to focus on priorities, closing, growth, or revenue?${formatChooseBlockFromRows(rows)}`
    .trim()
    .slice(0, CEO_MESSAGE_MAX);
  return {
    text,
    interactive: { body: "Pick one focus area:", rows },
    payload: { founder_mode: true, natural_kind: "clarify" },
  };
}

export async function buildFounderNaturalOperatorMessage(kind, rawMessage, ownerPhone) {
  const k = String(kind || "").toLowerCase();
  const raw = String(rawMessage || "").trim();

  if (!k || k === "unclear") {
    return buildClarifyFounderIntentMessage();
  }

  if (k === "daily priorities") {
    const morning = await buildMorningBriefOperatorMessage(ownerPhone);
    return {
      text: morning.text,
      interactive: morning.interactive,
      payload: { founder_mode: true, natural_kind: "daily priorities", kind: "morning_brief" },
    };
  }
  if (k === "close leads") {
    const op = await renderOperatorCeoMessage("hot leads", ownerPhone);
    return {
      text: op.text,
      interactive: op.interactive || null,
      payload: { founder_mode: true, natural_kind: "close leads", ...op.payload },
    };
  }
  if (k === "growth advice" || k === "diagnose problem" || k === "custom strategy" || k === "ads help") {
    const op = await renderOperatorCeoMessage("weekly optimization report", ownerPhone);
    const lead = k === "ads help" ? "Let's fix channel economics before raising spend.\n\n" : "";
    return {
      text: `${lead}${op.text}`.slice(0, CEO_MESSAGE_MAX),
      interactive: op.interactive || null,
      payload: { founder_mode: true, natural_kind: k, ...op.payload },
    };
  }
  if (k === "revenue help") {
    const op = await renderOperatorCeoMessage("today stats", ownerPhone);
    return {
      text: op.text,
      interactive: op.interactive || null,
      payload: { founder_mode: true, natural_kind: "revenue help", ...op.payload },
    };
  }
  if (k === "draft message") {
    const rows = [
      { id: "hot_leads", title: "Hot leads" },
      { id: "drafts_preview", title: "Send replies" },
      { id: "today_stats", title: "Pipeline" },
      { id: "morning_brief", title: "Morning brief" },
    ];
    const text = [
      "Share 1 lead context in one line: stage, last message, and objection.",
      "I'll write a tight reply you can paste right away.",
      formatChooseBlockFromRows(rows),
    ]
      .join("\n")
      .trim()
      .slice(0, CEO_MESSAGE_MAX);
    return {
      text,
      interactive: { body: "Need draft from hot leads or custom context?", rows },
      payload: { founder_mode: true, natural_kind: "draft message", source_text: raw.slice(0, 240) },
    };
  }

  return buildClarifyFounderIntentMessage();
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

  if (total === 0) {
    return {
      insufficient: true,
      hints: { pipe_empty: true },
      payload: { funnel: dashboard.funnel, lead_memory_agg: agg, lead_memory_rows: rows.length },
    };
  }

  return {
    insufficient: false,
    hints: {
      pipe_empty: false,
      conversion_soft: qualRatio < 0.12 && total > 0,
      high_intent: (agg.high_intent_count || 0) >= 2,
    },
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

  const payload = { hot_leads: hot, lead_memory_agg: agg, lead_memory_sample: lmRows.length };

  if (!hot.length) {
    const memHigh = agg.high_intent_count || 0;
    return {
      insufficient: false,
      hints: {
        has_hot: false,
        ghost_hot: memHigh > 0,
      },
      payload: { ...payload, hot_leads: [] },
    };
  }

  return {
    insufficient: false,
    hints: {
      has_hot: true,
      hot_count: hot.length,
    },
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
  const fu = Number(tc.followup_sent || 0);

  const thin =
    eventsCount < 8 && promptsCount < 4 && lmRows.length < 8;

  if (thin) {
    return {
      insufficient: true,
      hints: { thin: true },
      payload: { kind: "weekly_operator", days, eventsCount, promptsCount, lead_memory_rows: lmRows.length },
    };
  }

  const dropPct =
    inbound > 0 ? Math.round((1 - Math.min(replied, inbound) / inbound) * 100) : null;
  const midFunnel =
    qualified > 0 && hot < Math.max(1, Math.floor(qualified * 0.15));
  const followGap = fu < qualified * 0.2 && qualified > 2;

  return {
    insufficient: false,
    hints: {
      thin: false,
      drop_hard: dropPct != null && dropPct > 30,
      mid_funnel: midFunnel || followGap,
    },
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
    const pers = ownerPhone ? getFounderPersonalizationLines(ownerPhone, { kind: "operator" }) : [];
    const convo = buildOperatorBody(data, intent);
    const bodyText = [...pers, convo].filter(Boolean).join("\n\n");
    const exec = await buildSalesExecutionActionBlock(intent, { includeMenu: false });
    if (exec.suggestions?.length && ownerPhone) {
      cacheOwnerExecutionDrafts(ownerPhone, exec.suggestions, intent);
    }
    const menuRows = buildMergedMenuRows(intent, data.hints, data, Boolean(exec.suggestions?.length));
    const core = combineOperatorAndExecution(bodyText, exec.text).trim();
    const text = `${core}${formatChooseBlockFromRows(menuRows)}`.trim().slice(0, CEO_MESSAGE_MAX);
    const interactive =
      menuRows.length > 0
        ? { body: core.slice(0, INTERACTIVE_BODY_MAX), rows: menuRows }
        : null;
    return {
      text,
      interactive,
      payload: { ...data.payload, execution_suggestions: exec.suggestions },
    };
  }
  if (intent === "hot leads") {
    const data = await buildHotLeadsOperatorPayload();
    const pers = ownerPhone ? getFounderPersonalizationLines(ownerPhone, { kind: "operator" }) : [];
    const convo = buildOperatorBody(data, intent);
    const bodyText = [...pers, convo].filter(Boolean).join("\n\n");
    const exec = await buildSalesExecutionActionBlock(intent, { includeMenu: false });
    if (exec.suggestions?.length && ownerPhone) {
      cacheOwnerExecutionDrafts(ownerPhone, exec.suggestions, intent);
    }
    const menuRows = buildMergedMenuRows(intent, data.hints, data, Boolean(exec.suggestions?.length));
    const core = combineOperatorAndExecution(bodyText, exec.text).trim();
    const text = `${core}${formatChooseBlockFromRows(menuRows)}`.trim().slice(0, CEO_MESSAGE_MAX);
    const interactive =
      menuRows.length > 0
        ? { body: core.slice(0, INTERACTIVE_BODY_MAX), rows: menuRows }
        : null;
    return {
      text,
      interactive,
      payload: { ...data.payload, execution_suggestions: exec.suggestions },
    };
  }
  if (intent === "weekly optimization report") {
    const data = await buildWeeklyOptimizationOperatorPayload();
    const pers = ownerPhone ? getFounderPersonalizationLines(ownerPhone, { kind: "operator" }) : [];
    const convo = buildOperatorBody(data, intent);
    const bodyText = [...pers, convo].filter(Boolean).join("\n\n");
    const exec = await buildSalesExecutionActionBlock(intent, { includeMenu: false });
    if (exec.suggestions?.length && ownerPhone) {
      cacheOwnerExecutionDrafts(ownerPhone, exec.suggestions, intent);
    }
    const menuRows = buildMergedMenuRows(intent, data.hints, data, Boolean(exec.suggestions?.length));
    const core = combineOperatorAndExecution(bodyText, exec.text).trim();
    const text = `${core}${formatChooseBlockFromRows(menuRows)}`.trim().slice(0, CEO_MESSAGE_MAX);
    const interactive =
      menuRows.length > 0
        ? { body: core.slice(0, INTERACTIVE_BODY_MAX), rows: menuRows }
        : null;
    return {
      text,
      interactive,
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
export async function buildMorningBriefOperatorMessage(ownerPhone) {
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

  const line1 =
    hotN >= 2
      ? `You've got ${hotN} HOT — close ${Math.min(2, hotN)} before lunch if you can.`
      : hotN === 1
        ? "One HOT sitting there — I'd ping them before noon."
        : total > 0
          ? "No HOT tags yet — tighten replies + follow-ups before spending more on reach."
          : "Quiet CRM this morning — get a few chats going first.";

  const line2 =
    warmAging >= 3
      ? `${warmAging} warm threads look stale — quick nudge saves them.`
      : warmAging > 0
        ? `${warmAging} warm thread(s) drifting — worth a poke today.`
        : "Watch anything silent 48h+ — that's where deals die.";

  const band = `Rough ₹ band today: ${low.toLocaleString("en-IN")}–${high.toLocaleString("en-IN")} (not a quote).`;

  const pers = ownerPhone ? getFounderPersonalizationLines(ownerPhone, { kind: "morning_brief", hotCountToday: hotN }) : [];
  const body = ["Morning.", ...pers, line1, line2, band].filter(Boolean);
  const opts =
    hotN > 0
      ? ["hot leads", "drafts preview", "revenue", "weekly optimization report"]
      : ["today stats", "hot leads", "weekly optimization report", "revenue"];
  const menuRows = opts.map((c) => rowFromCommand(c));
  const core = body.join("\n").trim();
  const text = `${core}${formatChooseBlockFromRows(menuRows)}`.trim().slice(0, CEO_MESSAGE_MAX);
  const interactive =
    menuRows.length > 0
      ? { body: core.slice(0, INTERACTIVE_BODY_MAX), rows: menuRows }
      : null;

  return { text, interactive, morningHotCount: hotN };
}
