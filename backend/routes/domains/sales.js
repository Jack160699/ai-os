import express from "express";
import { fetchProposals, fetchSalesPipeline } from "../../services/supabase.js";
import { acceptProposal, generateProposalFromLead } from "../../services/proposalService.js";
import { runFollowupSweep } from "../../services/followupScheduler.js";
import { updateQualification } from "../../services/salesEngine.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ ok: true, domain: "sales" });
});

router.post("/stage", async (req, res) => {
  const phone = String(req.body?.phone || "").trim();
  const stage = String(req.body?.stage || "").trim();
  if (!phone || !stage) {
    return res.status(400).json({ ok: false, error: "phone and stage are required" });
  }
  const out = await updateQualification(phone, { state: stage, replied: true });
  return res.status(200).json({ ok: true, phone, stage, qualification: out });
});

router.post("/qualify", async (req, res) => {
  const phone = String(req.body?.phone || "").trim();
  if (!phone) return res.status(400).json({ ok: false, error: "phone is required" });
  const out = await updateQualification(phone, req.body || {});
  return res.status(200).json(out);
});

router.post("/proposal/generate", async (req, res) => {
  const phone = String(req.body?.phone || "").trim();
  if (!phone) return res.status(400).json({ ok: false, error: "phone is required" });
  const out = await generateProposalFromLead({
    phone,
    service: req.body?.service,
    scope: req.body?.scope,
    timeline_days: req.body?.timeline_days,
    budget: req.body?.budget,
  });
  return res.status(out.ok ? 200 : 500).json(out);
});

router.post("/proposal/:id/accept", async (req, res) => {
  const id = String(req.params?.id || "").trim();
  if (!id) return res.status(400).json({ ok: false, error: "proposal id required" });
  const out = await acceptProposal(id);
  return res.status(out.ok ? 200 : 500).json(out);
});

router.post("/followups/run", async (req, res) => {
  const limit = Number(req.body?.limit || 20);
  const out = await runFollowupSweep(limit);
  return res.status(200).json(out);
});

router.post("/handoff/hot", async (req, res) => {
  const phone = String(req.body?.phone || "").trim();
  if (!phone) return res.status(400).json({ ok: false, error: "phone is required" });
  const out = await updateQualification(phone, { ...req.body, ready_to_buy: true });
  return res.status(200).json({ ...out, handoff_alert: true });
});

router.get("/pipeline", async (req, res) => {
  const rows = await fetchSalesPipeline(Number(req.query.limit || 200));
  const stages = ["new", "contacted", "qualified", "proposal", "closing", "closed_won", "closed_lost"];
  const grouped = stages.map((stage) => ({
    stage,
    items: rows.filter((r) => String(r.stage || "new") === stage),
  }));
  return res.status(200).json({ ok: true, pipeline: grouped, opportunities: rows });
});

router.get("/proposals", async (req, res) => {
  const rows = await fetchProposals(Number(req.query.limit || 200));
  return res.status(200).json({ ok: true, proposals: rows });
});

export default router;
