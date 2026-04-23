import { getDashboardCore } from "./dashboardMetrics.js";
import {
  fetchLeadEventsSince,
  fetchLeadMemoryOperatorSnapshot,
  fetchLeads,
  fetchRecentMessages,
  fetchRevenueMetrics,
  getLeadMemory,
} from "./supabase.js";
import { trackFounderDecisionAction } from "./phaseDAnalytics.js";
import { storeFounderDecisionReflection } from "./conversationMemory.js";

const MAX_TEXT = 3900;

function normPhone(v) {
  return String(v || "").replace(/\D/g, "");
}

function detectFounderTone(message) {
  const low = String(message || "").toLowerCase();
  if (/\b(urgent|asap|abhi|jaldi|today)\b/.test(low)) return "urgency";
  if (/\b(nahi ho raha|stuck|frustrat|pareshan|issue|problem)\b/.test(low)) return "frustration";
  if (/\b(kya|kaise|samajh|not sure|confus)\b/.test(low)) return "confusion";
  return "neutral";
}

function detectLanguage() {
  return "hinglish";
}

function classifyIntent(message) {
  const low = String(message || "").toLowerCase();
  if (/\b(hi|hello|hey|start)\b/.test(low)) return "greeting";
  if (/\b(draft|reply kya du|write reply|message likh)\b/.test(low)) return "drafting help";
  if (/\b(kya focus|aaj kya|priority|daily)\b/.test(low)) return "daily priorities";
  if (/\b(lead nahi|growth|more leads|pipeline)\b/.test(low)) return "growth problem";
  if (/\b(close nahi|closing|deal)\b/.test(low)) return "closing problem";
  if (/\b(sales kam|revenue|payment|cash)\b/.test(low)) return "revenue concern";
  if (/\b(why|diagnos|problem|stuck|ghost)\b/.test(low)) return "diagnostic";
  if (/\b(kya focus karu|kya karu|ab kya)\b/.test(low)) return "daily priorities";
  if (/\b(leads?\s*nahi\s*aa\s*rahe|lead aa nahi)\b/.test(low)) return "growth problem";
  if (/\b(close\s*nahi\s*ho\s*raha)\b/.test(low)) return "closing problem";
  return "unclear";
}

function scoreActionDimensions(action, situation, diagnosis) {
  const impact = action.impact ?? 0.5;
  const speed = action.speed ?? 0.5;
  const certainty = Math.min(1, Math.max(0.2, diagnosis.certainty || 0.5));
  const ease = action.ease ?? 0.5;
  const urgency = action.urgency ?? (situation.urgency_level === "high" ? 0.9 : 0.6);
  const score = impact * 0.35 + speed * 0.2 + certainty * 0.15 + ease * 0.1 + urgency * 0.2;
  return { impact, speed, certainty, ease, urgency, score: Number(score.toFixed(3)) };
}

