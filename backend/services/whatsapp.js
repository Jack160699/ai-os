import axios from "axios";
import { withRetry } from "../utils/retry.js";
import { log } from "../utils/logger.js";
import { ENV } from "../config/env.js";

const MAX_BODY = 4096;
const INTERACTIVE_BODY_MAX = 1023;
const BUTTON_TITLE_MAX = 20;
const LIST_ROW_TITLE_MAX = 24;
const LIST_ROW_DESC_MAX = 72;
const LIST_SECTION_TITLE_MAX = 24;
const LIST_CTA_MAX = 20;

function truncate(text) {
  const s = String(text || "");
  if (s.length <= MAX_BODY) return s;
  return s.slice(0, MAX_BODY - 1) + "…";
}

function clipStr(s, max) {
  const t = String(s || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function normalizeMetaRowId(id) {
  const raw = String(id || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return raw || "action";
}

/**
 * Founder/CEO outbound: try Cloud API interactive (buttons ≤3, list for 4),
 * fall back to plain text on missing config or API error.
 * @param {string} to
 * @param {{ text: string, interactive?: { body?: string, rows: { id: string, title: string, description?: string }[] } | null }} opts
 */
export async function sendFounderOutreach(to, opts = {}) {
  const text = truncate(String(opts.text || ""));
  const spec = opts.interactive;
  const rowsIn = Array.isArray(spec?.rows) ? spec.rows.filter((r) => r && (r.id || r.title)) : [];
  const interactiveOn = String(ENV.CEO_WHATSAPP_INTERACTIVE || "1").trim() !== "0";

  if (!interactiveOn || !rowsIn.length) {
    return sendWhatsApp(to, text);
  }

  const token = ENV.WHATSAPP_TOKEN;
  const phoneId = ENV.PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    return sendWhatsApp(to, text);
  }

  const bodySource = spec.body != null && String(spec.body).trim() ? spec.body : text;
  const bodyText = clipStr(bodySource, INTERACTIVE_BODY_MAX);

  const rows = rowsIn.slice(0, 10).map((r) => ({
    id: normalizeMetaRowId(r.id),
    title: String(r.title || r.id || "Action").trim(),
    description: r.description ? clipStr(r.description, LIST_ROW_DESC_MAX) : undefined,
  }));

  let payload;
  if (rows.length <= 3) {
    payload = {
      messaging_product: "whatsapp",
      to: String(to),
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: rows.map((r) => ({
            type: "reply",
            reply: {
              id: r.id,
              title: clipStr(r.title, BUTTON_TITLE_MAX),
            },
          })),
        },
      },
    };
  } else {
    const sectionRows = rows.map(({ id, title, description }) => {
      const row = { id, title: clipStr(title, LIST_ROW_TITLE_MAX) };
      if (description) row.description = description;
      return row;
    });
    payload = {
      messaging_product: "whatsapp",
      to: String(to),
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: bodyText },
        action: {
          button: clipStr("Choose", LIST_CTA_MAX),
          sections: [
            {
              title: clipStr("Actions", LIST_SECTION_TITLE_MAX),
              rows: sectionRows,
            },
          ],
        },
      },
    };
  }

  try {
    await withRetry(
      async () => {
        await axios.post(`https://graph.facebook.com/v18.0/${phoneId}/messages`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: Math.max(
            5000,
            Number.parseInt(process.env.WHATSAPP_HTTP_TIMEOUT_MS || "20000", 10) || 20_000
          ),
        });
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.WHATSAPP_RETRIES || "2", 10) || 2),
        baseMs: 500,
        maxMs: 12_000,
        label: "whatsapp.interactive",
      }
    );
    return true;
  } catch (err) {
    log.warn("WhatsApp interactive send failed; falling back to text", {
      err: err?.message || String(err),
      data: err?.response?.data,
      status: err?.response?.status,
      to,
    });
    return sendWhatsApp(to, text);
  }
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
