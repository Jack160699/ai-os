import express from "express";
import { captureLead } from "../../services/leadCapture.js";
import { fetchFunnelMetrics, fetchLeads } from "../../services/supabase.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ ok: true, domain: "leads" });
});

router.post("/capture", async (req, res) => {
  const out = await captureLead(req.body || {});
  if (!out.ok) {
    return res.status(400).json(out);
  }
  return res.status(200).json(out);
});

router.post("/landing-submit", async (req, res) => {
  const body = req.body || {};
  const out = await captureLead({
    ...body,
    source: body.source || body.utm_source || "landing_page",
    status: body.status || "new",
  });
  if (!out.ok) return res.status(400).json(out);
  return res.status(200).json(out);
});

router.get("/board", async (req, res) => {
  const metrics = await fetchFunnelMetrics();
  return res.status(200).json({ ok: true, board: metrics.by_status, total: metrics.total });
});

router.get("/list", async (req, res) => {
  const limit = Number(req.query.limit || 200);
  const status = String(req.query.status || "").trim();
  let rows = await fetchLeads(limit);
  if (status) {
    rows = rows.filter((r) => String(r.status || "") === status);
  }
  const hot = rows
    .filter((r) => String(r.temperature || "").toLowerCase() === "hot")
    .sort((a, b) => Number(b.ai_score || 0) - Number(a.ai_score || 0));
  const rest = rows.filter((r) => String(r.temperature || "").toLowerCase() !== "hot");
  return res.status(200).json({ ok: true, leads: [...hot, ...rest] });
});

export default router;
