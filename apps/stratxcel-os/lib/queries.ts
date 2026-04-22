import { createClient } from "@/lib/supabase/server";
import { coreGet } from "@/lib/revenue-core";
import type {
  Activity,
  ConversationListItem,
  DashboardAlert,
  DashboardKpis,
  Lead,
  Message,
  PaymentLink,
  PipelineStage,
  ProposalTemplate,
} from "@/lib/models";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getPipelineStages(resetBatchId: string): Promise<PipelineStage[]> {
  const core = await coreGet<{ ok: boolean; pipeline: Array<{ stage: string }> }>("/api/sales/pipeline", {
    ok: false,
    pipeline: [],
  });
  if (core.ok && core.pipeline.length > 0) {
    return core.pipeline.map((p, idx) => ({
      id: p.stage,
      reset_batch_id: resetBatchId,
      stage_key: p.stage,
      label: p.stage.replace(/_/g, " "),
      sort_order: idx,
    }));
  }
  return safe(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("reset_batch_id", resetBatchId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as PipelineStage[];
  }, []);
}

export async function getLeadsForBatch(resetBatchId: string): Promise<Lead[]> {
  const core = await coreGet<{ ok: boolean; leads: Array<Record<string, unknown>> }>("/api/leads/list", { ok: false, leads: [] });
  if (core.ok && core.leads.length > 0) {
    return core.leads.map((l, idx) => {
      const phone = String(l.phone ?? "");
      const id = String(l.id ?? phone ?? `core-${idx}`);
      const status = String(l.status ?? "new");
      return {
        id,
        reset_batch_id: resetBatchId,
        pipeline_stage_id: status,
        full_name: String(l.name ?? l.full_name ?? phone ?? "Lead"),
        phone: phone || null,
        source: (l.source as string | null) ?? null,
        ai_score: Number(l.ai_score ?? 0),
        temperature: String(l.temperature ?? "warm") as Lead["temperature"],
        estimated_value_cents: Math.round(Number(l.budget ?? 0) * 100),
        has_unreplied: Boolean(l.has_unreplied ?? false),
        archived: Boolean(l.archived ?? false),
        created_at: String(l.created_at ?? new Date().toISOString()),
        updated_at: String(l.updated_at ?? new Date().toISOString()),
      } satisfies Lead;
    });
  }
  return safe(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("reset_batch_id", resetBatchId)
      .eq("archived", false)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Lead[];
  }, []);
}

export async function getHotLeads(resetBatchId: string, limit = 8): Promise<Lead[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("reset_batch_id", resetBatchId)
      .eq("archived", false)
      .eq("temperature", "hot")
      .order("ai_score", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Lead[];
  }, []);
}

export async function getAiInsights(resetBatchId: string, limit = 5): Promise<Activity[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("reset_batch_id", resetBatchId)
      .eq("kind", "ai_insight")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Activity[];
  }, []);
}

export async function getInboxSnapshot(resetBatchId: string, limit = 4): Promise<ConversationListItem[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data: convos, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        lead:leads!inner (
          id,
          full_name,
          phone,
          temperature,
          ai_score,
          source
        )
      `,
      )
      .eq("reset_batch_id", resetBatchId)
      .eq("archived", false)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) throw error;
    const rows = (convos ?? []) as Array<
      Record<string, unknown> & {
        id: string;
        lead: ConversationListItem["lead"];
      }
    >;
    const withPreview: ConversationListItem[] = [];
    for (const row of rows) {
      const { data: msg } = await supabase
        .from("messages")
        .select("body")
        .eq("conversation_id", row.id)
        .eq("reset_batch_id", resetBatchId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      withPreview.push({
        ...(row as unknown as ConversationListItem),
        last_preview: msg?.body ?? null,
      });
    }
    return withPreview;
  }, []);
}

export async function getInboxThreadCount(resetBatchId: string): Promise<number> {
  return safe(async () => {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("reset_batch_id", resetBatchId)
      .eq("archived", false);
    if (error) throw error;
    return count ?? 0;
  }, 0);
}

export async function getConversationsForInbox(resetBatchId: string): Promise<ConversationListItem[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data: convos, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        lead:leads!inner (
          id,
          full_name,
          phone,
          temperature,
          ai_score,
          source
        )
      `,
      )
      .eq("reset_batch_id", resetBatchId)
      .eq("archived", false)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    const rows = (convos ?? []) as Array<Record<string, unknown> & { id: string; lead: ConversationListItem["lead"] }>;
    const enriched: ConversationListItem[] = [];
    for (const row of rows) {
      const { data: msg } = await supabase
        .from("messages")
        .select("body")
        .eq("conversation_id", row.id)
        .eq("reset_batch_id", resetBatchId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      enriched.push({
        ...(row as unknown as ConversationListItem),
        last_preview: msg?.body ?? null,
      });
    }
    return enriched;
  }, []);
}

export async function getMessages(resetBatchId: string, conversationId: string): Promise<Message[]> {
  return safe(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("reset_batch_id", resetBatchId)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Message[];
  }, []);
}

