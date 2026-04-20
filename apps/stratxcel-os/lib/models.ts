export type Temperature = "hot" | "warm" | "cold";

export type MessageDirection = "in" | "out";

export interface PipelineStage {
  id: string;
  reset_batch_id: string;
  stage_key: string;
  label: string;
  sort_order: number;
}

export interface Lead {
  id: string;
  reset_batch_id: string;
  pipeline_stage_id: string;
  full_name: string;
  phone: string | null;
  source: string | null;
  ai_score: number;
  temperature: Temperature;
  estimated_value_cents: number;
  has_unreplied: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  reset_batch_id: string;
  lead_id: string;
  channel: string;
  archived: boolean;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  reset_batch_id: string;
  conversation_id: string;
  body: string;
  direction: MessageDirection;
  created_at: string;
}

export interface Activity {
  id: string;
  reset_batch_id: string;
  lead_id: string | null;
  kind: string;
  summary: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface ConversationListItem extends Conversation {
  lead: Pick<Lead, "id" | "full_name" | "phone" | "temperature" | "ai_score" | "source">;
  last_preview: string | null;
}

export interface DashboardKpis {
  revenueTodayCents: number;
  activeLeads: number;
  conversionRate: number;
  pendingReplies: number;
}

export interface ProposalTemplate {
  id: string;
  reset_batch_id: string;
  name: string;
  subject: string | null;
  body: string;
  created_at: string;
}

export type PaymentLinkStatus = "pending" | "paid" | "partially_paid" | "expired" | "cancelled";

export interface PaymentLink {
  id: string;
  reset_batch_id: string;
  lead_id: string;
  conversation_id: string | null;
  amount_minor: number;
  currency: string;
  status: PaymentLinkStatus;
  provider: string;
  provider_ref: string | null;
  checkout_url: string;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
  last_synced_at: string | null;
}

export type DashboardAlertSeverity = "critical" | "warning" | "info";

export interface DashboardAlert {
  id: string;
  severity: DashboardAlertSeverity;
  message: string;
}
