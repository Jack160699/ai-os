import { createClient } from "@supabase/supabase-js";
import { withRetry } from "../utils/retry.js";
import { log } from "../utils/logger.js";

/** Same project as Next.js apps: public URL + service role (server-side only). */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (url) {
  console.log("BACKEND NEXT_PUBLIC_SUPABASE_URL:", url);
}
console.log("BACKEND SUPABASE_SERVICE_ROLE_KEY set:", Boolean(key));

const supabase =
  url && key
    ? createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: "public" },
      })
    : null;

const leadConflict = process.env.SUPABASE_LEADS_ON_CONFLICT || "phone";
const messagesOrderColumn =
  (process.env.SUPABASE_MESSAGES_ORDER || "created_at").trim() || "created_at";

const DEFAULT_RESET_BATCH_ID = "00000000-0000-0000-0000-000000000001";

function isConversationsPhoneLookupUnsupported(err) {
  const m = String(err?.message || "").toLowerCase();
  return (
    (m.includes("phone") && (m.includes("schema cache") || m.includes("does not exist"))) ||
    (m.includes("column") && m.includes("phone") && m.includes("not"))
  );
}

async function getPipelineStageIdForBatch(batchId, stageKey = "new") {
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("reset_batch_id", batchId)
    .eq("stage_key", stageKey)
    .limit(1)
    .maybeSingle();
  if (error) throw Object.assign(new Error(error.message), { supabaseError: error });
  return data?.id || null;
}

/**
 * Ensures lead + conversation exist for this phone (single reset_batch_id for the org).
 * 1) Optional: `conversations.phone` match.
 * 2) Else Stratxcel: get/create `leads` then `conversations` for batch + phone.
 */
async function ensureLeadAndConversationForPhone(rawPhone) {
  const batchId = String(process.env.SUPABASE_RESET_BATCH_ID || "").trim() || DEFAULT_RESET_BATCH_ID;
  const digits = normalizePhoneForMatch(rawPhone);
  const trimmed = String(rawPhone || "").trim();
  const variants = [...new Set([trimmed, digits, digits ? `+${digits}` : ""].filter(Boolean))];
  const canonicalPhone = digits || trimmed;
  if (!canonicalPhone) {
    throw new Error("ensureLeadAndConversationForPhone: empty phone");
  }

  for (const v of variants) {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, reset_batch_id")
      .eq("phone", v)
      .limit(1)
      .maybeSingle();
    if (error) {
      if (isConversationsPhoneLookupUnsupported(error)) break;
      throw Object.assign(new Error(error.message), { supabaseError: error });
    }
    if (data?.id) {
      return {
        conversationId: data.id,
        resetBatchId: data.reset_batch_id || batchId,
        canonicalPhone,
      };
    }
  }

  const { data: leadRows, error: leadErr } = await supabase
    .from("leads")
    .select("id")
    .eq("reset_batch_id", batchId)
    .eq("archived", false)
    .in("phone", variants)
    .limit(1);
  if (leadErr) throw Object.assign(new Error(leadErr.message), { supabaseError: leadErr });

  let leadId = Array.isArray(leadRows) && leadRows[0]?.id ? leadRows[0].id : null;

  if (!leadId) {
    const stageId = await getPipelineStageIdForBatch(batchId, "new");
    if (!stageId) {
      throw new Error(
        `ensureLeadAndConversationForPhone: missing pipeline_stages row for stage_key=new (reset_batch_id=${batchId})`,
      );
    }
    const { data: newLead, error: nlErr } = await supabase
      .from("leads")
      .insert([
        {
          reset_batch_id: batchId,
          pipeline_stage_id: stageId,
          full_name: `Lead ${canonicalPhone.slice(-4) || "?"}`,
          phone: canonicalPhone,
          source: "whatsapp",
          ai_score: 0,
          temperature: "warm",
          estimated_value_cents: 0,
          has_unreplied: false,
          archived: false,
        },
      ])
      .select("id")
      .single();
    if (nlErr) throw Object.assign(new Error(nlErr.message), { supabaseError: nlErr });
    leadId = newLead.id;
  }

  const { data: convRows, error: cFindErr } = await supabase
    .from("conversations")
    .select("id, reset_batch_id")
    .eq("reset_batch_id", batchId)
    .eq("lead_id", leadId)
    .eq("channel", "whatsapp")
    .eq("archived", false)
    .limit(1);
  if (cFindErr) throw Object.assign(new Error(cFindErr.message), { supabaseError: cFindErr });
  const existingConv = Array.isArray(convRows) && convRows[0];
  if (existingConv?.id) {
    return {
      conversationId: existingConv.id,
      resetBatchId: existingConv.reset_batch_id || batchId,
      canonicalPhone,
    };
  }

  const { data: newConv, error: ncErr } = await supabase
    .from("conversations")
    .insert([
      {
        reset_batch_id: batchId,
        lead_id: leadId,
        channel: "whatsapp",
        archived: false,
        last_message_at: new Date().toISOString(),
      },
    ])
    .select("id, reset_batch_id")
    .single();
  if (ncErr) throw Object.assign(new Error(ncErr.message), { supabaseError: ncErr });
  if (!newConv?.id) {
    throw new Error("ensureLeadAndConversationForPhone: conversation insert returned no id");
  }
  return {
    conversationId: newConv.id,
    resetBatchId: newConv.reset_batch_id || batchId,
    canonicalPhone,
  };
}