function actionCatalog(situation, diagnosis, opportunities, intent) {
  const hasHot = situation.hot_leads > 0;
  const noLeads = situation.leads_today === 0 && situation.hot_leads === 0;
  const actions = [
    {
      key: "close_hot_leads",
      label: "Close hot leads now",
      move: "Push top 2 hot leads with deadline + payment step.",
      impact: hasHot ? 0.95 : 0.25,
      speed: 0.9,
      ease: 0.75,
      urgency: hasHot ? 0.95 : 0.4,
      enabled: hasHot,
    },
    {
      key: "outbound_push",
      label: "Send 15 targeted outbound messages",
      move: "Start 15 quality outreach conversations today.",
      impact: noLeads ? 0.92 : 0.65,
      speed: 0.75,
      ease: 0.7,
      urgency: noLeads ? 0.92 : 0.65,
      enabled: true,
    },
    {
      key: "reengage_ghosted",
      label: "Re-engage ghosted leads",
      move: "Reopen 5 ghosted threads with short context + offer nudge.",
      impact: situation.ghosted_hot_leads > 0 ? 0.84 : 0.5,
      speed: 0.8,
      ease: 0.78,
      urgency: situation.ghosted_hot_leads > 0 ? 0.85 : 0.55,
      enabled: true,
    },
    {
      key: "pricing_trust_fix",
      label: "Fix pricing + trust objection flow",
      move: "Use proof + pricing framing on active closing threads.",
      impact: diagnosis.root_problem.includes("trust") || diagnosis.root_problem.includes("pricing") ? 0.82 : 0.56,
      speed: 0.55,
      ease: 0.5,
      urgency: 0.62,
      enabled: true,
    },
    {
      key: "ask_missing_data",
      label: "Ask founder for one missing datapoint",
      move: "Ask one clarifying datapoint before next recommendation.",
      impact: intent === "unclear" ? 0.6 : 0.25,
      speed: 0.95,
      ease: 0.95,
      urgency: intent === "unclear" ? 0.75 : 0.2,
      enabled: true,
    },
    {
      key: "run_ads",
      label: "Run ad campaign",
      move: "Launch controlled ad test only if immediate pipeline is empty.",
      impact: !hasHot && opportunities.pending_payments === 0 ? 0.45 : 0.1,
      speed: 0.3,
      ease: 0.35,
      urgency: 0.25,
      enabled: !hasHot,
    },
  ];
  return actions.filter((a) => a.enabled).map((a) => ({ ...a, metrics: scoreActionDimensions(a, situation, diagnosis) }));
}

export async function analyzeSituation({ ownerPhone, message }) {
  const phone = normPhone(ownerPhone);
  const now = Date.now();
  const since7 = new Date(now - 7 * 86400000).toISOString();
  const since30 = new Date(now - 30 * 86400000).toISOString();

  const [recent15, leadMemory, ev7, ev30, dashboard, leads, rev, lmRows] = await Promise.all([
    fetchRecentMessages(phone, 15),
    getLeadMemory(phone),
    fetchLeadEventsSince(since7, 2000),
    fetchLeadEventsSince(since30, 4000),
    getDashboardCore(),
    fetchLeads(180),
    fetchRevenueMetrics(),
    fetchLeadMemoryOperatorSnapshot(260),
  ]);

  const my7 = (ev7 || []).filter((r) => normPhone(r.phone) === phone || normPhone(r?.payload?.owner_phone) === phone);
  const my30 = (ev30 || []).filter((r) => normPhone(r.phone) === phone || normPhone(r?.payload?.owner_phone) === phone);
  const hotLeads = (leads || []).filter((l) => String(l.temperature || "").toLowerCase() === "hot");
  const ghostedHot = hotLeads.filter((l) => {
    const ts = l.updated_at ? Date.parse(String(l.updated_at)) : NaN;
    return !Number.isFinite(ts) || now - ts > 24 * 3600000;
  });
  const noReplyThreads = (lmRows || []).filter((r) => {
    const t = r.last_contacted_at ? Date.parse(String(r.last_contacted_at)) : NaN;
    return !Number.isFinite(t) || now - t > 72 * 3600000;
  }).length;
  const pendingPayments = my7.filter((r) => r.event_type === "payment_intent").length;
  const sourcePerf = {};
  for (const e of my30) {
    const src = String(e?.payload?.niche || e?.payload?.source || "unknown");
    sourcePerf[src] = (sourcePerf[src] || 0) + 1;
  }
  const sortedSources = Object.entries(sourcePerf).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const lastSuggestions = my30.filter((r) => r.event_type === "founder_brain_suggestion").slice(0, 5);
  const completedHints = recent15.filter((r) => r.sender === "user" && /\b(done|ho gaya|done bhai|sent)\b/i.test(String(r.text))).length;

  return {
    leads_today: Number(dashboard?.funnel?.total_leads || 0),
    hot_leads: hotLeads.length,
    pending_payments: pendingPayments,
    ghosted_hot_leads: ghostedHot.length,
    no_reply_threads: noReplyThreads,
    last_focus: String(leadMemory?.last_summary || "").slice(0, 140),
    repeated_problem: String(leadMemory?.last_summary || ""),
    founder_tone: detectFounderTone(message),
    founder_language: detectLanguage(message, recent15),
    growth_trend: my7.length < Math.max(3, Math.floor(my30.length / 6)) ? "down" : "stable_or_up",
    close_trend: pendingPayments > 0 && Number(rev?.paid_count || 0) === 0 ? "weak" : "ok",
    recent_messages: recent15,
    lead_memory: leadMemory,
    lead_events_7d: my7,
    lead_events_30d: my30,
    crm: {
      total: Number(dashboard?.funnel?.total_leads || 0),
      qualified: Number(dashboard?.funnel?.qualified_leads || 0),
      won: Number(dashboard?.funnel?.won_leads || 0),
      revenue_paid_count: Number(rev?.paid_count || 0),
    },
    lead_source_performance: sortedSources,
    last_actions_suggested: lastSuggestions.map((s) => s.payload?.suggested_action).filter(Boolean),
    last_actions_completed: completedHints,
  };
}