export async function computeDashboardKpis(resetBatchId: string, stages: PipelineStage[], leads: Lead[]): Promise<DashboardKpis> {
  const won = stages.find((s) => s.stage_key === "won");
  const lost = stages.find((s) => s.stage_key === "lost");
  const wonId = won?.id;
  const lostId = lost?.id;

  const today = new Date();
  const iso = today.toISOString().slice(0, 10);

  const revenueTodayCents = leads
    .filter((l) => l.pipeline_stage_id === wonId && l.updated_at?.startsWith(iso))
    .reduce((acc, l) => acc + (l.estimated_value_cents ?? 0), 0);

  const terminal = new Set([wonId, lostId].filter(Boolean) as string[]);
  const activeLeads = leads.filter((l) => !terminal.has(l.pipeline_stage_id)).length;

  const wonCount = leads.filter((l) => l.pipeline_stage_id === wonId).length;
  const lostCount = leads.filter((l) => l.pipeline_stage_id === lostId).length;
  const closed = wonCount + lostCount;
  const conversionRate = closed === 0 ? 0 : Math.round((wonCount / closed) * 1000) / 10;

  const pendingReplies = leads.filter((l) => l.has_unreplied).length;

  return { revenueTodayCents, activeLeads, conversionRate, pendingReplies };
}

export async function getProposalTemplates(resetBatchId: string): Promise<ProposalTemplate[]> {
  const core = await coreGet<{ ok: boolean; proposals: Array<Record<string, unknown>> }>("/api/sales/proposals", {
    ok: false,
    proposals: [],
  });
  if (core.ok && core.proposals.length > 0) {
    return core.proposals.map((p, idx) => ({
      id: String(p.id ?? `proposal-${idx}`),
      reset_batch_id: resetBatchId,
      name: String(p.title ?? p.service ?? "Proposal"),
      subject: String(p.service ?? ""),
      body: String(p.scope ?? ""),
      created_at: String(p.created_at ?? new Date().toISOString()),
    }));
  }
  return safe(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("proposal_templates")
      .select("*")
      .eq("reset_batch_id", resetBatchId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ProposalTemplate[];
  }, []);
}

export async function getPaymentLinksForBatch(resetBatchId: string): Promise<PaymentLink[]> {
  const core = await coreGet<{ ok: boolean; links: Array<Record<string, unknown>> }>("/api/payments/dashboard", {
    ok: false,
    links: [],
  });
  if (core.ok && core.links.length > 0) {
    return core.links.map((p, idx) => ({
      id: String(p.id ?? `plink-${idx}`),
      reset_batch_id: resetBatchId,
      lead_id: String(p.phone ?? ""),
      conversation_id: null,
      amount_minor: Number(p.amount_paise ?? 0),
      currency: "INR",
      status: (String(p.status || "pending") as PaymentLink["status"]),
      provider: String(p.provider || "razorpay"),
      provider_ref: String(p.provider_link_id || ""),
      checkout_url: String(p.short_url || ""),
      created_at: String(p.created_at || new Date().toISOString()),
      paid_at: (p.paid_at as string | null) ?? null,
      expires_at: null,
      last_synced_at: null,
    }));
  }
  return safe(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payment_links")
      .select("*")
      .eq("reset_batch_id", resetBatchId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PaymentLink[];
  }, []);
}

export function computeDailyAlerts(input: {
  leads: Lead[];
  paymentLinks: PaymentLink[];
  kpis: DashboardKpis;
  stages: PipelineStage[];
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const { leads, paymentLinks, kpis, stages } = input;

  if (kpis.pendingReplies >= 3) {
    alerts.push({
      id: "replies-backlog",
      severity: "critical",
      message: `${kpis.pendingReplies} leads are waiting on a reply — clear inbox first.`,
    });
  }

  const hotUnreplied = leads.filter((l) => l.temperature === "hot" && l.has_unreplied && !l.archived).length;
  if (hotUnreplied > 0) {
    alerts.push({
      id: "hot-unreplied",
      severity: "warning",
      message: `${hotUnreplied} hot lead(s) still unreplied — revenue risk.`,
    });
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const stalePending = paymentLinks.filter((p) => {
    if (p.status !== "pending") return false;
    const created = new Date(p.created_at).getTime();
    return Date.now() - created > dayMs;
  }).length;
  if (stalePending > 0) {
    alerts.push({
      id: "payments-stale",
      severity: "warning",
      message: `${stalePending} payment link(s) pending over 24h — follow up or cancel.`,
    });
  }

  const negId = stages.find((s) => s.stage_key === "negotiation")?.id;
  if (negId) {
    const inNeg = leads.filter((l) => l.pipeline_stage_id === negId && !l.archived).length;
    if (inNeg >= 4) {
      alerts.push({
        id: "negotiation-load",
        severity: "info",
        message: `${inNeg} deals in negotiation — pick 2 to close today.`,
      });
    }
  }

  const proposalId = stages.find((s) => s.stage_key === "proposal")?.id;
  if (proposalId) {
    const inProposal = leads.filter((l) => l.pipeline_stage_id === proposalId && !l.archived).length;
    if (inProposal >= 5) {
      alerts.push({
        id: "proposal-queue",
        severity: "info",
        message: `${inProposal} proposals active — send payment links on the warmest 3.`,
      });
    }
  }

  return alerts.slice(0, 6);
}
