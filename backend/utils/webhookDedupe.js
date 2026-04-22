import { log } from "./logger.js";

/** waMessageId -> expiry timestamp (ms) */
const seen = new Map();

const ttlMs = () =>
  Math.max(
    60_000,
    Number.parseInt(process.env.WEBHOOK_DEDUPE_TTL_MS || "86400000", 10) || 86_400_000
  );

const maxKeys = () =>
  Math.max(1000, Number.parseInt(process.env.WEBHOOK_DEDUPE_MAX_KEYS || "100000", 10) || 100_000);

function cleanup(now) {
  for (const [id, exp] of seen) {
    if (exp <= now) seen.delete(id);
  }
  const cap = maxKeys();
  while (seen.size > cap) {
    const first = seen.keys().next().value;
    if (first === undefined) break;
    seen.delete(first);
  }
}

/**
 * Synchronously claim a WhatsApp message id for processing.
 * Call before any await in the webhook handler to reduce double-delivery races.
 * @returns {boolean} true = proceed, false = duplicate (respond 200, skip work)
 */
export function claimWaMessageId(waMessageId) {
  if (!waMessageId || typeof waMessageId !== "string") {
    return true;
  }
  const now = Date.now();
  cleanup(now);
  const exp = seen.get(waMessageId);
  if (exp !== undefined && exp > now) {
    log.info("webhook duplicate suppressed", { waMessageId });
    return false;
  }
  seen.set(waMessageId, now + ttlMs());
  return true;
}

/** Call when returning 5xx so Meta retries are not incorrectly treated as duplicates. */
export function releaseWaMessageId(waMessageId) {
  if (waMessageId && typeof waMessageId === "string") {
    seen.delete(waMessageId);
  }
}
