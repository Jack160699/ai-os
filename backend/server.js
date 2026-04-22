import express from "express";
import dotenv from "dotenv";
import leadsRoute from "./routes/domains/leads.js";
import salesRoute from "./routes/domains/sales.js";
import paymentsRoute from "./routes/domains/payments.js";
import deliveryRoute from "./routes/domains/delivery.js";
import aiopsRoute from "./routes/domains/aiops.js";
import { ENV, validateStartupConfig } from "./config/env.js";
import { startFollowupScheduler } from "./services/followupScheduler.js";
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
