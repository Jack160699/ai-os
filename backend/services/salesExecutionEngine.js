/**
 * Autonomous Sales Execution Engine — tight drafts, smart menus, owner draft cache.
 * Never sends WhatsApp to leads automatically.
 */

import { hotLead } from "./salesEngine.js";
import { fetchLeadMemoryOperatorSnapshot, fetchLeads } from "./supabase.js";

const STALE_HOURS = Math.max(1, Number.parseInt(process.env.HOT_LEAD_STALE_HOURS || "4", 10) || 4);
const LIMIT_HOT = 280;
const LIMIT_FOLLOWUP = 180;
const LIMIT_SKEPTIC = 320;
const LIMIT_BUDGET = 220;

const DRAFT_CACHE_TTL_MS = 30 * 60 * 1000;
const ownerDraftCache = new Map();

function normPhone(v) {
  return String(v || "").replace(/\D/g, "");
}

function hardClip(s, max) {
  const t = String(s || "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function clip(s, n) {
  return hardClip(s, n);
}

export function formatLeadDisplayName(leadRow = {}, leadMemory = {}) {
  const mem = leadMemory && typeof leadMemory === "object" ? leadMemory : {};
  const row = leadRow && typeof leadRow === "object" ? leadRow : {};
  const name = String(row.name || row.full_name || mem.name || "").trim();
  const biz = String(mem.business_type || mem.service_interest || row.service || "").trim();
  const city = String(mem.city || row.city || "").trim();
  const phone = String(row.phone || mem.phone || "").replace(/\D/g, "");
  const last4 = phone.length >= 4 ? phone.slice(-4) : "";

  const bizLabel = biz || "Lead";

  if (name && biz && city) return `${name} – ${biz} (${city})`;
  if (biz && city) return `${bizLabel} – ${city}`;
  if (name && city) return `${name} (${city})`;
  if (name && biz) return `${name} – ${biz}`;
  if (name) return name;
  if (biz) return biz;
  if (last4) return `Lead …${last4}`;
  return "Lead";
}

/** @returns {"neutral"|"frustration"|"confusion"|"urgency"|"excitement"|"hesitation"|"skepticism"} */
export function detectToneFromSummary(summary) {
  const t = String(summary || "").toLowerCase();
  if (/\b(frustrat|fed up|waste|not working|nahi aa|no leads|kuch nahi|irritat|bakwas|time waste)\b/.test(t)) {
    return "frustration";
  }
  if (/\b(confus|samajh|don't understand|not sure|kya hai|how does|explain|cleared?)\b/.test(t)) {
    return "confusion";
  }
  if (/\b(urgent|asap|today|abhi|jaldi|now|immediately|kal)\b/.test(t)) return "urgency";
  if (/\b(excited|great|love|perfect|chalo|done|yes let's)\b/.test(t)) return "excitement";
  if (/\b(maybe|think about|later|not sure yet|dekh|sochna|hesitat)\b/.test(t)) return "hesitation";
  if (/\b(scam|trust|proof|guarantee|really|doubt|sach)\b/.test(t)) return "skepticism";
  return "neutral";
}

function toneOpen(tone) {
  if (tone === "frustration") return "Got you — annoying when that happens.";
  if (tone === "confusion") return "Makes sense to ask.";
  if (tone === "urgency") return "Quick one:";
  if (tone === "excitement") return "Good —";
  if (tone === "hesitation") return "No rush —";
  if (tone === "skepticism") return "Fair —";
  return "Hey —";
}

function isCrmHot(leadRow) {
  return String(leadRow?.temperature || "").toLowerCase() === "hot";
}

export function isHotLeadStale(leadMemory, staleHours = STALE_HOURS) {
  const mem = leadMemory && typeof leadMemory === "object" ? leadMemory : {};
  const ts = mem.last_contacted_at || mem.last_followup_sent_at;
  if (!ts) return true;
  const ms = Date.parse(String(ts));
  if (!Number.isFinite(ms)) return true;
  return Date.now() - ms > staleHours * 3600000;
}

function whyNowLine({ isHot, summary, niche, intentScore, stale }) {
  const bits = [];
  if (Number.isFinite(intentScore) && intentScore >= 70) bits.push(`intent ${intentScore}`);
  if (isHot) bits.push("HOT in CRM");
  const low = String(summary || "").toLowerCase();
  if (/\b(price|pricing|cost|budget|kitna|call|book|payment)\b/.test(low)) bits.push("pricing / call signal");
  if (/\b(today|urgent|jaldi|asap)\b/.test(low)) bits.push("urgency");
  if (niche) bits.push(clip(niche, 36));
  if (stale && isHot) bits.unshift("quiet thread");
  return bits.length ? bits.slice(0, 3).join(" · ") : "Window still open — move before it cools.";
}

function draftHotClose({ hint, niche, tone }) {
  const open = toneOpen(tone);
  const h = hint ? clip(hint, 70) : clip(niche, 50) || "this";
  const body =
    tone === "frustration"
      ? `${open}\nUsually fixable.\nTwo clean paths on ${h} — want me to drop them here?`
      : `${open}\nFollowing up on ${h}.\nTwo tight options that can move the needle — send them?`;
  return hardClip(body, LIMIT_HOT);
}

function draftFollowUpMicro({ hint, niche, tone }) {
  const open = toneOpen(tone);
  const h = hint ? clip(hint, 55) : clip(niche, 40) || "your enquiry";
  const body =
    tone === "frustration"
      ? `${open}\nLet's find where it's leaking first.\nOne sharp next step — want it?`
      : `${open}\nCircling back on ${h}.\nWant a lean next step + ballpark?`;
  return hardClip(body, LIMIT_FOLLOWUP);
}

function draftSkepticTrust({ niche, tone }) {
  const topic = clip(niche, 40) || "delivery";
  const open = tone === "skepticism" ? "Fair." : toneOpen(tone);
  const body = `${open}
• Short scope + written milestones
• You see dates before big $
• No fake guarantees — just clear ${topic} steps

Process 1-pager?`;
  return hardClip(body.replace(/\n+/g, "\n"), LIMIT_SKEPTIC);
}

function draftBudgetRoi({ niche, tone }) {
  const n = clip(niche, 35) || "this";
  const open = toneOpen(tone);
  const body = `${open}
Most teams start lean on ${n}, scale once numbers prove out.
What matters more now — leads or brand polish?`;
  return hardClip(body.replace(/\n+/g, "\n"), LIMIT_BUDGET);
}

function nextStepFor(action_type) {
  if (action_type === "hot_close") return "Paste in their chat or call in 15m.";
  if (action_type === "skeptic_trust") return "Send 1-pager / case — no hard close yet.";
  if (action_type === "budget_roi") return "Lock one starter milestone + date.";
  return "One question + one proposed date.";
}

/**
 * @param {object|null} leadMemory
 * @param {string} buyerType
 * @param {number} intentScore
 * @param {object} [ctx]
 */
export function generateActionSuggestions(leadMemory, buyerType, intentScore, ctx = {}) {
  const mem = leadMemory && typeof leadMemory === "object" ? leadMemory : {};
  const score = Number.isFinite(Number(intentScore)) ? Math.round(Number(intentScore)) : Math.round(Number(mem.intent_score) || 0);
  const bt = String(buyerType || mem.buyer_type || "explorer")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const leadRow = ctx.leadRow || {};
  const lead_display = formatLeadDisplayName(leadRow, mem);
  const lead_name = String(ctx.leadName || mem.name || "Lead").trim() || "Lead";
  const phone = String(ctx.phone || mem.phone || "").trim();
  const summary = String(mem.last_summary || ctx.lastSummary || "").trim();
  const niche = String(mem.service_interest || mem.business_type || ctx.niche || "").trim();
  const tone = ctx.tone != null ? ctx.tone : detectToneFromSummary(summary);

  const budget = ctx.budget != null ? Number(ctx.budget) : Number(leadRow.budget) || undefined;
  const urgency = Boolean(ctx.urgency ?? leadRow.urgency);
  const readyToBuy = Boolean(ctx.readyToBuy);

  const hotSignals = {
    intent_score: score,
    budget: Number.isFinite(budget) ? budget : undefined,
    urgency,
    ready_to_buy: readyToBuy,
  };
  const isHot = Boolean(ctx.isCrmHot) || isCrmHot(leadRow) || hotLead(hotSignals) || bt === "fast_buyer";

  let action_type = "generic_engagement";
  if (isHot) action_type = "hot_close";
  else if (bt === "skeptic") action_type = "skeptic_trust";
  else if (bt === "budget_buyer") action_type = "budget_roi";

  const stale = isHot ? isHotLeadStale(mem) : false;
  const why_now = whyNowLine({ isHot, summary, niche, intentScore: score, stale });

  const hint = summary || niche;
  let message_draft = draftFollowUpMicro({ hint: summary, niche, tone });
  if (action_type === "hot_close") message_draft = draftHotClose({ hint: summary, niche, tone });
  else if (action_type === "skeptic_trust") message_draft = draftSkepticTrust({ niche, tone });
  else if (action_type === "budget_roi") message_draft = draftBudgetRoi({ niche, tone });

  const priority = score >= 85 ? 1 : score >= 70 ? 2 : score >= 50 ? 3 : isHot ? 2 : 4;

  return {
    action_type,
    priority,
    lead_name,
    lead_display,
    message_draft,
    why_now,
    recommended_next_step: nextStepFor(action_type),
    phone,
    stale_hot: Boolean(isHot && stale),
    tone,
  };
}

function sortSuggestions(arr) {
  return [...arr].sort((a, b) => (a.priority || 9) - (b.priority || 9) || (b.lead_display || "").localeCompare(a.lead_display || ""));
}

export async function gatherExecutionSuggestionsForIntent(intent) {
  if (process.env.SALES_EXECUTION_ENGINE === "0") return [];

  const [leads, lmSnapshot] = await Promise.all([fetchLeads(100), fetchLeadMemoryOperatorSnapshot(400)]);
  const memByPhone = new Map();
  const leadRowByPhone = new Map();
  for (const r of lmSnapshot || []) {
    if (r?.phone) memByPhone.set(String(r.phone), r);
  }
  for (const l of leads || []) {
    if (l?.phone) leadRowByPhone.set(String(l.phone), l);
  }

  const hotRows = leads
    .filter((l) => isCrmHot(l))
    .sort((a, b) => Number(b.ai_score || 0) - Number(a.ai_score || 0))
    .slice(0, 3);

  const suggestions = [];
  const usedPhones = new Set();

  for (const lead of hotRows) {
    const phone = String(lead.phone || "");
    if (!phone) continue;
    usedPhones.add(phone);
    const mem = memByPhone.get(phone) || { phone };
    const name = lead.name || lead.full_name || mem.name || "Lead";
    const score = Number.isFinite(Number(lead.ai_score)) ? Number(lead.ai_score) : Number(mem.intent_score) || 0;
    const tone = detectToneFromSummary(String(mem.last_summary || ""));
    suggestions.push(
      generateActionSuggestions(mem, mem.buyer_type || "fast_buyer", score, {
        leadName: name,
        phone,
        isCrmHot: true,
        leadRow: lead,
        budget: lead.budget,
        urgency: lead.urgency,
        tone,
      })
    );
  }

  const addByBuyer = (buyer, limit) => {
    const rows = (lmSnapshot || [])
      .filter((m) => String(m.buyer_type || "").toLowerCase() === buyer && m.phone && !usedPhones.has(String(m.phone)))
      .sort((a, b) => Number(b.intent_score || 0) - Number(a.intent_score || 0))
      .slice(0, limit);
    for (const m of rows) {
      usedPhones.add(String(m.phone));
      const tone = detectToneFromSummary(String(m.last_summary || ""));
      const lr = leadRowByPhone.get(String(m.phone)) || {};
      suggestions.push(
        generateActionSuggestions(m, buyer, Number(m.intent_score) || 0, {
          leadName: m.name || lr.name || lr.full_name || "Lead",
          phone: String(m.phone),
          leadRow: lr,
          tone,
        })
      );
    }
  };

  if (intent === "hot leads") {
    return sortSuggestions(suggestions);
  }

  addByBuyer("skeptic", 2);
  addByBuyer("budget_buyer", 2);

  if (intent === "weekly optimization report") {
    return sortSuggestions(suggestions).slice(0, 6);
  }

  return sortSuggestions(suggestions).slice(0, 6);
}

function smartDraftMenuLines() {
  return [
    "Choose:",
    "1️⃣ Send All",
    "2️⃣ Preview",
    "3️⃣ Edit Replies",
    "4️⃣ Cancel",
    "",
    "Next step (no auto-send):",
    "• `drafts preview` — compact list",
    "• `drafts send all` — confirm gate",
    "StratXcel never messages leads from here without you pasting.",
  ];
}

export function cacheOwnerExecutionDrafts(ownerPhone, suggestions, intent) {
  const k = normPhone(ownerPhone);
  if (!k || !suggestions?.length) return;
  ownerDraftCache.set(k, { suggestions, intent: intent || "unknown", ts: Date.now() });
}

export function getCachedOwnerExecutionDrafts(ownerPhone) {
  const k = normPhone(ownerPhone);
  const v = ownerDraftCache.get(k);
  if (!v || Date.now() - v.ts > DRAFT_CACHE_TTL_MS) {
    if (v) ownerDraftCache.delete(k);
    return null;
  }
  return v;
}

export function clearOwnerExecutionDrafts(ownerPhone) {
  ownerDraftCache.delete(normPhone(ownerPhone));
}

export function buildDraftsPreviewMessage(ownerPhone) {
  const cached = getCachedOwnerExecutionDrafts(ownerPhone);
  if (!cached?.suggestions?.length) {
    return {
      text: "No draft batch cached.\n\nRun `hot leads`, `today stats`, or `weekly optimization report` first — then try preview again.",
      suggestions: [],
    };
  }
  const lines = ["📋 Preview (compact)", "────────", ""];
  cached.suggestions.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.lead_display || s.lead_name} (${s.action_type})`);
    lines.push(hardClip(s.message_draft, 120) + (s.message_draft.length > 120 ? "…" : ""));
    lines.push("");
  });
  lines.push("Full drafts are in your last operator message — or run `drafts send all` for the confirm gate.");
  return { text: lines.join("\n").trim(), suggestions: cached.suggestions };
}

export function buildDraftsSendAllGateMessage(ownerPhone) {
  const cached = getCachedOwnerExecutionDrafts(ownerPhone);
  if (!cached?.suggestions?.length) {
    return {
      text: "Nothing to send yet.\n\nPull `hot leads` or `today stats` first so I can stage drafts.",
      suggestions: [],
    };
  }
  const n = cached.suggestions.length;
  const lines = [
    `Ready to stage ${n} drafted repl${n > 1 ? "ies" : "y"}.`,
    "",
    "Nothing fires from this chat automatically — you'll still paste into each lead thread yourself.",
    "",
    "Proceed?",
    "1️⃣ Yes — show full drafts again",
    "2️⃣ No — cancel this batch",
    "",
    "Reply `drafts yes` or `drafts no` (still no auto-send).",
  ];
  return { text: lines.join("\n"), suggestions: cached.suggestions };
}

export function buildDraftsConfirmYesMessage(ownerPhone) {
  const cached = getCachedOwnerExecutionDrafts(ownerPhone);
  if (!cached?.suggestions?.length) {
    return { text: "Cache expired. Run `hot leads` or `today stats` again.", suggestions: [] };
  }
  const lines = ["✅ Here are your copy-paste drafts:", "────────", ""];
  cached.suggestions.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.lead_display || s.lead_name}`);
    if (s.phone) lines.push(`📱 ${s.phone}`);
    lines.push(s.message_draft);
    lines.push("");
  });
  lines.push("Paste per thread. Done beats perfect.");
  return { text: lines.join("\n").trim().slice(0, 3900), suggestions: cached.suggestions };
}

