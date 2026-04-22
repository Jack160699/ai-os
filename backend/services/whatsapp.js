import axios from "axios";
import { withRetry } from "../utils/retry.js";
import { log } from "../utils/logger.js";
import { ENV } from "../config/env.js";

const MAX_BODY = 4096;

function truncate(text) {
  const s = String(text || "");
  if (s.length <= MAX_BODY) return s;
  return s.slice(0, MAX_BODY - 1) + "…";
}

export async function sendWhatsApp(to, message) {
  const token = ENV.WHATSAPP_TOKEN;
  const phoneId = ENV.PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    log.error("WhatsApp not configured (WHATSAPP_TOKEN or PHONE_NUMBER_ID missing)");
    return false;
  }

  const body = truncate(message);

  try {
    await withRetry(
      async () => {
        await axios.post(
          `https://graph.facebook.com/v18.0/${phoneId}/messages`,
          {
            messaging_product: "whatsapp",
            to: String(to),
            text: { body: body },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: Math.max(
              5000,
              Number.parseInt(process.env.WHATSAPP_HTTP_TIMEOUT_MS || "20000", 10) || 20_000
            ),
          }
        );
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.WHATSAPP_RETRIES || "2", 10) || 2),
        baseMs: 500,
        maxMs: 12_000,
        label: "whatsapp.send",
      }
    );
    return true;
  } catch (err) {
    log.error("WhatsApp send failed after retries", {
      err: err?.message || String(err),
      data: err?.response?.data,
      status: err?.response?.status,
      to,
    });
    return false;
  }
}