export function diagnoseRootProblem(situation, founderIntent) {
  const reasons = [];
  let root = "execution bottleneck";
  let secondary = "unclear";
  let certainty = 0.58;

  if (situation.hot_leads >= 2 && situation.close_trend === "weak") {
    root = "slow follow-up on warm/hot leads";
    secondary = "low urgency in close";
    certainty = 0.82;
    reasons.push("hot leads exist but close trend weak");
  } else if (situation.leads_today === 0 || situation.growth_trend === "down") {
    root = "top funnel weak";
    secondary = "outreach inconsistency";
    certainty = 0.8;
    reasons.push("lead flow is down");
  } else if (situation.no_reply_threads >= 5) {
    root = "mid funnel weak";
    secondary = "trust + follow-up quality gap";
    certainty = 0.74;
    reasons.push("many threads without replies");
  }

  if (founderIntent === "closing problem") {
    root = root.includes("top funnel") ? "top funnel weak" : "closing system weak";
    secondary = "pricing/trust/follow-up diagnosis needed";
    certainty = Math.max(certainty, 0.77);
  }
  if (founderIntent === "growth problem" && !root.includes("top funnel")) {
    secondary = root;
    root = "top funnel weak";
  }
  if (founderIntent === "revenue concern" && situation.pending_payments > 0) {
    root = "payment collection lag";
    secondary = "close urgency weak";
    certainty = Math.max(certainty, 0.8);
  }

  return {
    root_problem: root,
    secondary_problem: secondary,
    certainty: Number(certainty.toFixed(2)),
    evidence: reasons,
  };
}

export function findOpportunities(situation) {
  const list = [];
  if (situation.hot_leads >= 1) {
    list.push({ key: "hot_close_window", title: `${situation.hot_leads} hot leads can be pushed today`, urgency: 0.95, impact: 0.92 });
  }
  if (situation.ghosted_hot_leads >= 1) {
    list.push({ key: "ghosted_revival", title: `${situation.ghosted_hot_leads} ghosted hot leads need revival`, urgency: 0.88, impact: 0.85 });
  }
  if (situation.pending_payments >= 1) {
    list.push({ key: "pending_collection", title: `${situation.pending_payments} payment intents pending reminder`, urgency: 0.9, impact: 0.93 });
  }
  if (situation.leads_today === 0) {
    list.push({ key: "empty_top_funnel", title: "No fresh leads in recent cycle", urgency: 0.84, impact: 0.86 });
  }
  if (situation.no_reply_threads >= 4) {
    list.push({ key: "no_reply_threads", title: `${situation.no_reply_threads} threads need follow-up reset`, urgency: 0.78, impact: 0.76 });
  }
  return list.sort((a, b) => b.impact * b.urgency - a.impact * a.urgency);
}

