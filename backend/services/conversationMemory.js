import {
  fetchRecentMessages,
  fetchLeadMemory,
  getLeadMemory,
  upsertLeadMemory,
  upsertLeadMemorySummary,
} from "./supabase.js";
import { summarizeConversationTranscript } from "./openai.js";
import { bumpLeadMemoryNextFollowupAfterBotReply } from "./revenueFollowupEngine.js";
import { log } from "../utils/logger.js";

const historyLimit = () =>
  Math.min(20, Math.max(1, Number.parseInt(process.env.MEMORY_HISTORY_LIMIT || "10", 10) || 10));

const perLineCap = () =>
  Math.min(400, Math.max(40, Number.parseInt(process.env.MEMORY_PER_LINE_CAP || "140", 10) || 140));

const compactBudget = () =>
  Math.min(4000, Math.max(400, Number.parseInt(process.env.MEMORY_COMPACT_BUDGET_CHARS || "1600", 10) || 1600));

const tailTurnsWhenSummary = () =>
  Math.min(10, Math.max(2, Number.parseInt(process.env.MEMORY_PROMPT_TAIL_TURNS || "4", 10) || 4));

const summaryMinIntervalMs = () =>
  Math.max(30_000, Number.parseInt(process.env.MEMORY_SUMMARY_MIN_INTERVAL_MS || "90000", 10) || 90_000);

const summaryMinCompactChars = () =>
  Math.max(120, Number.parseInt(process.env.MEMORY_SUMMARY_REFRESH_MIN_CHARS || "450", 10) || 450);

const summaryMinRows = () =>
  Math.max(2, Number.parseInt(process.env.MEMORY_SUMMARY_REFRESH_MIN_ROWS || "3", 10) || 3);

function squash(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function rowsToCompactTranscript(rows) {
  const cap = perLineCap();
  const lines = [];
  for (const r of rows) {
    const role = r.sender === "user" ? "U" : "B";
    const t = squash(r.text).slice(0, cap);
    if (t) lines.push(`${role}:${t}`);
  }
  let out = lines.join("\n");
  const budget = compactBudget();
  if (out.length > budget) {
    out = "…\n" + out.slice(-(budget - 2));
  }
  return out;
}

function ageMs(iso) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(String(iso));
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Date.now() - t;
}

function shouldRefreshSummary({ compact, rowCount, storedSummary, summaryUpdatedAt }) {
  if (process.env.MEMORY_SUMMARY_ENABLED === "0") return false;
  if (rowCount < summaryMinRows()) return false;
  if (compact.length < summaryMinCompactChars()) return false;
  const stale = ageMs(summaryUpdatedAt) >= summaryMinIntervalMs();
  const thin = !storedSummary || storedSummary.length < 40;
  return thin || stale;
}

/**
 * Builds a token-efficient MEMORY block for the main model.
 * Fetches last N messages, optionally refreshes rolling summary via a small side-call.
 */
export function getMemoryHistoryLimit() {
  return historyLimit();
}

/**
 * @param {string} phone
 * @param {{ recentRows?: Array<{ sender?: string; text?: string; created_at?: string; id?: unknown }> }} [opts]
 */
export async function buildMemoryContext(phone, opts = {}) {
  const limit = historyLimit();
  const rows = Array.isArray(opts.recentRows) ? opts.recentRows : await fetchRecentMessages(phone, limit);
  const compact = rowsToCompactTranscript(rows);
  const lead = await fetchLeadMemory(phone);
  let summary = lead.memory_summary;

  if (shouldRefreshSummary({
    compact,
    rowCount: rows.length,
    storedSummary: summary,
    summaryUpdatedAt: lead.memory_summary_at,
  })) {
    try {
      const next = await summarizeConversationTranscript(compact);
      if (next && next.trim()) {
        summary = next.trim();
        await upsertLeadMemorySummary(phone, summary, lead.status || "active");
        log.debug("memory summary refreshed", { phone: String(phone).slice(0, 4) + "…" });
      }
    } catch (e) {
      log.warn("memory summary refresh skipped", { err: e?.message || String(e) });
    }
  }

  const trimmedCompact = compact.trim();
  const trimmedSummary = squash(summary).trim();
  const leadRow = await getLeadMemory(phone);
  const profileBlock = formatLeadMemoryProfileBlock(leadRow);

  if (!trimmedCompact && !trimmedSummary && !profileBlock) {
    return { promptBlock: "", rowCount: rows.length };
  }

  let promptBlock = buildPromptMemoryBlock(summary, compact);
  if (profileBlock) {
    promptBlock = promptBlock.trim()
      ? `${profileBlock}\n\n${promptBlock}`
      : profileBlock;
  }
  return { promptBlock, rowCount: rows.length };
}

