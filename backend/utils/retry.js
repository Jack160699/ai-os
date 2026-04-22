import { log } from "./logger.js";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function defaultIsRetryable(err) {
  const status = err?.response?.status ?? err?.status;
  if (status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  const code = err?.code;
  if (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ECONNABORTED" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN"
  ) {
    return true;
  }
  if (err?.name === "APIConnectionTimeoutError") return true;
  return false;
}

/**
 * Retry async fn with exponential backoff + jitter.
 */
export async function withRetry(fn, options = {}) {
  const {
    retries = 3,
    baseMs = 300,
    maxMs = 8000,
    label = "operation",
    isRetryable = defaultIsRetryable,
  } = options;

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retry = attempt < retries && isRetryable(err);
      log.warn(`${label} failed`, {
        attempt: attempt + 1,
        retries: retries + 1,
        retry,
        err: err?.message || String(err),
        status: err?.response?.status ?? err?.status,
      });
      if (!retry) break;
      const cap = Math.min(maxMs, baseMs * 2 ** attempt);
      const jitter = Math.floor(Math.random() * 200);
      await sleep(cap + jitter);
    }
  }
  throw lastErr;
}