export function scoreActions({ situation, diagnosis, intent, opportunities }) {
  const scored = actionCatalog(situation, diagnosis, { pending_payments: situation.pending_payments }, intent)
    .map((a) => ({
      key: a.key,
      label: a.label,
      move: a.move,
      score: a.metrics.score,
      metrics: a.metrics,
    }))
    .sort((a, b) => b.score - a.score);

  // Anti-dumb rule: if hot leads exist, deprioritize ads.
  if (situation.hot_leads > 0) {
    for (const a of scored) {
      if (a.key === "run_ads") a.score = Math.min(a.score, 0.18);
    }
    scored.sort((a, b) => b.score - a.score);
  }
  // If no leads and no hot, closing actions should sink.
  if (situation.leads_today === 0 && situation.hot_leads === 0) {
    for (const a of scored) {
      if (a.key === "close_hot_leads") a.score = Math.min(a.score, 0.12);
    }
    scored.sort((a, b) => b.score - a.score);
  }
  return scored;
}

export function selectBestMove({ scoredActions }) {
  const best = scoredActions[0] || null;
  const backup = scoredActions[1] || null;
  return { best_move: best, backup_move: backup };
}

export function generateFounderReply({ message, intent, situation, diagnosis, selection }) {
  if (intent === "greeting") {
    return "Hey 👋\nAaj kya chal raha hai?";
  }
  if (!selection.best_move) {
    return "Thoda context de — leads, closing, revenue ya draft me kya atka hua hai?";
  }

  const low = String(message || "").toLowerCase();
  if (/lead/.test(low) && /nahi/.test(low)) {
    return [
      "Clear top-funnel issue hai.",
      "",
      "Last few days outreach consistent nahi lag raha.",
      "",
      "Fastest fix:",
      "→ Aaj 10–15 logon ko direct WhatsApp outreach bhejo",
    ]
      .join("\n")
      .slice(0, MAX_TEXT);
  }
  if (/close/.test(low) && /nahi/.test(low)) {
    return [
      "Usually 3 reason hote hain:",
      "- follow-up slow",
      "- trust low",
      "- pricing unclear",
      "",
      `Tere case me ${diagnosis.root_problem.includes("follow") ? "follow-up weak" : "close urgency weak"} lag raha hai.`,
      "",
      `Aaj ka move:\n→ ${selection.best_move.move}`,
    ]
      .join("\n")
      .slice(0, MAX_TEXT);
  }
  if (/focus/.test(low) || /priority/.test(low)) {
    return [
      "Seedha bolu?",
      "",
      `Abhi ${diagnosis.root_problem} dikh raha hai.`,
      "",
      "Aaj:",
      `→ ${selection.best_move.move}`,
      selection.backup_move ? `→ ${selection.backup_move.move}` : "",
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, MAX_TEXT);
  }

  const whatISee = `Seedha bolu?\nAbhi ${diagnosis.root_problem} dikh raha hai.`;
  const matters = `Abhi sabse important: ${selection.best_move.label.toLowerCase()}.`;
  const exact = `Exact move:\n→ ${selection.best_move.move}`;
  const next =
    selection.backup_move && selection.backup_move.score > 0.62
      ? `Uske baad:\n→ ${selection.backup_move.move}`
      : "";
  return [whatISee, "", matters, "", exact, next].filter(Boolean).join("\n").slice(0, MAX_TEXT);
}

export async function storeDecisionReflection({ ownerPhone, message, intent, diagnosis, selection, source }) {
  const reflection = {
    problem_detected: diagnosis.root_problem,
    secondary_problem: diagnosis.secondary_problem,
    action_suggested: selection?.best_move?.move || null,
    backup_action: selection?.backup_move?.move || null,
    source: source === "interactive" ? "interactive" : "typed",
    founder_message: String(message || "").slice(0, 260),
    certainty: diagnosis.certainty,
    created_at: new Date().toISOString(),
  };
  await Promise.all([
    trackFounderDecisionAction({ phone: ownerPhone, reflection }),
    storeFounderDecisionReflection({ phone: ownerPhone, reflection }),
  ]);
  return reflection;
}

