"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BATCH_COOKIE, getResetBatchId } from "@/lib/batch";
import { createClient } from "@/lib/supabase/server";
import type { Temperature } from "@/lib/models";
import { renderProposalTemplate } from "@/lib/revenue/render-template";
import { coreGet, corePost } from "@/lib/revenue-core";

export async function moveLeadToStage(leadId: string, pipelineStageId: string) {
  const supabase = await createClient();
  const { data: lead } = await supabase.from("leads").select("phone").eq("id", leadId).maybeSingle();
  if (lead?.phone) {
    await corePost(
      "/api/sales/stage",
      { phone: String(lead.phone), stage: pipelineStageId },
      { ok: false },
    );
  }
  const { error } = await supabase.from("leads").update({ pipeline_stage_id: pipelineStageId }).eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath("/leads");
}

export async function setLeadTemperature(leadId: string, temperature: Temperature) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ temperature }).eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidatePath("/leads");
}

export async function archiveConversation(conversationId: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("conversations").update({ archived }).eq("id", conversationId);
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
}

export async function deleteConversation(conversationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("conversations").delete().eq("id", conversationId);
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
}

export async function setResetBatchCookie(formData: FormData) {
  const raw = String(formData.get("batchId") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(raw)) {
    redirect("/more/settings?error=invalid_batch");
  }
  const jar = await cookies();
  jar.set(BATCH_COOKIE, raw, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function saveCeoBridgeSettingsAction(formData: FormData) {
  const ownerRaw = String(formData.get("owner_numbers") ?? "").trim();
  const owner_numbers = ownerRaw
    .split(/[,\n]/g)
    .map((v) => v.replace(/\D/g, ""))
    .filter(Boolean);
  const permissions = formData
    .getAll("permissions")
    .map((v) => String(v).trim().toLowerCase())
    .filter(Boolean);

  await corePost(
    "/api/aiops/ceo/settings",
    {
      owner_numbers,
      permissions,
    },
    { ok: false },
  );

  revalidatePath("/more/settings");
  redirect("/more/settings");
}

export async function appendOutboundMessage(conversationId: string, body: string) {
  const supabase = await createClient();
  const { data: conv, error: cErr } = await supabase
    .from("conversations")
    .select("reset_batch_id, lead_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (cErr) throw new Error(cErr.message);
  if (!conv) throw new Error("Conversation not found");

  const { error: mErr } = await supabase.from("messages").insert({
    reset_batch_id: conv.reset_batch_id,
    conversation_id: conversationId,
    body,
    direction: "out",
  });
  if (mErr) throw new Error(mErr.message);

  const { error: u1 } = await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (u1) throw new Error(u1.message);

  const { error: u2 } = await supabase.from("leads").update({ has_unreplied: false }).eq("id", conv.lead_id);
  if (u2) throw new Error(u2.message);

  revalidatePath("/inbox");
}

export async function createLead(formData: FormData) {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const estRaw = Number(String(formData.get("estimated_value_major") ?? "0"));
  const estimated_value_cents = Number.isFinite(estRaw) ? Math.max(0, Math.round(estRaw * 100)) : 0;

  if (!full_name) {
    redirect("/leads?error=missing_name");
  }

  await corePost(
    "/api/leads/landing-submit",
    {
      name: full_name,
      phone,
      source,
      budget: Math.round(estimated_value_cents / 100),
      status: "new",
    },
    { ok: false },
  );

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/inbox");
  revalidatePath("/pipeline");
  redirect("/leads");
}

export async function createProposalTemplate(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!name || !body) {
    redirect("/more/proposals?error=missing_fields");
  }

  const batchId = await getResetBatchId();
  const supabase = await createClient();
  const { error } = await supabase.from("proposal_templates").insert({
    reset_batch_id: batchId,
    name,
    subject: subject || null,
    body,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/inbox");
  revalidatePath("/more/proposals");
  redirect("/more/proposals");
}

export async function generateProposalForLead(formData: FormData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const scope = String(formData.get("scope") ?? "").trim();
  const budget = Number(String(formData.get("budget") ?? "0"));
  if (!phone) {
    redirect("/more/proposals?error=missing_phone");
  }
  await corePost(
    "/api/sales/proposal/generate",
    { phone, service: service || null, scope: scope || null, budget: Number.isFinite(budget) ? budget : null },
    { ok: false },
  );
  revalidatePath("/more/proposals");
  redirect("/more/proposals");
}

export async function sendProposalTemplateAction(templateId: string, conversationId: string) {
  const batchId = await getResetBatchId();
  const supabase = await createClient();

  const { data: tpl, error: tErr } = await supabase.from("proposal_templates").select("*").eq("id", templateId).maybeSingle();
  if (tErr) throw new Error(tErr.message);
  if (!tpl) throw new Error("Template not found");

  const { data: conv, error: cErr } = await supabase
    .from("conversations")
    .select("id, reset_batch_id, lead_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (cErr) throw new Error(cErr.message);
  if (!conv || conv.reset_batch_id !== batchId) throw new Error("Conversation not found");

  const { data: lead, error: lErr } = await supabase.from("leads").select("*").eq("id", conv.lead_id).maybeSingle();
  if (lErr) throw new Error(lErr.message);
  if (!lead) throw new Error("Lead not found");

  const vars: Record<string, string> = {
    full_name: String(lead.full_name ?? ""),
    phone: String(lead.phone ?? ""),
    source: String(lead.source ?? ""),
  };
  const subject = tpl.subject ? renderProposalTemplate(String(tpl.subject), vars) : "";
  const body = renderProposalTemplate(String(tpl.body), vars);
  const text = subject ? `${subject}\n\n${body}` : body;

  await appendOutboundMessage(conversationId, text);
  if (lead.phone) {
    await corePost(
      "/api/sales/proposal/generate",
      {
        phone: String(lead.phone),
        service: lead.source || "website",
        scope: body,
        budget: Math.round((lead.estimated_value_cents || 0) / 100),
      },
      { ok: false },
    );
  }

  const { error: aErr } = await supabase.from("activities").insert({
    reset_batch_id: batchId,
    lead_id: lead.id,
    kind: "proposal_sent",
    summary: `Sent proposal template: ${tpl.name}`,
    meta: { template_id: templateId, conversation_id: conversationId },
  });
  if (aErr) throw new Error(aErr.message);

  revalidatePath("/inbox");
}

export async function createPaymentLinkAction(input: {
  leadId: string;
  conversationId: string | null;
  amountMajor: number;
  currency: string;
  appendMessage: boolean;
}) {
  const batchId = await getResetBatchId();
  const supabase = await createClient();

  const { data: lead, error: lErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", input.leadId)
    .eq("reset_batch_id", batchId)
    .maybeSingle();
  if (lErr) throw new Error(lErr.message);
  if (!lead) throw new Error("Lead not found");

  const currency = (input.currency || "INR").toUpperCase();
  const amountMinor = Math.max(1, Math.round(Number(input.amountMajor) * 100));
  const core = await corePost<{
    ok: boolean;
    id?: string;
    short_url?: string;
    payment_link?: string;
    amount_paise?: number;
  }>(
    "/api/payments/create-link",
    {
      amount: input.amountMajor,
      phone: lead.phone,
      name: lead.full_name,
      description: `Payment for ${lead.full_name}`.slice(0, 240),
    },
    { ok: false },
  );
  if (!core.ok) throw new Error("Failed to create payment link");
  const checkout = core.short_url || core.payment_link || "";
  const providerRef = String(core.id || "");

  const { data: row, error: pErr } = await supabase
    .from("payment_links")
    .insert({
      reset_batch_id: batchId,
      lead_id: lead.id,
      conversation_id: input.conversationId,
      amount_minor: amountMinor,
      currency,
      status: "pending",
      provider: "razorpay",
      provider_ref: providerRef,
      checkout_url: checkout,
      last_synced_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (pErr) throw new Error(pErr.message);

  if (input.appendMessage && input.conversationId) {
    await appendOutboundMessage(input.conversationId, `Here is your secure payment link: ${checkout}`);
  }

  revalidatePath("/more/payments");
  revalidatePath("/inbox");
  revalidatePath("/");
  return { ok: true as const, id: row.id as string, url: checkout };
}

export async function syncPaymentLinkById(id: string) {
  const batchId = await getResetBatchId();
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("payment_links").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row || row.reset_batch_id !== batchId) throw new Error("Not found");
  if (!row.provider_ref) throw new Error("No provider ref");

  const sync = await coreGet<{ ok: boolean; links?: Array<{ provider_link_id?: string; status?: string; paid_at?: string | null }> }>(
    "/api/payments/dashboard",
    { ok: false, links: [] },
  );
  const remote = (sync.links || []).find((l) => String(l.provider_link_id || "") === String(row.provider_ref || ""));
  const mapped = String(remote?.status || row.status);
  const paid_at =
    mapped === "paid" ? new Date().toISOString() : mapped === "partially_paid" ? new Date().toISOString() : row.paid_at;

  const { error: uErr } = await supabase
    .from("payment_links")
    .update({ status: mapped, paid_at, last_synced_at: new Date().toISOString() })
    .eq("id", id);
  if (uErr) throw new Error(uErr.message);

  revalidatePath("/more/payments");
  revalidatePath("/");
}

export async function syncPendingPaymentLinksAction() {
  const batchId = await getResetBatchId();
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("payment_links")
    .select("*")
    .eq("reset_batch_id", batchId)
    .eq("status", "pending")
    .not("provider_ref", "is", null);
  if (error) throw new Error(error.message);

  await corePost("/api/payments/dashboard", {}, { ok: false });

  revalidatePath("/more/payments");
  revalidatePath("/");
}
