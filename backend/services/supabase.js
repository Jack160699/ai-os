import { createClient } from "@supabase/supabase-js";
import { withRetry } from "../utils/retry.js";
import { log } from "../utils/logger.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase =
  url && key
    ? createClient(url, key)
    : null;

const leadConflict = process.env.SUPABASE_LEADS_ON_CONFLICT || "phone";
const messagesOrderColumn =
  (process.env.SUPABASE_MESSAGES_ORDER || "created_at").trim() || "created_at";

function isTransientSupabaseErr(err) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("fetch") ||
    msg.includes("econnreset")
  );
}

export async function saveMessage(phone, text, sender) {
  if (!supabase) {
    log.debug("Supabase not configured; skip saveMessage");
    return;
  }
  try {
    await withRetry(
      async () => {
        const { error } = await supabase.from("messages").insert([
          { phone, text, sender },
        ]);
        if (error) throw Object.assign(new Error(error.message), { supabaseError: error });
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.SUPABASE_RETRIES || "2", 10) || 2),
        baseMs: 250,
        maxMs: 5000,
        label: "supabase.saveMessage",
        isRetryable: isTransientSupabaseErr,
      }
    );
  } catch (err) {
    log.error("Supabase saveMessage failed", {
      err: err?.message || String(err),
      phone,
      sender,
    });
  }
}

/**
 * Last N messages for phone, oldest → newest.
 * Expects `messages` rows: phone, text, sender, and order column (created_at or id).
 */
export async function fetchRecentMessages(phone, limit = 10) {
  if (!supabase) return [];
  const n = Math.min(50, Math.max(1, Number.parseInt(String(limit), 10) || 10));
  const orderOpts =
    messagesOrderColumn === "created_at"
      ? { ascending: false, nullsFirst: false }
      : { ascending: false };
  try {
    const data = await withRetry(
      async () => {
        const { data: rows, error } = await supabase
          .from("messages")
          .select("sender,text,created_at,id")
          .eq("phone", phone)
          .order(messagesOrderColumn, orderOpts)
          .limit(n);
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
    const rows = Array.isArray(data) ? data : [];
    return rows.reverse();
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
      .from("messages")
      .select("sender,text,created_at,id")
      .eq("phone", phone)
      .order(orderCol, { ascending: false })
      .limit(1);
    if (error) throw error;
    return Array.isArray(data) && data[0] ? data[0] : null;
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
