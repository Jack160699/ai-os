const buckets = globalThis.__v2RateLimitBuckets || new Map();
globalThis.__v2RateLimitBuckets = buckets;

export function checkRateLimit({ key, windowMs, max }) {
  const now = Date.now();
  const safeWindow = Number(windowMs) || 60000;
  const safeMax = Number(max) || 60;
  const id = String(key || "global");
  const row = buckets.get(id);

  if (!row || now > row.resetAt) {
    const next = { count: 1, resetAt: now + safeWindow };
    buckets.set(id, next);
    return { ok: true, remaining: safeMax - 1, resetAt: next.resetAt };
  }

  if (row.count >= safeMax) {
    return { ok: false, remaining: 0, resetAt: row.resetAt };
  }

  row.count += 1;
  buckets.set(id, row);
  return { ok: true, remaining: Math.max(0, safeMax - row.count), resetAt: row.resetAt };
}
