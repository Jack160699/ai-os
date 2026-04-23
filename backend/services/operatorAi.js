/**
 * Operator AI: turn CEO analytics into decisions + actions (WhatsApp-first).
 */

import { getDashboardCore } from "./dashboardMetrics.js";
import {
  fetchLeadEventsSince,
  fetchLeadMemoryOperatorSnapshot,
  fetchLeads,
  fetchRecentMessages,
  fetchRevenueMetrics,
  getLeadMemory,
} from "./supabase.js";
import { loadWeeklyOptimizationAnalysis } from "./phaseDOptimizer.js";
import {
  buildSalesExecutionActionBlock,
  cacheOwnerExecutionDrafts,
} from "./salesExecutionEngine.js";
import { getFounderPersonalizationLines } from "./founderOperatorMemory.js";
import {
  analyzeSituation,
  diagnoseRootProblem,
  findOpportunities,
  generateFounderReply,
  scoreActions,
  selectBestMove,
  storeDecisionReflection,
} from "./decisionEngineV2.js";

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
      lines.push("CRM me abhi flow thin hai.");
      lines.push("Pehle WhatsApp pe kuch real chats start karo.");
      lines.push("Replies aate hi ping karo — fir fast optimize karenge.");
    } else {
      const t = Number(ts?.total_leads) || 0;
      const q = Number(ts?.qualified) || 0;
      const w = Number(ts?.won) || 0;
      lines.push(`${t} leads · ${q} strong stage me · ${w} won.`);
      if (hints.conversion_soft) {
        lines.push("Lag raha hai log qualified hone se pehle hi drop kar rahe hain.");
        lines.push("Pehle first reply tighten karo, phir spend badhao.");
      } else if (hints.high_intent) {
        lines.push("Memory me kuch threads hot dikh rahe hain — aaj hi hit karo.");
      } else {
        lines.push("Main move: 3 warm threads uthao aur paid tak push karo.");
      }
    }
  } else if (intent === "hot leads") {
    if (hints.has_hot) {
      const n = Number(hints.hot_count) || 0;
      lines.push(`CRM me abhi ${n} HOT leads hain.`);
      lines.push("Neeche copy ready hai — direct paste kar sakte ho.");
      lines.push("Yaha speed perfect se zyada important hai.");
    } else if (hints.ghost_hot) {
      lines.push("CRM me HOT tags nahi dikh rahe.");
      lines.push("Memory heat dikha rahi hai — scoring ya follow-up weak hai.");
      lines.push("Aaj warmest 5 leads ko manually touch karo.");
    } else {
      lines.push("Hot list abhi build nahi hui.");
      lines.push("Ya to traffic thin hai, ya urgency extract nahi ho rahi.");
    }
  } else if (intent === "weekly optimization report") {
    if (hints.thin || data.insufficient) {
      lines.push("Is week ka data abhi thin hai.");
      lines.push("~10 real WhatsApp convos chalao, fir dubara check karte hain.");
    } else if (hints.drop_hard) {
      lines.push("Log early drop kar rahe hain — first answer me leak lag raha hai.");
      lines.push("Reach pe paisa daalne se pehle ye fix karo.");
    } else if (hints.mid_funnel) {
      lines.push("Mid funnel sticky ho raha hai.");
      lines.push("Better nudges + clearer next step se ye usually fix hota hai.");
    } else {
      lines.push("Week me enough signal hai patterns read karne ke liye.");
      lines.push("Jo kaam kar raha hai usi pe double down karo.");
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

export function isFounderGreeting(messageRaw) {
  const low = String(messageRaw || "")
    .trim()
    .toLowerCase();
  if (!low) return false;
  return /^(hi|hello|hey|start|hii|yo)\b/.test(low);
}

export function buildFounderWelcomeMessage() {
  const text = "Hey 👋\nKya chal raha hai aaj?";
  return {
    text,
    interactive: null,
    payload: { founder_mode: true, natural_kind: "greeting" },
  };
}

function normPhone(v) {
  return String(v || "").replace(/\D/g, "");
}

function detectFounderLanguageMode(message, recent = []) {
  const all = [message, ...recent.map((r) => r.text || "")].join(" ").toLowerCase();
  const hinglishHits = (all.match(/\b(kya|karu|nahi|raha|bhai|toh|tera|mere|chahiye|kaise|bhejo|ping)\b/g) || []).length;
  return hinglishHits >= 2 ? "hinglish" : "english";
}

function detectEmotionTone(message) {
  const low = String(message || "").toLowerCase();
  if (/\b(urgent|asap|abhi|jaldi|today)\b/.test(low)) return "urgency";
  if (/\b(nahi ho raha|stuck|frustrat|pareshan|problem|issue)\b/.test(low)) return "frustration";
  if (/\b(kya|kaise|samajh|confus|not sure)\b/.test(low)) return "confusion";
  return "neutral";
}

function specificityLevel(message) {
  const m = String(message || "").trim();
  if (m.length >= 80) return "high";
  if (m.length >= 30) return "medium";
  return "low";
}

async function loadFounderRecentEvents(ownerPhone, days = 10) {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const rows = await fetchLeadEventsSince(since, 1200);
  const owner = normPhone(ownerPhone);
  return (rows || []).filter((r) => {
    const p = normPhone(r?.phone);
    const op = normPhone(r?.payload?.owner_phone || r?.payload?.ownerPhone);
    return (owner && p === owner) || (owner && op === owner);
  });
}

function inferFounderPreferences(recentRows, leadMemory) {
  const lang = detectFounderLanguageMode(recentRows[recentRows.length - 1]?.text || "", recentRows);
  const summaries = (recentRows || []).map((r) => String(r.text || "").toLowerCase()).join(" ");
  const focus =
    /\b(lead|growth|outreach|pipeline)\b/.test(summaries)
      ? "leads"
      : /\b(close|deal|follow[- ]?up|ghost)\b/.test(summaries)
        ? "closing"
        : /\b(ads|campaign|meta|google)\b/.test(summaries)
          ? "ads"
          : "mixed";
  return {
    tone: lang === "hinglish" ? "direct_hinglish" : "direct_english",
    language: lang,
    recent_focus: focus,
    repeated_problems: String(leadMemory?.last_summary || ""),
  };
}

function analyzeBusinessStateFromData({ crm, lmRows }) {
  const total = Number(crm?.total_leads || 0);
  const hot = Number(crm?.hot_leads || 0);
  const qualified = Number(crm?.qualified_leads || 0);
  const won = Number(crm?.won_leads || 0);
  const lowContact = (lmRows || []).filter((x) => {
    const ts = x?.last_contacted_at ? Date.parse(String(x.last_contacted_at)) : NaN;
    return !Number.isFinite(ts) || Date.now() - ts > 48 * 3600000;
  }).length;

  let mainProblem = "mixed";
  let urgency = "medium";
  let leverage = "tighten daily operator cadence";

  if (total < 8) {
    mainProblem = "top funnel weak";
    urgency = "high";
    leverage = "consistent outreach volume";
  } else if (qualified > 0 && hot <= Math.max(1, Math.floor(qualified * 0.2))) {
    mainProblem = "mid funnel weak";
    urgency = "high";
    leverage = "faster follow-up + objection handling";
  } else if (hot >= 2 && won === 0) {
    mainProblem = "bottom funnel weak";
    urgency = "high";
    leverage = "close loop on hot threads";
  } else if (lowContact >= 4) {
    mainProblem = "activity low";
    urgency = "medium";
    leverage = "reactivate stale threads";
  }

  return {
    main_problem: mainProblem,
    urgency_level: urgency,
    leverage_point: leverage,
    snapshots: { total, hot, qualified, won, low_contact_threads: lowContact },
  };
}

export async function buildFounderBrainContext(ownerPhone, userMessage) {
  const phone = normPhone(ownerPhone);
  const [recentMessages, leadMemory, founderEvents, dashboard, leads, lmRows, revenue] = await Promise.all([
    fetchRecentMessages(phone, 10),
    getLeadMemory(phone),
    loadFounderRecentEvents(phone, 14),
    getDashboardCore(),
    fetchLeads(120),
    fetchLeadMemoryOperatorSnapshot(220),
    fetchRevenueMetrics(),
  ]);

  const crmState = {
    total_leads: Number(dashboard?.funnel?.total_leads || 0),
    qualified_leads: Number(dashboard?.funnel?.qualified_leads || 0),
    won_leads: Number(dashboard?.funnel?.won_leads || 0),
    hot_leads: (leads || []).filter((l) => String(l.temperature || "").toLowerCase() === "hot").length,
    paid_count: Number(revenue?.paid_count || 0),
    paid_amount_rupees: Number(revenue?.paid_amount_rupees || 0),
  };

  const preferences = inferFounderPreferences(recentMessages, leadMemory);
  return {
    user_message: String(userMessage || "").trim(),
    recent_messages: recentMessages || [],
    lead_memory: leadMemory || null,
    founder_events: founderEvents || [],
    crm_state: crmState,
    lead_memory_snapshot: lmRows || [],
    preferences,
    goals: ["increase qualified leads", "improve close rate", "maintain daily execution"],
  };
}

export function understandFounderProblem(message, context) {
  const cls = classifyFounderNaturalIntent(message);
  const tone = detectEmotionTone(message);
  const spec = specificityLevel(message);
  return {
    intent: cls.confident ? cls.kind : "unclear",
    emotional_tone: tone,
    specificity_level: spec,
    confident: cls.confident,
    language: context?.preferences?.language || "english",
  };
}

export function bestNextAction(context, analysis, understanding) {
  const low = String(context?.user_message || "").toLowerCase();
  const problem = analysis.main_problem;
  const lang = understanding.language;

  if (understanding.intent === "draft message") {
    return {
      action: lang === "hinglish" ? "Lead context do, main exact reply draft karta hu." : "Share lead context; I will draft the exact reply.",
      reasoning: "Message drafting ask is explicit.",
      confidence: 0.93,
    };
  }

  if (understanding.intent === "growth advice" || /\blead\b/.test(low)) {
    if (problem === "activity low" || problem === "top funnel weak") {
      return {
        action:
          lang === "hinglish"
            ? "Aaj 10-15 targeted outreach messages bhejo, fir 2 ghante me follow-up ping karo."
            : "Send 10-15 targeted outreach messages today, then follow up in 2 hours.",
        reasoning: "Fastest ROI is increasing outbound volume before paid spend.",
        confidence: 0.89,
      };
    }
  }

  if (understanding.intent === "close leads" || understanding.intent === "revenue help") {
    return {
      action:
        lang === "hinglish"
          ? "Top 3 hot threads uthao: objection clear karo, deadline do, aur payment step close karo."
          : "Take top 3 hot threads: clear objection, set deadline, and close payment step.",
      reasoning: "Bottom-funnel execution has highest immediate revenue impact.",
      confidence: 0.87,
    };
  }

  if (understanding.intent === "daily priorities") {
    return {
      action:
        lang === "hinglish"
          ? "Aaj ka stack: 10 new outreach + 2 hot follow-ups + 1 payment nudge."
          : "Today stack: 10 new outreach + 2 hot follow-ups + 1 payment nudge.",
      reasoning: "Balanced operator cadence improves top and bottom funnel together.",
      confidence: 0.84,
    };
  }

  if (understanding.intent === "diagnose problem" || understanding.intent === "custom strategy") {
    const step =
      problem === "mid funnel weak"
        ? lang === "hinglish"
          ? "follow-up gap aur trust objection"
          : "follow-up gap and trust objection"
        : problem === "bottom funnel weak"
          ? lang === "hinglish"
            ? "closing script aur pricing clarity"
            : "closing script and pricing clarity"
          : lang === "hinglish"
            ? "outreach consistency"
            : "outreach consistency";
    return {
      action:
        lang === "hinglish"
          ? `Pehle ${step} diagnose karo, fir next 24h ka fix run karo.`
          : `Diagnose ${step} first, then run a 24h correction sprint.`,
      reasoning: "Root-cause first avoids generic advice loops.",
      confidence: 0.8,
    };
  }

  return {
    action:
      lang === "hinglish"
        ? "Clarity ke liye batao: leads, closing, revenue ya draft me se kya solve karna hai?"
        : "For clarity, tell me if we should solve leads, closing, revenue, or drafting first.",
    reasoning: "Intent is unclear.",
    confidence: 0.45,
  };
}

function buildReasonedReply({ context, analysis, understanding, decision }) {
  const hi = understanding.language === "hinglish";
  if (understanding.intent === "unclear") {
    const text = hi
      ? "Quick clarify: leads, closing, revenue ya draft — abhi kis pe focus kare?"
      : "Quick clarify: should we focus on leads, closing, revenue, or drafting right now?";
    return { text, needs_options: true };
  }

  const intro = hi
    ? `Problem clear hai — ${analysis.main_problem}.`
    : `The issue is clear — ${analysis.main_problem}.`;
  const reason = hi
    ? `Reason: ${decision.reasoning}`
    : `Reason: ${decision.reasoning}`;
  const action = hi ? `Aaj ka next move:\n→ ${decision.action}` : `Next move:\n→ ${decision.action}`;
  const close =
    hi && understanding.intent !== "draft message"
      ? "Chahe to main exact script bhi de dunga."
      : !hi && understanding.intent !== "draft message"
        ? "If you want, I can draft the exact script as well."
        : "";
  return {
    text: [intro, "", reason, "", action, close].filter(Boolean).join("\n").slice(0, CEO_MESSAGE_MAX),
    needs_options: false,
  };
}

export async function runFounderDecisionEngineV2({ ownerPhone, message, source }) {
  const intent = classifyFounderNaturalIntent(message);
  const situation = await analyzeSituation({ ownerPhone, message });
  const diagnosis = diagnoseRootProblem(situation, intent.kind || "unclear");
  const opportunities = findOpportunities(situation);
  const scoredActions = scoreActions({
    situation: {
      ...situation,
      urgency_level: diagnosis.certainty > 0.75 ? "high" : diagnosis.certainty > 0.55 ? "medium" : "low",
    },
    diagnosis,
    intent: intent.kind || "unclear",
    opportunities,
  });
  const selection = selectBestMove({ scoredActions });
  const text = generateFounderReply({
    message,
    intent: intent.kind || "unclear",
    situation,
    diagnosis,
    selection,
  });

  await storeDecisionReflection({
    ownerPhone,
    message,
    intent: intent.kind || "unclear",
    diagnosis,
    selection,
    source,
  });

  const interactive =
    intent.kind === "unclear"
      ? {
          body: text.slice(0, INTERACTIVE_BODY_MAX),
          rows: [
            { id: "daily_priorities", title: "Daily priorities" },
            { id: "growth_advice", title: "Growth problem" },
            { id: "close_leads", title: "Closing problem" },
            { id: "revenue_help", title: "Revenue concern" },
          ],
        }
      : null;

  return {
    text: String(text || "").slice(0, CEO_MESSAGE_MAX),
    interactive,
    payload: {
      founder_mode: true,
      natural_kind: intent.kind || "unclear",
      decision_engine_v2: {
        situation,
        diagnosis,
        opportunities,
        scored_actions: scoredActions,
        best_move: selection.best_move || null,
        backup_move: selection.backup_move || null,
        source: source === "interactive" ? "interactive" : "typed",
      },
    },
  };
}

// Backward-compatible alias for older ceoBridge wiring.
export async function runFounderBusinessBrainV1(input) {
  return runFounderDecisionEngineV2(input);
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
