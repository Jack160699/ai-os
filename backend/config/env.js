import { log } from "../utils/logger.js";

function pick(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export const ENV = {
  PORT: pick(process.env.PORT, "3000"),
  NODE_ENV: pick(process.env.NODE_ENV, "development"),
  TRUST_PROXY: pick(process.env.TRUST_PROXY, "0"),
  JSON_BODY_LIMIT: pick(process.env.JSON_BODY_LIMIT, "512kb"),
  LOG_LEVEL: pick(process.env.LOG_LEVEL, "info"),
  ADMIN_FRONTEND_APP: pick(process.env.ADMIN_FRONTEND_APP, "stratxcel-os"),
  WHATSAPP_VERIFY_TOKEN: pick(process.env.WHATSAPP_VERIFY_TOKEN),
  WHATSAPP_APP_SECRET: pick(process.env.WHATSAPP_APP_SECRET),
  WHATSAPP_TOKEN: pick(process.env.WHATSAPP_TOKEN),
  PHONE_NUMBER_ID: pick(process.env.PHONE_NUMBER_ID, process.env.WHATSAPP_PHONE_NUMBER_ID),
  OPENAI_API_KEY: pick(process.env.OPENAI_API_KEY),
  AI_BOT_NAME: pick(process.env.AI_BOT_NAME, "Stratxcel AI Growth Partner"),
  NEXT_PUBLIC_SUPABASE_URL: pick(process.env.NEXT_PUBLIC_SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: pick(process.env.SUPABASE_SERVICE_ROLE_KEY),
  RAZORPAY_LIVE_KEY_ID: pick(
    process.env.RAZORPAY_LIVE_KEY_ID,
    process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID
  ),
  RAZORPAY_LIVE_KEY_SECRET: pick(process.env.RAZORPAY_LIVE_KEY_SECRET),
  RAZORPAY_WEBHOOK_SECRET: pick(
    process.env.RAZORPAY_LIVE_WEBHOOK_SECRET,
    process.env.RAZORPAY_WEBHOOK_SECRET
  ),
  OWNER_WHATSAPP_NUMBERS: pick(process.env.OWNER_WHATSAPP_NUMBERS),
  CEO_COMMAND_PERMISSIONS: pick(process.env.CEO_COMMAND_PERMISSIONS),
  DASHBOARD_PASSWORD: pick(process.env.DASHBOARD_PASSWORD, process.env.BACKEND_DASHBOARD_PASSWORD),
  /** Set to "0" to force plain-text menus for founder/CEO replies (no Cloud API interactives). */
  CEO_WHATSAPP_INTERACTIVE: pick(process.env.CEO_WHATSAPP_INTERACTIVE, "1"),
};

export function validateStartupConfig() {
  const required = [
    ["WHATSAPP_VERIFY_TOKEN", ENV.WHATSAPP_VERIFY_TOKEN],
    ["WHATSAPP_TOKEN", ENV.WHATSAPP_TOKEN],
    ["PHONE_NUMBER_ID|WHATSAPP_PHONE_NUMBER_ID", ENV.PHONE_NUMBER_ID],
  ];
  const missing = required.filter(([, val]) => !val).map(([key]) => key);
  if (missing.length) {
    log.warn("startup env missing", { missing });
  }
}