/**
 * End-to-end: lead → conversation → message (no insert until parent rows exist).
 * Uses one org `reset_batch_id` (env or default), not random UUIDs per row.
 */
export async function ensureConversationFlow(phone, text, direction, opts = {}) {
  if (!supabase) {
    throw new Error("ensureConversationFlow: Supabase not configured");
  }
  const dir = String(direction || "").trim().toLowerCase() === "out" ? "out" : "in";
  const body = String(text ?? "");
  const { conversationId, resetBatchId, canonicalPhone } = await ensureLeadAndConversationForPhone(phone);
  if (!conversationId) {
    throw new Error("ensureConversationFlow: missing conversation_id");
  }

  const createdAt = opts.createdAt || new Date().toISOString();
  const row = {
    reset_batch_id: resetBatchId,
    conversation_id: conversationId,
    body,
    direction: dir,
    created_at: createdAt,
  };
  if (canonicalPhone) row.phone = canonicalPhone;

  console.log("INSERT TARGET DB:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("INSERTING MESSAGE", phone, text);

  const { data, error } = await supabase.schema("public").from("messages").insert([row]).select("id");
  console.log("INSERT RESULT:", data, error);
  if (error) {
    console.error(error);
    console.error("PIPELINE ERROR:", error);
    log.error("PIPELINE ERROR", { err: error.message, phone: canonicalPhone, direction: dir, code: error.code });
    throw new Error(error.message);
  }
  return { data, conversationId, resetBatchId, canonicalPhone };
}

function normalizePhoneForMatch(value) {
  return String(value || "").replace(/\D/g, "");
}

function phoneMatchesTarget(storedPhone, requestedPhone) {
  const a = normalizePhoneForMatch(storedPhone);
  const b = normalizePhoneForMatch(requestedPhone);
  if (!a || !b) return false;
  if (a === b) return true;
  const a10 = a.slice(-10);
  const b10 = b.slice(-10);
  return Boolean(a10 && b10 && a10 === b10);
}

function isTransientSupabaseErr(err) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("fetch") ||
    msg.includes("econnreset")
  );
}

/** DB constraint `messages_direction_check` allows only 'in' and 'out'. */
const MESSAGE_DIR_IN = new Set(["in", "incoming", "inbound", "user"]);
const MESSAGE_DIR_OUT = new Set(["out", "outgoing", "outbound", "bot", "admin", "system", "assistant"]);

/**
 * Maps sender / loose labels → canonical 'in' | 'out', then coerces to DB-safe values.
 * WhatsApp inbound → in; bot/admin replies → out.
 */
function coerceMessagesDirection(input) {
  const s = String(input || "").trim().toLowerCase();
  let label = "out";
  if (MESSAGE_DIR_IN.has(s)) label = "in";
  else if (MESSAGE_DIR_OUT.has(s)) label = "out";
  else label = "out";
  return label === "out" ? "out" : "in";
}

/** Map stored rows (`body`, `direction`) to fields the rest of the backend expects (`text`, `sender`). */
function normalizeStoredMessageRow(row) {
  if (!row) return row;
  const text = row.body != null ? String(row.body) : String(row.text || "");
  let sender = String(row.sender || "").toLowerCase();
  if (!sender) {
    sender = String(row.direction || "").toLowerCase() === "in" ? "user" : "admin";
  }
  return { ...row, text, sender };
}

export async function saveMessage(phone, text, sender) {
  if (!supabase) {
    log.debug("Supabase not configured; skip saveMessage");
    return;
  }
  const direction = coerceMessagesDirection(sender);
  await withRetry(
    async () => ensureConversationFlow(phone, text, direction),
    {
      retries: Math.max(0, Number.parseInt(process.env.SUPABASE_RETRIES || "2", 10) || 2),
      baseMs: 250,
      maxMs: 5000,
      label: "supabase.saveMessage",
      isRetryable: isTransientSupabaseErr,
    }
  );
}

