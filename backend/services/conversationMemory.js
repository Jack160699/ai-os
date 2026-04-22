import {
  fetchRecentMessages,
  fetchLeadMemory,
  upsertLeadMemorySummary,
} from "./supabase.js";
import { summarizeConversationTranscript } from "./openai.js";
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
export async function buildMemoryContext(phone) {
  const limit = historyLimit();
  const rows = await fetchRecentMessages(phone, limit);
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
  if (!trimmedCompact && !trimmedSummary) {
    return { promptBlock: "", rowCount: rows.length };
  }

  const promptBlock = buildPromptMemoryBlock(summary, compact);
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
