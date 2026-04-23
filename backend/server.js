import express from "express";
import dotenv from "dotenv";
import leadsRoute from "./routes/domains/leads.js";
import salesRoute from "./routes/domains/sales.js";
import paymentsRoute from "./routes/domains/payments.js";
import deliveryRoute from "./routes/domains/delivery.js";
import aiopsRoute from "./routes/domains/aiops.js";
import { ENV, validateStartupConfig } from "./config/env.js";
import { startFollowupScheduler } from "./services/followupScheduler.js";
import {
  fetchLeads,
  fetchPaymentEvents,
  fetchPaymentLinks,
  fetchSalesPipeline,
} from "./services/supabase.js";
import { log } from "./utils/logger.js";

dotenv.config();

validateStartupConfig();

const app = express();

if (ENV.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

app.use(
  express.json({
    limit: ENV.JSON_BODY_LIMIT || "512kb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

app.use("/webhook", aiopsRoute);
app.use("/api/leads", leadsRoute);
app.use("/api/sales", salesRoute);
app.use("/api/payments", paymentsRoute);
app.use("/api/delivery", deliveryRoute);
app.use("/api/aiops", aiopsRoute);

function parseIso(ts) {
  const t = Date.parse(String(ts || ""));
  return Number.isFinite(t) ? t : 0;
}

function readDashboardPassword(req) {
  return (
    req.get("x-dashboard-password")
    || req.get("X-Dashboard-Password")
    || req.query.password
    || ""
  );
}

function assertDashboardAccess(req, res) {
  const expected = String(ENV.DASHBOARD_PASSWORD || "").trim();
  if (!expected) return true;
  const provided = String(readDashboardPassword(req)).trim();
  if (provided === expected) return true;
  log.warn("dashboard.json unauthorized", { path: req.path, ip: req.ip });
  res.status(401).json({ ok: false, error: "unauthorized" });
  return false;
}

app.get("/dashboard.json", async (req, res) => {
  if (!assertDashboardAccess(req, res)) return;
  try {
    const [leads, pipeline, paymentLinks, paymentEvents] = await Promise.all([
      fetchLeads(250),
      fetchSalesPipeline(250),
      fetchPaymentLinks(250),
      fetchPaymentEvents(250),
    ]);

    const nowIso = new Date().toISOString();
    const todayUtc = nowIso.slice(0, 10);

    const recentLeads = (Array.isArray(leads) ? leads : [])
      .map((row) => ({
        phone: row.phone || "-",
        business_type: row.business_type || row.service_interest || "-",
        pain_point: row.notes || row.memory_summary || row.status || "-",
        intent: row.intent || "-",
        intent_score: row.ai_score ?? row.intent_score ?? "-",
        urgency: row.priority || "-",
        summary: row.memory_summary || row.notes || row.status || "-",
        timestamp_utc: row.updated_at || row.created_at || nowIso,
      }))
      .sort((a, b) => parseIso(b.timestamp_utc) - parseIso(a.timestamp_utc))
      .slice(0, 35);

    const recentPipeline = (Array.isArray(pipeline) ? pipeline : [])
      .map((row) => ({
        phone: row.phone || "-",
        business_type: row.business_type || row.service_interest || "-",
        pain_point: row.pain_point || row.notes || "-",
        intent: row.intent || "-",
        intent_score: row.intent_score ?? row.score ?? "-",
        urgency: row.urgency || "-",
        summary: row.summary || row.notes || row.stage || "-",
        followup_stage: row.followup_stage ?? row.stage_order ?? "-",
        status: row.stage || row.status || "active",
        last_reply_time: row.last_contacted_at || row.updated_at || row.created_at || nowIso,
        growth_score: row.intent_score ?? row.score ?? null,
        growth_label: row.temperature || null,
        lead_tags: Array.isArray(row.tags) ? row.tags : [],
        note_preview: row.notes || "",
      }))
      .sort((a, b) => parseIso(b.last_reply_time) - parseIso(a.last_reply_time))
      .slice(0, 35);

    const hotLeads = (Array.isArray(leads) ? leads : [])
      .filter((row) => {
        const isHot = String(row.temperature || "").toLowerCase() === "hot";
        const score = Number(row.ai_score ?? row.intent_score ?? 0);
        return isHot || score >= 70;
      })
      .sort((a, b) => Number(b.ai_score ?? b.intent_score ?? 0) - Number(a.ai_score ?? a.intent_score ?? 0))
      .slice(0, 12)
      .map((row) => ({
        phone: row.phone || "-",
        business_type: row.business_type || row.service_interest || "-",
        pain_point: row.notes || "-",
        intent: row.intent || "-",
        intent_score: row.ai_score ?? row.intent_score ?? "-",
        urgency: row.priority || "-",
        summary: row.memory_summary || row.notes || row.status || "-",
        timestamp_utc: row.updated_at || row.created_at || nowIso,
      }));

    const paymentEventsRecent = Array.isArray(paymentEvents) && paymentEvents.length > 0
      ? paymentEvents.slice(0, 80)
      : (Array.isArray(paymentLinks) ? paymentLinks : []).slice(0, 80).map((row) => ({
          status: row.status || "unknown",
          amount_rupees: Number(row.amount_paise || 0) / 100,
          phone: row.phone || null,
          recorded_at_utc: row.paid_at || row.updated_at || row.created_at || nowIso,
        }));

    const paidRevenueRupees = (Array.isArray(paymentLinks) ? paymentLinks : []).reduce((sum, row) => {
      return String(row.status || "").toLowerCase() === "paid"
        ? sum + Number(row.amount_paise || 0) / 100
        : sum;
    }, 0);
    const newLeadsToday = (Array.isArray(leads) ? leads : []).filter((row) =>
      String(row.created_at || "").startsWith(todayUtc)
    ).length;
    const activeLeads = recentPipeline.filter((row) => {
      const s = String(row.status || "").toLowerCase();
      return !s.includes("closed") && !s.includes("won") && !s.includes("lost");
    }).length;

    log.info("dashboard.json served", {
      leads: recentLeads.length,
      pipeline: recentPipeline.length,
      payments: paymentEventsRecent.length,
    });

    return res.status(200).json({
      updated_at: nowIso,
      summary: {
        new_leads: newLeadsToday,
        active_leads: activeLeads,
        pending_replies: activeLeads,
        paid_revenue_rupees: Math.round(paidRevenueRupees),
      },
      recent_leads: recentLeads,
      recent_pipeline: recentPipeline,
      hot_leads: hotLeads,
      payment_events_recent: paymentEventsRecent,
    });
  } catch (err) {
    log.error("dashboard.json failed", { err: err?.message || String(err) });
    return res.status(500).json({ ok: false, error: "dashboard_failed" });
  }
});

app.get("/", (req, res) => {
  res.send("Server running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    uptime_s: Math.round(process.uptime()),
    verify_token_configured: Boolean(ENV.WHATSAPP_VERIFY_TOKEN),
    openai_configured: Boolean(ENV.OPENAI_API_KEY),
    whatsapp_configured: Boolean(ENV.WHATSAPP_TOKEN && ENV.PHONE_NUMBER_ID),
    supabase_configured: Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_KEY),
    primary_frontend: ENV.ADMIN_FRONTEND_APP,
  });
});

const PORT = Number.parseInt(ENV.PORT || "3000", 10) || 3000;

const server = app.listen(PORT, () => {
  log.info("Server listening", { port: PORT });
  startFollowupScheduler();
});

server.on("error", (err) => {
  log.error("Server failed to listen", {
    err: err?.message || String(err),
    code: err?.code,
    port: PORT,
  });
  process.exit(1);
});
