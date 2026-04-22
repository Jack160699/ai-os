import { fetchLeadByPhone, saveProposal, setProposalAccepted, upsertSalesOpportunity } from "./supabase.js";

export async function generateProposalFromLead({ phone, service, scope, timeline_days, budget }) {
  const lead = await fetchLeadByPhone(phone);
  const baseBudget = Number(budget || lead?.budget || 0);
  const timeline = Number(timeline_days || 14);
  const serviceName = String(service || lead?.service || "website + automation");
  const scopeText = String(scope || "Discovery, build, integrations, QA, handoff");

  const row = {
    phone,
    lead_phone: phone,
    title: `${serviceName} proposal`,
    service: serviceName,
    scope: scopeText,
    timeline_days: timeline,
    amount_inr: baseBudget > 0 ? baseBudget : null,
    status: "sent",
    generated_from: "lead_data",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const out = await saveProposal(row);
  if (out.ok) {
    await upsertSalesOpportunity({
      phone,
      stage: "proposal",
      qualification_state: "proposal_sent",
      proposal_id: out.proposal?.id || null,
      updated_at: new Date().toISOString(),
      next_followup_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  return out;
}

export async function acceptProposal(proposalId) {
  const out = await setProposalAccepted(proposalId);
  if (out.ok && out.proposal?.phone) {
    await upsertSalesOpportunity({
      phone: out.proposal.phone,
      stage: "closing",
      qualification_state: "proposal_sent",
      proposal_id: proposalId,
      updated_at: new Date().toISOString(),
    });
  }
  return out;
}