export function buildDraftsConfirmNoMessage() {
  return {
    text: "Cancelled.\n\nNo messages sent.\nWhen ready: `hot leads` or `today stats`.",
    suggestions: [],
  };
}

export async function buildSalesExecutionActionBlock(intent) {
  const suggestions = await gatherExecutionSuggestionsForIntent(intent);
  if (!suggestions.length) {
    return { text: "", suggestions: [] };
  }

  const staleAny = suggestions.some((s) => s.stale_hot);
  const hotCount = suggestions.filter((s) => s.action_type === "hot_close").length;
  const lines = ["────────", "⚡ MOVES READY (copy only)", "────────"];

  if (staleAny) {
    lines.push(
      "⚠️ Quiet thread on a hot lead — close odds drop if we ghost.",
      "Drafts below. Your call to send.",
      ""
    );
  }

  if (hotCount > 0) {
    lines.push(`🔥 ${hotCount} hot — reply first`, "");
  } else if (suggestions.length) {
    lines.push("📋 Pipeline touches", "");
  }

  let i = 1;
  for (const s of suggestions) {
    const label =
      s.action_type === "hot_close"
        ? "HOT"
        : s.action_type === "skeptic_trust"
          ? "SKEPTIC"
          : s.action_type === "budget_roi"
            ? "BUDGET"
            : "FOLLOW-UP";
    lines.push(`${i}. (${label}) ${s.lead_display || s.lead_name}`);
    if (s.phone) lines.push(`📱 ${s.phone}`);
    lines.push(`Why: ${s.why_now}`);
    lines.push("Draft:");
    lines.push(s.message_draft);
    lines.push(`→ ${s.recommended_next_step}`);
    lines.push("");
    i += 1;
  }

  lines.push(...smartDraftMenuLines());

  return { text: lines.join("\n").trim(), suggestions };
}