function buildPromptMemoryBlock(summary, compact) {
  const sum = squash(summary).slice(0, 420);
  const hasSummary = sum.length > 0;

  let recent = compact;
  if (hasSummary) {
    const lines = compact.split("\n").filter(Boolean);
    const tailN = tailTurnsWhenSummary();
    const tail = lines.slice(-tailN).join("\n");
    const tailCap = Math.min(900, Math.floor(compactBudget() * 0.55));
    recent = tail.length > tailCap ? "…\n" + tail.slice(-tailCap) : tail;
  } else {
    recent = compact.slice(0, compactBudget());
  }

  const parts = [
    "MEMORY (use only what is written here; do not invent facts):",
    `Summary: ${hasSummary ? sum : "—"}`,
    "Recent (oldest → newest; U=user, B=bot):",
    recent || "—",
  ];
  return parts.join("\n\n");
}

function humanizeBuyerType(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const map = {
    fast_buyer: "fast buyer",
    budget_buyer: "budget buyer",
    ghosted_return_lead: "ghosted return lead",
    explorer: "explorer",
    skeptic: "skeptic",
  };
  return map[s] || s.replace(/_/g, " ");
}

function formatLeadMemoryProfileBlock(row) {
  if (!row) return "";
  const lines = [];
  const push = (label, val) => {
    if (val === null || val === undefined) return;
    const s = String(val).trim();
    if (!s) return;
    lines.push(`${label}: ${s}`);
  };
  push("Name", row.name);
  push("Business type", row.business_type);
  push("City", row.city);
  push("Budget range", row.budget_range);
  push("Service interest", row.service_interest);
  push("Stage", row.stage);
  if (row.buyer_type) push("Buyer type", humanizeBuyerType(row.buyer_type));
  const score = Number(row.intent_score);
  if (Number.isFinite(score)) {
    push("Intent score (0-100)", String(Math.round(score)));
    if (score > 70) {
      lines.push("Adaptive note: high intent — prioritize clarity, next step, and respectful close.");
    }
  }
  push("Last summary", row.last_summary);
  if (!lines.length) return "";
  return ["LEAD PROFILE (structured memory; facts only, do not invent beyond this):", ...lines].join("\n");
}

/**
 * After a bot AI reply is saved: bump contact time and refresh rolling `last_summary` for `lead_memory`.
 * Skips extra OpenAI work when LEAD_MEMORY_SUMMARY_ENABLED=0 (still updates timestamps).
 */
export async function refreshLeadMemoryAfterAiTurn(phone) {
  if (!phone) return;
  const now = new Date().toISOString();
  try {
    let lastSummary = null;
    if (process.env.LEAD_MEMORY_SUMMARY_ENABLED !== "0") {
      const rows = await fetchRecentMessages(phone, historyLimit());
      const compact = rowsToCompactTranscript(rows);
      if (compact.trim()) {
        const next = await summarizeConversationTranscript(compact);
        if (next && String(next).trim()) {
          lastSummary = String(next).trim().slice(0, 2000);
        }
      }
    }
    const patch = { last_contacted_at: now };
    if (lastSummary) patch.last_summary = lastSummary;
    await upsertLeadMemory(phone, patch);
    await bumpLeadMemoryNextFollowupAfterBotReply(phone);
  } catch (err) {
    log.warn("refreshLeadMemoryAfterAiTurn failed", { err: err?.message || String(err), phone });
    try {
      await upsertLeadMemory(phone, { last_contacted_at: now });
      await bumpLeadMemoryNextFollowupAfterBotReply(phone);
    } catch (e2) {
      log.warn("refreshLeadMemoryAfterAiTurn fallback upsert failed", { err: e2?.message || String(e2), phone });
    }
  }
}