export async function backfillMessagesFromLeadSummaries(limit = 200, dryRun = false) {
  if (!supabase) return { ok: false, inserted: 0, scanned: 0, reason: "no_supabase" };
  const n = Math.min(2000, Math.max(1, Number.parseInt(String(limit), 10) || 200));
  try {
    const { data: rows, error } = await supabase
      .from("lead_memory")
      .select("phone,last_summary,updated_at,created_at,last_contacted_at")
      .not("last_summary", "is", null)
      .order("updated_at", { ascending: false })
      .limit(n);
    if (error) throw error;
    const sourceRows = Array.isArray(rows) ? rows : [];
    let inserted = 0;
    for (const row of sourceRows) {
      const phone = String(row?.phone || "").trim();
      const text = String(row?.last_summary || "").trim();
      if (!phone || !text) continue;
      const createdAt = row?.last_contacted_at || row?.updated_at || row?.created_at || new Date().toISOString();
      const { data: existing, error: checkErr } = await supabase
        .schema("public")
        .from("messages")
        .select("id")
        .eq("phone", phone)
        .eq("body", text)
        .limit(1);
      if (checkErr) throw checkErr;
      if (Array.isArray(existing) && existing.length > 0) continue;
      if (!dryRun) {
        const direction = coerceMessagesDirection("out");
        await ensureConversationFlow(phone, text, direction, { createdAt });
      }
      inserted += 1;
    }
    return { ok: true, inserted, scanned: sourceRows.length, dry_run: Boolean(dryRun) };
  } catch (err) {
    log.error("backfillMessagesFromLeadSummaries failed", { err: err?.message || String(err) });
    return { ok: false, inserted: 0, scanned: 0, reason: err?.message || "backfill_failed" };
  }
}

/**
 * Last N messages for phone, oldest → newest.
 * Reads `body` / `direction` from DB; normalizes to `text` / `sender` for callers.
 */
export async function fetchRecentMessages(phone, limit = 10) {
  if (!supabase) return [];
  const n = Math.min(500, Math.max(1, Number.parseInt(String(limit), 10) || 10));
  const digits = normalizePhoneForMatch(phone);
  const last10 = digits.slice(-10);
  const phoneVariants = [...new Set([phone, digits, digits ? `+${digits}` : ""].filter(Boolean))];
  try {
    const data = await withRetry(
      async () => {
        let query = supabase
          .schema("public")
          .from("messages")
          .select("phone,body,sender,direction,created_at,id")
          .order("created_at", { ascending: true, nullsFirst: false })
          .limit(n);
        if (phoneVariants.length && last10) {
          query = query.or(
            [...phoneVariants.map((v) => `phone.eq.${v}`), `phone.like.%${last10}`].join(",")
          );
        } else if (phoneVariants.length) {
          query = query.in("phone", phoneVariants);
        }
        const { data: rows, error } = await query;
        if (error) throw Object.assign(new Error(error.message), { supabaseError: error });
        return rows;
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.SUPABASE_RETRIES || "2", 10) || 2),
        baseMs: 250,
        maxMs: 5000,
        label: "supabase.fetchRecentMessages",
        isRetryable: isTransientSupabaseErr,
      }
    );
    const rows = (Array.isArray(data) ? data : [])
      .filter((r) => phoneMatchesTarget(r?.phone, digits))
      .map((r) => normalizeStoredMessageRow(r))
      .sort((a, b) => {
        const ta = Date.parse(String(a?.created_at || ""));
        const tb = Date.parse(String(b?.created_at || ""));
        const aTs = Number.isFinite(ta) ? ta : 0;
        const bTs = Number.isFinite(tb) ? tb : 0;
        return aTs - bTs;
      });
    return rows.slice(0, n);
  } catch (err) {
    log.error("Supabase fetchRecentMessages failed", {
      err: err?.message || String(err),
      phone,
    });
    return [];
  }
}

export async function fetchLeadMemory(phone) {
  if (!supabase) return { memory_summary: "", memory_summary_at: null, status: null };
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("memory_summary,memory_summary_at,status")
      .eq("phone", phone)
      .maybeSingle();
    if (error) {
      log.warn("fetchLeadMemory", { err: error.message, phone });
      return { memory_summary: "", memory_summary_at: null, status: null };
    }
    return {
      memory_summary: String(data?.memory_summary || "").trim(),
      memory_summary_at: data?.memory_summary_at || null,
      status: data?.status ?? null,
    };
  } catch (err) {
    log.warn("fetchLeadMemory failed", { err: err?.message, phone });
    return { memory_summary: "", memory_summary_at: null, status: null };
  }
}

const LEAD_MEMORY_PATCH_KEYS = new Set([
  "name",
  "business_type",
  "city",
  "budget_range",
  "service_interest",
  "stage",
  "buyer_type",
  "intent_score",
  "last_summary",
  "last_contacted_at",
  "next_followup_at",
  "last_followup_sent_at",
]);

