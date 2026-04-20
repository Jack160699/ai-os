import { createClient } from "@/lib/supabase/server";
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
