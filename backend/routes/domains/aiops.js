import express from "express";
import webhookRoute from "../webhook.js";
import { ENV } from "../../config/env.js";
import {
  executeCeoCommand,
  getCeoBridgeSettings,
  isOwnerNumber,
  updateCeoBridgeSettings,
} from "../../services/ceoBridge.js";
import { getDashboardCore } from "../../services/dashboardMetrics.js";
import { dueFollowups, ensureConversationFlow, fetchLeads, fetchRevenueMetrics } from "../../services/supabase.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ ok: true, domain: "aiops" });
});

router.get("/dashboard/funnel", async (req, res) => {
  const dashboard = await getDashboardCore();
  return res.status(200).json({ ok: true, funnel: dashboard.funnel });
});

router.get("/dashboard/revenue", async (req, res) => {
  const dashboard = await getDashboardCore();
  return res.status(200).json({ ok: true, revenue: dashboard.revenue });
});

router.get("/dashboard/overview", async (req, res) => {
  const dashboard = await getDashboardCore();
  return res.status(200).json({ ok: true, ...dashboard });
});

router.get("/ceo/today-stats", async (req, res) => {
  const dashboard = await getDashboardCore();
  return res.status(200).json({
    ok: true,
    today_stats: {
      total_leads: dashboard.funnel.total_leads,
      qualified: dashboard.funnel.qualified_leads,
      won: dashboard.funnel.won_leads,
      conversion_rate_pct: dashboard.funnel.conversion_rate_pct,
    },
  });
});

router.get("/ceo/hot-leads", async (req, res) => {
  const leads = await fetchLeads(50);
  const hot = leads
    .filter((l) => String(l.temperature || "").toLowerCase() === "hot")
    .sort((a, b) => Number(b.ai_score || 0) - Number(a.ai_score || 0))
    .slice(0, 10)
    .map((l) => ({ phone: l.phone, name: l.name || l.full_name || "Lead", score: l.ai_score || 0 }));
  return res.status(200).json({ ok: true, hot_leads: hot });
});

router.get("/ceo/revenue-summary", async (req, res) => {
  const revenue = await fetchRevenueMetrics();
  return res.status(200).json({ ok: true, revenue_summary: revenue });
});

router.get("/ceo/pending-followups", async (req, res) => {
  const rows = await dueFollowups(Number(req.query.limit || 20));
  return res.status(200).json({ ok: true, pending_followups: rows });
});

router.post("/ceo/command", async (req, res) => {
  const sourcePhone = String(req.body?.source_phone || req.query.phone || "").trim();
  if (sourcePhone) {
    const ok = await isOwnerNumber(sourcePhone);
    if (!ok) {
      return res.status(403).json({ ok: false, error: "unauthorized number" });
    }
  }
  const cmd = String(req.body?.command || "").trim().toLowerCase();
  const source = String(req.body?.source || "typed").trim().toLowerCase() === "interactive" ? "interactive" : "typed";
  if (!cmd) return res.status(400).json({ ok: false, error: "command required" });
  const out = await executeCeoCommand({ command: cmd, phone: sourcePhone || null, source });
  return res.status(200).json(out);
});

router.get("/ceo/settings", async (req, res) => {
  const settings = await getCeoBridgeSettings();
  return res.status(200).json({ ok: true, ...settings });
});

router.post("/ceo/settings", async (req, res) => {
  const out = await updateCeoBridgeSettings({
    owner_numbers: req.body?.owner_numbers,
    permissions: req.body?.permissions,
  });
  return res.status(out.ok ? 200 : 500).json(out);
});

/** Temporary: POST /webhook/debug/message-pipeline — run lead→conversation→message (requires DASHBOARD_PASSWORD). */
router.post("/debug/message-pipeline", async (req, res) => {
  const expected = String(ENV.DASHBOARD_PASSWORD || "").trim();
  const provided = String(
    req.get("x-dashboard-password") || req.get("X-Dashboard-Password") || req.query.password || req.body?.password || "",
  ).trim();
  if (!expected) {
    return res.status(503).json({ ok: false, error: "DASHBOARD_PASSWORD not set; debug endpoint disabled" });
  }
  if (provided !== expected) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  const phone = String(req.body?.phone || "").trim();
  const text = String(req.body?.text ?? "debug pipeline ping").trim();
  const direction = String(req.body?.direction || "in").toLowerCase() === "out" ? "out" : "in";
  if (!phone) {
    return res.status(400).json({ ok: false, error: "body.phone required" });
  }
  try {
    const out = await ensureConversationFlow(phone, text, direction);
    return res.status(200).json({ ok: true, ...out });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

router.use("/", webhookRoute);

export default router;
