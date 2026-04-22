import OpenAI from "openai";
import { withRetry } from "../utils/retry.js";
import { log } from "../utils/logger.js";
import { ENV } from "../config/env.js";

const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
  maxRetries: 0,
});

const FAILSAFE =
  process.env.AI_FAILSAFE_MESSAGE ||
  "Got your message 👍 Give me a sec, helping you now.";

const timeoutMs = () =>
  Math.max(5000, Number.parseInt(process.env.OPENAI_TIMEOUT_MS || "25000", 10) || 25_000);

const summaryTimeoutMs = () =>
  Math.max(3000, Number.parseInt(process.env.MEMORY_SUMMARY_TIMEOUT_MS || "12000", 10) || 12_000);

const summaryMaxOut = () =>
  Math.min(300, Math.max(80, Number.parseInt(process.env.MEMORY_SUMMARY_MAX_TOKENS || "140", 10) || 140));

/**
 * Cheap side-call: compress transcript into a short neutral summary (stored in DB).
 */
export async function summarizeConversationTranscript(compactTranscript) {
  if (!ENV.OPENAI_API_KEY) return "";
  const input = String(compactTranscript || "").trim().slice(0, 3200);
  if (!input) return "";

  const sys =
    "Summarize the WhatsApp lead thread for the next reply model. Output max 5 short lines, " +
    "bullet style without markdown headers. Facts only: product/service, budget, timeline, " +
    "objections, stage. No names unless necessary. English or Hinglish as in source.";

  try {
    const text = await withRetry(
      async () => {
        const response = await openai.chat.completions.create({
          model: process.env.MEMORY_SUMMARY_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: `Transcript:\n${input}` },
          ],
          max_tokens: summaryMaxOut(),
          temperature: 0.25,
          timeout: summaryTimeoutMs(),
        });
        return response.choices[0]?.message?.content ?? "";
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.MEMORY_SUMMARY_RETRIES || "1", 10) || 1),
        baseMs: 350,
        maxMs: 6000,
        label: "openai.summarizeConversation",
      }
    );
    return String(text || "")
      .trim()
      .slice(0, 1200);
  } catch (err) {
    log.warn("summarizeConversationTranscript failed", {
      err: err?.message || String(err),
    });
    return "";
  }
}

export async function getAIResponse(prompt) {
  if (!ENV.OPENAI_API_KEY) {
    log.warn("OPENAI_API_KEY missing; returning failsafe copy");
    return FAILSAFE;
  }

  try {
    const text = await withRetry(
      async () => {
        const response = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          timeout: timeoutMs(),
        });
        return response.choices[0]?.message?.content ?? "";
      },
      {
        retries: Math.max(0, Number.parseInt(process.env.OPENAI_RETRIES || "2", 10) || 2),
        baseMs: 400,
        maxMs: 10_000,
        label: "openai.chat.completions",
      }
    );
    const trimmed = String(text || "").trim();
    if (!trimmed) {
      log.warn("OpenAI returned empty content");
      return FAILSAFE;
    }
    return trimmed;
  } catch (err) {
    log.error("OpenAI exhausted retries", {
      err: err?.message || String(err),
      status: err?.status,
    });
    return FAILSAFE;
  }
}