function pickLeadMemoryPatch(data = {}) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (!LEAD_MEMORY_PATCH_KEYS.has(k) || v === undefined) continue;
    if (k === "intent_score") {
      const n = Number.parseInt(String(v), 10);
      out[k] = Number.isFinite(n) ? n : 0;
      continue;
    }
    out[k] = v;
  }
  return out;
}

export async function fetchMessages(limit = 1000) {
  if (!supabase) return [];
  const n = Math.min(5000, Math.max(1, Number.parseInt(String(limit), 10) || 1000));
  try {
    const { data, error } = await supabase
      .schema("public")
      .from("messages")
      .select("phone,body,sender,direction,created_at,id")
      .order(messagesOrderColumn, { ascending: false, nullsFirst: false })
      .limit(n);
    if (error) throw error;
    return (Array.isArray(data) ? data : []).map((r) => normalizeStoredMessageRow(r));
  } catch (err) {
    log.warn("Supabase fetchMessages failed", { err: err?.message || String(err) });
    return [];
  }
}

/**
 * Phase A: structured profile row in `lead_memory` (keyed by WhatsApp phone).
 */
export async function getLeadMemory(phone) {
  if (!supabase || !phone) return null;
  try {
    const { data, error } = await supabase.from("lead_memory").select("*").eq("phone", phone).maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (err) {
    log.warn("getLeadMemory failed", { err: err?.message || String(err), phone });
    return null;
  }
}

/** Newest message row for phone (for follow-up / thread checks). */
export async function fetchLatestMessageForPhone(phone) {
  if (!supabase || !phone) return null;
  const orderCol = messagesOrderColumn === "created_at" ? "created_at" : "id";
  try {
    const { data, error } = await supabase
      .schema("public")
      .from("messages")
      .select("sender,direction,body,created_at,id")
      .eq("phone", phone)
      .order(orderCol, { ascending: false })
      .limit(1);
    if (error) throw error;
    return Array.isArray(data) && data[0] ? normalizeStoredMessageRow(data[0]) : null;
  } catch (err) {
    log.warn("fetchLatestMessageForPhone failed", { err: err?.message || String(err), phone });
    return null;
  }
}

/** `lead_memory` rows whose next_followup_at is due (Phase C engine). */
export async function fetchLeadMemoryDueFollowups(limit = 25) {
  if (!supabase) return [];
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from("lead_memory")
      .select("*")
      .lte("next_followup_at", now)
      .not("next_followup_at", "is", null)
      .not("last_contacted_at", "is", null)
      .order("next_followup_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("fetchLeadMemoryDueFollowups failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function upsertLeadMemory(phone, data = {}) {
  if (!supabase || !phone) return { ok: false, reason: "no_supabase_or_phone" };
  const patch = pickLeadMemoryPatch(data);
  const now = new Date().toISOString();
  try {
    const existing = await getLeadMemory(phone);
    const defaults = {
      phone,
      name: null,
      business_type: null,
      city: null,
      budget_range: null,
      service_interest: null,
      stage: "new",
      buyer_type: null,
      intent_score: 0,
      last_summary: null,
      last_contacted_at: null,
      next_followup_at: null,
    };
    const row = {
      ...defaults,
      ...(existing || {}),
      ...patch,
      phone,
      updated_at: now,
    };
    if (existing?.created_at) {
      row.created_at = existing.created_at;
    }
    await withRetry(
      async () => {
        const { error } = await supabase.from("lead_memory").upsert([row], { onConflict: "phone" });
        if (error) throw Object.assign(new Error(error.message), { supabaseError: error });
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.SUPABASE_RETRIES || "2", 10) || 2),
        baseMs: 250,
        maxMs: 5000,
        label: "supabase.upsertLeadMemory",
        isRetryable: isTransientSupabaseErr,
      }
    );
    return { ok: true };
  } catch (err) {
    log.warn("upsertLeadMemory failed", { err: err?.message || String(err), phone });
    return { ok: false, reason: err?.message || "upsert_failed" };
  }
}

export async function updateLeadSummary(phone, summary) {
  const trimmed = String(summary || "").trim().slice(0, 4000);
  return upsertLeadMemory(phone, { last_summary: trimmed || null });
}

export async function upsertLeadMemorySummary(phone, summary, statusFallback = "active") {
  if (!supabase) return;
  const trimmed = String(summary || "").trim().slice(0, 4000);
  const now = new Date().toISOString();
  const row = {
    phone,
    memory_summary: trimmed,
    memory_summary_at: now,
    updated_at: now,
  };
  try {
    const { data: existing } = await supabase
      .from("leads")
      .select("status")
      .eq("phone", phone)
      .maybeSingle();
    row.status = existing?.status || statusFallback;
    await withRetry(
      async () => {
        const useConflict = leadConflict && leadConflict !== "none";
        const { error } = useConflict
          ? await supabase.from("leads").upsert([row], { onConflict: leadConflict })
          : await supabase.from("leads").upsert([row]);
        if (error) throw Object.assign(new Error(error.message), { supabaseError: error });
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.SUPABASE_RETRIES || "2", 10) || 2),
        baseMs: 250,
        maxMs: 5000,
        label: "supabase.upsertLeadMemorySummary",
        isRetryable: isTransientSupabaseErr,
      }
    );
  } catch (err) {
    log.error("Supabase upsertLeadMemorySummary failed", {
      err: err?.message || String(err),
      phone,
    });
  }
}

