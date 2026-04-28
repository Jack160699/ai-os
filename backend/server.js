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
  backfillMessagesFromLeadSummaries,
  fetchMessages,
  fetchLeads,
  fetchLeadMemoryRows,
  fetchPaymentEvents,
  fetchPaymentLinks,
  fetchSalesPipeline,
  fetchRecentMessages,
  saveMessage,
} from "./services/supabase.js";
import { sendWhatsApp } from "./services/whatsapp.js";
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
    const [leadMemory, leads, pipeline, paymentLinks, paymentEvents] = await Promise.all([
      fetchLeadMemoryRows(500),
      fetchLeads(250),
      fetchSalesPipeline(250),
      fetchPaymentLinks(250),
      fetchPaymentEvents(250),
    ]);

    const nowIso = new Date().toISOString();
    const todayUtc = nowIso.slice(0, 10);

    const memoryRows = Array.isArray(leadMemory) ? leadMemory : [];
    const recentLeads = memoryRows
      .map((row) => ({
        phone: row.phone || "-",
        business_type: row.business_type || row.service_interest || "-",
        pain_point: row.last_summary || row.stage || "-",
        intent: row.buyer_type || "-",
        intent_score: row.intent_score ?? "-",
        urgency: row.next_followup_at ? "scheduled" : "-",
        summary: row.last_summary || row.stage || "-",
        timestamp_utc: row.updated_at || row.created_at || nowIso,
      }))
      .sort((a, b) => parseIso(b.timestamp_utc) - parseIso(a.timestamp_utc))
      .slice(0, 35);

    const recentPipeline = (memoryRows.length ? memoryRows : (Array.isArray(pipeline) ? pipeline : []))
      .map((row) => ({
        phone: row.phone || "-",
        business_type: row.business_type || row.service_interest || "-",
        pain_point: row.pain_point || row.last_summary || row.notes || "-",
        intent: row.intent || row.buyer_type || "-",
        intent_score: row.intent_score ?? row.score ?? row.ai_score ?? "-",
        urgency: row.urgency || (row.next_followup_at ? "scheduled" : "-"),
        summary: row.summary || row.last_summary || row.notes || row.stage || "-",
        followup_stage: row.followup_stage ?? row.stage_order ?? row.stage ?? "-",
        status: row.stage || row.status || "active",
        last_reply_time: row.last_contacted_at || row.updated_at || row.created_at || nowIso,
        growth_score: row.intent_score ?? row.score ?? null,
        growth_label: row.temperature || null,
        lead_tags: Array.isArray(row.tags) ? row.tags : [],
        note_preview: row.notes || "",
      }))
      .sort((a, b) => parseIso(b.last_reply_time) - parseIso(a.last_reply_time))
      .slice(0, 35);

    const hotLeads = (memoryRows.length ? memoryRows : (Array.isArray(leads) ? leads : []))
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
    const leadSourceRows = memoryRows.length ? memoryRows : (Array.isArray(leads) ? leads : []);
    const newLeadsToday = leadSourceRows.filter((row) =>
      String(row.created_at || row.updated_at || "").startsWith(todayUtc)
    ).length;
    const activeLeads = recentPipeline.filter((row) => {
      const s = String(row.status || "").toLowerCase();
      return !s.includes("closed") && !s.includes("won") && !s.includes("lost");
    }).length;

    log.info("dashboard.json served", {
      leads: leadSourceRows.length,
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

app.get("/api/chats", async (req, res) => {
  if (!assertDashboardAccess(req, res)) return;
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const temperature = String(req.query.temperature || "all").toLowerCase();
    const unreadOnly = String(req.query.unread_only || "") === "1";
    const [messages, memoryRows] = await Promise.all([fetchMessages(2500), fetchLeadMemoryRows(800)]);
    const memByPhone = new Map((Array.isArray(memoryRows) ? memoryRows : []).map((r) => [String(r.phone || ""), r]));
    const byPhone = new Map();
    for (const row of Array.isArray(messages) ? messages : []) {
      const phone = String(row.phone || "").replace(/\D/g, "");
      if (!phone) continue;
      if (!byPhone.has(phone)) byPhone.set(phone, []);
      byPhone.get(phone).push(row);
    }
    let conversations = Array.from(byPhone.entries()).map(([phone, rows]) => {
      const latest = rows[0] || {};
      const mem = memByPhone.get(phone) || {};
      const inferredTemp = Number(mem.intent_score || 0) >= 70 ? "hot" : Number(mem.intent_score || 0) >= 35 ? "warm" : "cold";
      const unread = rows.filter((m) => String(m.sender || "").toLowerCase() === "user").length > 0 ? 1 : 0;
      return {
        phone,
        name: mem.name || mem.profile_name || "Lead",
        temperature: String(mem.temperature || inferredTemp || "warm").toLowerCase(),
        unread,
        last_message: latest.text || "",
        last_time: latest.created_at || new Date().toISOString(),
      };
    });
    if (q) {
      conversations = conversations.filter((c) =>
        String(c.phone).includes(q) || String(c.name || "").toLowerCase().includes(q) || String(c.last_message || "").toLowerCase().includes(q)
      );
    }
    if (temperature && temperature !== "all") {
      conversations = conversations.filter((c) => String(c.temperature || "").toLowerCase() === temperature);
    }
    if (unreadOnly) {
      conversations = conversations.filter((c) => Number(c.unread || 0) > 0);
    }
    conversations.sort((a, b) => parseIso(b.last_time) - parseIso(a.last_time));
    log.info("api.chats served", { count: conversations.length });
    return res.status(200).json({ conversations, updated_at: new Date().toISOString() });
  } catch (err) {
    log.error("api.chats failed", { err: err?.message || String(err) });
    return res.status(500).json({ error: "inbox_failed" });
  }
});

app.get("/inbox/lead/:phone", async (req, res) => {
  if (!assertDashboardAccess(req, res)) return;
  const phone = String(req.params.phone || "").replace(/\D/g, "");
  if (!phone) return res.status(400).json({ error: "invalid_phone" });
  try {
    const [memRows, transcriptRows] = await Promise.all([
      fetchLeadMemoryRows(1000),
      fetchRecentMessages(phone, 200),
    ]);
    const state = (Array.isArray(memRows) ? memRows : []).find((r) => String(r.phone || "").replace(/\D/g, "") === phone) || {};
    const messages = (Array.isArray(transcriptRows) ? transcriptRows : [])
      .map((row) => ({
        id: row.id || `${phone}-${row.created_at || Date.now()}`,
        sender: String(row.sender || "").toLowerCase() === "user" ? "user" : "admin",
        text: row.text || "",
        created_at: row.created_at || new Date().toISOString(),
      }))
      .sort((a, b) => parseIso(a.created_at) - parseIso(b.created_at));
    const transcript = messages.map((row) => ({
      id: row.id,
      sender: row.sender,
      role: String(row.sender || "").toLowerCase() === "user" ? "user" : "assistant",
      text: row.text || "",
      timestamp_utc: row.created_at || new Date().toISOString(),
    }));
    return res.status(200).json({
      phone,
      message_count: messages.length,
      state: {
        profile_name: state.name || "Lead",
        tags: Array.isArray(state.tags) ? state.tags : [],
      },
      messages,
      transcript,
      suggestions: [],
    });
  } catch (err) {
    log.error("inbox.lead failed", { err: err?.message || String(err), phone });
    return res.status(500).json({ error: "inbox_lead_failed" });
  }
});

app.get("/api/messages/:phone", async (req, res) => {
  if (!assertDashboardAccess(req, res)) return;
  const phone = String(req.params.phone || "").replace(/\D/g, "");
  if (!phone) return res.status(400).json({ error: "invalid_phone" });
  try {
    const rows = await fetchRecentMessages(phone, 500);
    const messages = (Array.isArray(rows) ? rows : [])
      .map((row) => ({
        id: row.id || `${phone}-${row.created_at || Date.now()}`,
        phone,
        sender: String(row.sender || "").toLowerCase() === "user" ? "user" : "admin",
        text: String(row.text || ""),
        created_at: row.created_at || new Date().toISOString(),
      }))
      .sort((a, b) => parseIso(a.created_at) - parseIso(b.created_at));
    const transcript = messages.map((row) => ({
      id: row.id,
      sender: row.sender,
      role: row.sender === "user" ? "user" : "assistant",
      text: row.text,
      timestamp_utc: row.created_at,
    }));
    const realCount = messages.length;
    return res.status(200).json({
      phone,
      message_count: realCount,
      source_used: "messages_table",
      real_count: realCount,
      fallback_used: false,
      messages,
      transcript,
    });
  } catch (err) {
    log.error("api.messages failed", { err: err?.message || String(err), phone });
    return res.status(500).json({ error: "messages_failed" });
  }
});

app.post("/inbox/mark-read", async (req, res) => {
  if (!assertDashboardAccess(req, res)) return;
  return res.status(200).json({ ok: true });
});

app.post("/inbox/suggest", async (req, res) => {
  if (!assertDashboardAccess(req, res)) return;
  return res.status(200).json({ suggestions: [] });
});

app.post("/inbox/action", async (req, res) => {
  if (!assertDashboardAccess(req, res)) return;
  return res.status(200).json({ ok: true });
});

app.post("/inbox/reply", async (req, res) => {
  if (!assertDashboardAccess(req, res)) return;
  const phone = String(req.body?.phone || "").replace(/\D/g, "");
  const text = String(req.body?.message || req.body?.text || "").trim();
  if (!phone || !text) return res.status(400).json({ ok: false, error: "invalid_payload" });
  try {
    await saveMessage(phone, text, "admin");
    console.log("saved outgoing message", { phone, sender: "admin", context: "inbox_reply" });
    const ok = await sendWhatsApp(phone, text);
    return res.status(ok ? 200 : 502).json({ ok });
  } catch (err) {
    log.error("inbox.reply failed", { err: err?.message || String(err), phone });
    return res.status(500).json({ ok: false, error: "reply_failed" });
  }
});

app.post("/api/messages/backfill-summaries", async (req, res) => {
  if (!assertDashboardAccess(req, res)) return;
  const limit = Number.parseInt(String(req.body?.limit || req.query?.limit || "300"), 10) || 300;
  const dryRun = String(req.body?.dry_run ?? req.query?.dry_run ?? "0") === "1";
  try {
    const out = await backfillMessagesFromLeadSummaries(limit, dryRun);
    return res.status(out.ok ? 200 : 500).json(out);
  } catch (err) {
    log.error("api.messages.backfill failed", { err: err?.message || String(err) });
    return res.status(500).json({ ok: false, error: "messages_backfill_failed" });
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