export async function updateLead(phone, status) {
  if (!supabase) {
    log.debug("Supabase not configured; skip updateLead");
    return;
  }
  const now = new Date().toISOString();
  try {
    await withRetry(
      async () => {
        const { data, error } = await supabase
          .from("leads")
          .update({ status, updated_at: now })
          .eq("phone", phone)
          .select("phone");
        if (error) throw Object.assign(new Error(error.message), { supabaseError: error });
        if (!data?.length) {
          const { error: insErr } = await supabase
            .from("leads")
            .insert({ phone, status, updated_at: now });
          if (insErr) throw Object.assign(new Error(insErr.message), { supabaseError: insErr });
        }
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.SUPABASE_RETRIES || "2", 10) || 2),
        baseMs: 250,
        maxMs: 5000,
        label: "supabase.updateLead",
        isRetryable: isTransientSupabaseErr,
      }
    );
  } catch (err) {
    log.error("Supabase updateLead failed", {
      err: err?.message || String(err),
      phone,
      status,
    });
  }
}

export async function savePaymentEvent(eventRow) {
  if (!supabase) {
    log.debug("Supabase not configured; skip savePaymentEvent");
    return;
  }
  try {
    await withRetry(
      async () => {
        const { error } = await supabase.from("payment_events").insert([eventRow]);
        if (error) throw Object.assign(new Error(error.message), { supabaseError: error });
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.SUPABASE_RETRIES || "2", 10) || 2),
        baseMs: 250,
        maxMs: 5000,
        label: "supabase.savePaymentEvent",
        isRetryable: isTransientSupabaseErr,
      }
    );
  } catch (err) {
    log.warn("Supabase savePaymentEvent skipped", {
      err: err?.message || String(err),
    });
  }
}

export async function upsertLeadRecord(lead) {
  if (!supabase) return { ok: false, reason: "no_supabase" };
  const now = new Date().toISOString();
  const row = { ...lead, updated_at: now };
  try {
    await withRetry(
      async () => {
        const useConflict = leadConflict && leadConflict !== "none";
        const { error } = useConflict
          ? await supabase.from("leads").upsert([row], { onConflict: leadConflict })
          : await supabase.from("leads").upsert([row]);
        if (error) throw Object.assign(new Error(error.message), { supabaseError: error });
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.SUPABASE_RETRIES || "2", 10) || 2),
        baseMs: 250,
        maxMs: 5000,
        label: "supabase.upsertLeadRecord",
        isRetryable: isTransientSupabaseErr,
      }
    );
    return { ok: true };
  } catch (err) {
    log.error("Supabase upsertLeadRecord failed", { err: err?.message || String(err) });
    return { ok: false, reason: err?.message || "write_failed" };
  }
}

export async function insertLeadEvent(eventRow) {
  if (!supabase) return;
  try {
    await withRetry(
      async () => {
        const { error } = await supabase.from("lead_events").insert([eventRow]);
        if (error) throw Object.assign(new Error(error.message), { supabaseError: error });
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.SUPABASE_RETRIES || "2", 10) || 2),
        baseMs: 250,
        maxMs: 5000,
        label: "supabase.insertLeadEvent",
        isRetryable: isTransientSupabaseErr,
      }
    );
  } catch (err) {
    log.warn("Supabase insertLeadEvent skipped", { err: err?.message || String(err) });
  }
}

/** Phase D: recent `lead_events` for analytics / weekly optimizer. */
export async function fetchLeadEventsSince(isoSince, limit = 8000) {
  if (!supabase || !isoSince) return [];
  const n = Math.min(20_000, Math.max(50, Number.parseInt(String(limit), 10) || 8000));
  try {
    const { data, error } = await supabase
      .from("lead_events")
      .select("*")
      .gte("created_at", isoSince)
      .order("created_at", { ascending: false })
      .limit(n);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("fetchLeadEventsSince failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function insertPromptPerformanceRow(row) {
  if (!supabase) return { ok: false, reason: "no_supabase" };
  try {
    const { error } = await supabase.from("prompt_performance").insert([row]);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    log.warn("insertPromptPerformanceRow failed", { err: err?.message || String(err) });
    return { ok: false, reason: err?.message || "insert_failed" };
  }
}

export async function insertConversionMetric(row) {
  if (!supabase) return { ok: false, reason: "no_supabase" };
  try {
    const { error } = await supabase.from("conversion_metrics").insert([row]);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    log.warn("insertConversionMetric failed", { err: err?.message || String(err) });
    return { ok: false, reason: err?.message || "insert_failed" };
  }
}

export async function fetchPromptPerformanceSince(isoSince, limit = 4000) {
  if (!supabase || !isoSince) return [];
  const n = Math.min(10_000, Math.max(20, Number.parseInt(String(limit), 10) || 4000));
  try {
    const { data, error } = await supabase
      .from("prompt_performance")
      .select("*")
      .gte("created_at", isoSince)
      .order("created_at", { ascending: false })
      .limit(n);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("fetchPromptPerformanceSince failed", { err: err?.message || String(err) });
    return [];
  }
}

/** Recent `lead_memory` rows for operator / CEO summaries (bounded). */
export async function fetchLeadMemoryOperatorSnapshot(limit = 400) {
  if (!supabase) return [];
  const n = Math.min(800, Math.max(20, Number.parseInt(String(limit), 10) || 400));
  try {
    const { data, error } = await supabase
      .from("lead_memory")
      .select(
        "phone,intent_score,buyer_type,stage,business_type,service_interest,last_contacted_at,next_followup_at,last_summary"
      )
      .order("updated_at", { ascending: false })
      .limit(n);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("fetchLeadMemoryOperatorSnapshot failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function fetchLeadMemoryRows(limit = 400) {
  if (!supabase) return [];
  const n = Math.min(2000, Math.max(20, Number.parseInt(String(limit), 10) || 400));
  try {
    const { data, error } = await supabase
      .from("lead_memory")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(n);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("fetchLeadMemoryRows failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function fetchLeadMemoryForPhones(phones, limit = 20) {
  if (!supabase || !phones?.length) return [];
  const uniq = [...new Set(phones.map((p) => String(p || "").trim()).filter(Boolean))].slice(
    0,
    Math.min(40, Number.parseInt(String(limit), 10) || 20)
  );
  if (!uniq.length) return [];
  try {
    const { data, error } = await supabase
      .from("lead_memory")
      .select("*")
      .in("phone", uniq);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("fetchLeadMemoryForPhones failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function saveProposal(row) {
  if (!supabase) return { ok: false, reason: "no_supabase" };
  try {
    const { data, error } = await supabase.from("proposals").insert([row]).select("*").single();
    if (error) throw error;
    return { ok: true, proposal: data };
  } catch (err) {
    log.error("Supabase saveProposal failed", { err: err?.message || String(err) });
    return { ok: false, reason: err?.message || "save_failed" };
  }
}

export async function setProposalAccepted(proposalId, acceptedAt = new Date().toISOString()) {
  if (!supabase) return { ok: false, reason: "no_supabase" };
  try {
    const { data, error } = await supabase
      .from("proposals")
      .update({ status: "accepted", accepted_at: acceptedAt, updated_at: acceptedAt })
      .eq("id", proposalId)
      .select("*")
      .single();
    if (error) throw error;
    return { ok: true, proposal: data };
  } catch (err) {
    log.error("Supabase setProposalAccepted failed", { err: err?.message || String(err) });
    return { ok: false, reason: err?.message || "update_failed" };
  }
}

export async function savePaymentLink(row) {
  if (!supabase) return { ok: false, reason: "no_supabase" };
  try {
    const { data, error } = await supabase
      .from("payment_links")
      .insert([row])
      .select("*")
      .single();
    if (error) throw error;
    return { ok: true, payment_link: data };
  } catch (err) {
    log.warn("Supabase savePaymentLink skipped", { err: err?.message || String(err) });
    return { ok: false, reason: err?.message || "save_failed" };
  }
}

export async function markPaymentLinkPaidByProviderId(paymentLinkId, paymentId, paidAt) {
  if (!supabase || !paymentLinkId) return { ok: false };
  const now = paidAt || new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from("payment_links")
      .update({ status: "paid", payment_id: paymentId || null, paid_at: now, updated_at: now })
      .eq("provider_link_id", paymentLinkId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return { ok: true, payment_link: data || null };
  } catch (err) {
    log.warn("Supabase markPaymentLinkPaidByProviderId skipped", { err: err?.message || String(err) });
    return { ok: false };
  }
}

export async function createClientFromLead({ phone, name, source }) {
  if (!supabase || !phone) return { ok: false, reason: "no_supabase_or_phone" };
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from("clients")
      .upsert(
        [{ phone, name: name || null, source: source || null, converted_at: now, updated_at: now }],
        { onConflict: "phone" }
      )
      .select("*")
      .single();
    if (error) throw error;
    return { ok: true, client: data };
  } catch (err) {
    log.warn("Supabase createClientFromLead skipped", { err: err?.message || String(err) });
    return { ok: false, reason: err?.message || "create_failed" };
  }
}

export async function createProjectForClient({ clientId, phone, projectType = "website" }) {
  if (!supabase) return { ok: false, reason: "no_supabase" };
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          client_id: clientId || null,
          phone: phone || null,
          project_type: projectType,
          status: "kickoff",
          started_at: now,
          updated_at: now,
        },
      ])
      .select("*")
      .single();
    if (error) throw error;
    return { ok: true, project: data };
  } catch (err) {
    log.warn("Supabase createProjectForClient skipped", { err: err?.message || String(err) });
    return { ok: false, reason: err?.message || "create_failed" };
  }
}

export async function fetchLeadByPhone(phone) {
  if (!supabase || !phone) return null;
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (err) {
    log.warn("Supabase fetchLeadByPhone failed", { err: err?.message || String(err) });
    return null;
  }
}

export async function fetchSalesOpportunityByPhone(phone) {
  if (!supabase || !phone) return null;
  try {
    const { data, error } = await supabase
      .from("sales_opportunities")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (err) {
    log.warn("Supabase fetchSalesOpportunityByPhone failed", { err: err?.message || String(err) });
    return null;
  }
}

export async function upsertSalesOpportunity(row) {
  if (!supabase) return { ok: false, reason: "no_supabase" };
  try {
    const { data, error } = await supabase
      .from("sales_opportunities")
      .upsert([row], { onConflict: "phone" })
      .select("*")
      .single();
    if (error) throw error;
    return { ok: true, opportunity: data };
  } catch (err) {
    log.warn("Supabase upsertSalesOpportunity skipped", { err: err?.message || String(err) });
    return { ok: false, reason: err?.message || "upsert_failed" };
  }
}

export async function dueFollowups(limit = 30) {
  if (!supabase) return [];
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from("sales_opportunities")
      .select("*")
      .lte("next_followup_at", now)
      .neq("stage", "closed_won")
      .neq("stage", "closed_lost")
      .order("next_followup_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("Supabase dueFollowups skipped", { err: err?.message || String(err) });
    return [];
  }
}

export async function fetchFunnelMetrics() {
  if (!supabase) return { by_status: [], total: 0 };
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("status");
    if (error) throw error;
    const map = new Map();
    for (const row of data || []) {
      const key = String(row?.status || "unknown");
      map.set(key, (map.get(key) || 0) + 1);
    }
    return {
      total: (data || []).length,
      by_status: Array.from(map.entries()).map(([status, count]) => ({ status, count })),
    };
  } catch (err) {
    log.warn("Supabase fetchFunnelMetrics failed", { err: err?.message || String(err) });
    return { by_status: [], total: 0 };
  }
}

export async function fetchRevenueMetrics() {
  if (!supabase) return { paid_links: 0, paid_amount_rupees: 0, paid_count: 0 };
  try {
    const { data, error } = await supabase
      .from("payment_links")
      .select("status,amount_paise,paid_at");
    if (error) throw error;
    let paidCount = 0;
    let paidAmountPaise = 0;
    for (const row of data || []) {
      if (String(row?.status || "") === "paid") {
        paidCount += 1;
        paidAmountPaise += Number(row?.amount_paise || 0);
      }
    }
    return {
      paid_links: paidCount,
      paid_count: paidCount,
      paid_amount_rupees: Math.round(paidAmountPaise) / 100,
    };
  } catch (err) {
    log.warn("Supabase fetchRevenueMetrics failed", { err: err?.message || String(err) });
    return { paid_links: 0, paid_amount_rupees: 0, paid_count: 0 };
  }
}

export async function fetchLeads(limit = 200) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("Supabase fetchLeads failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function fetchSalesPipeline(limit = 200) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("sales_opportunities")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("Supabase fetchSalesPipeline failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function fetchPaymentLinks(limit = 200) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("payment_links")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("Supabase fetchPaymentLinks failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function fetchPaymentEvents(limit = 200) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("payment_events")
      .select("*")
      .order("recorded_at_utc", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("Supabase fetchPaymentEvents failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function fetchLatestPaymentLinkByPhone(phone) {
  if (!supabase || !phone) return null;
  try {
    const { data, error } = await supabase
      .from("payment_links")
      .select("*")
      .eq("phone", String(phone))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (err) {
    log.warn("Supabase fetchLatestPaymentLinkByPhone failed", { err: err?.message || String(err) });
    return null;
  }
}

export async function fetchProjects(limit = 200) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("Supabase fetchProjects failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function fetchProposals(limit = 200) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("Supabase fetchProposals failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function readCeoSettings() {
  if (!supabase) return { owner_numbers: [], permissions: [] };
  try {
    const { data, error } = await supabase
      .from("ceo_bridge_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return {
      owner_numbers: Array.isArray(data?.owner_numbers) ? data.owner_numbers : [],
      permissions: Array.isArray(data?.permissions) ? data.permissions : [],
      updated_at: data?.updated_at || null,
    };
  } catch (err) {
    log.warn("Supabase readCeoSettings failed", { err: err?.message || String(err) });
    return { owner_numbers: [], permissions: [] };
  }
}

export async function saveCeoSettings({ owner_numbers, permissions }) {
  if (!supabase) return { ok: false, reason: "no_supabase" };
  const row = {
    id: "default",
    owner_numbers: owner_numbers || [],
    permissions: permissions || [],
    updated_at: new Date().toISOString(),
  };
  try {
    const { error } = await supabase
      .from("ceo_bridge_settings")
      .upsert([row], { onConflict: "id" });
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    log.warn("Supabase saveCeoSettings failed", { err: err?.message || String(err) });
    return { ok: false, reason: err?.message || "save_failed" };
  }
}

export async function logCeoCommand(row) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("ceo_command_logs").insert([row]);
    if (error) throw error;
  } catch (err) {
    log.warn("Supabase logCeoCommand failed", { err: err?.message || String(err) });
  }
}

export async function listCeoCommandLogs(limit = 100) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("ceo_command_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    log.warn("Supabase listCeoCommandLogs failed", { err: err?.message || String(err) });
    return [];
  }
}

export async function loadFounderExecutionState(ownerPhone) {
  const phone = String(ownerPhone || "").replace(/\D/g, "");
  if (!supabase || !phone) return null;
  try {
    const { data, error } = await supabase
      .from("founder_execution_state")
      .select("*")
      .eq("owner_phone", phone)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (err) {
    log.warn("Supabase loadFounderExecutionState failed", { err: err?.message || String(err), ownerPhone: phone });
    return null;
  }
}

export async function saveFounderExecutionState(ownerPhone, data = {}) {
  const phone = String(ownerPhone || "").replace(/\D/g, "");
  if (!supabase || !phone) return { ok: false, reason: "no_supabase_or_phone" };
  const nowIso = new Date().toISOString();
  const row = {
    owner_phone: phone,
    active_focus: data.active_focus ?? null,
    selected_direction: data.selected_direction ?? null,
    plan: data.plan ?? null,
    progress_percent: Number.isFinite(Number(data.progress_percent)) ? Math.max(0, Math.min(100, Number(data.progress_percent))) : 0,
    waiting_for_update: Boolean(data.waiting_for_update),
    last_action_at: data.last_action_at || nowIso,
    next_reminder_at: data.next_reminder_at || null,
    meta: data.meta && typeof data.meta === "object" ? data.meta : {},
    updated_at: nowIso,
  };
  if (data.created_at) row.created_at = data.created_at;

  try {
    const { error } = await supabase
      .from("founder_execution_state")
      .upsert([row], { onConflict: "owner_phone" });
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    log.warn("Supabase saveFounderExecutionState failed", { err: err?.message || String(err), ownerPhone: phone });
    return { ok: false, reason: err?.message || "save_failed" };
  }
}

export async function updateFounderProgress(ownerPhone, pct) {
  const phone = String(ownerPhone || "").replace(/\D/g, "");
  if (!supabase || !phone) return { ok: false, reason: "no_supabase_or_phone" };
  const progress = Math.max(0, Math.min(100, Number(pct) || 0));
  const done = progress >= 100;
  try {
    const { error } = await supabase
      .from("founder_execution_state")
      .update({
        progress_percent: progress,
        waiting_for_update: done ? false : true,
        last_action_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("owner_phone", phone);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    log.warn("Supabase updateFounderProgress failed", { err: err?.message || String(err), ownerPhone: phone, pct: progress });
    return { ok: false, reason: err?.message || "update_failed" };
  }
}

export async function clearFounderExecutionState(ownerPhone) {
  const phone = String(ownerPhone || "").replace(/\D/g, "");
  if (!supabase || !phone) return { ok: false, reason: "no_supabase_or_phone" };
  try {
    const { error } = await supabase
      .from("founder_execution_state")
      .update({
        waiting_for_update: false,
        progress_percent: 100,
        next_reminder_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("owner_phone", phone);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    log.warn("Supabase clearFounderExecutionState failed", { err: err?.message || String(err), ownerPhone: phone });
    return { ok: false, reason: err?.message || "clear_failed" };
  }
}
