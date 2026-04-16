/**
 * Razorpay checkout — same-origin `/api/*` first, then Flask (CORS must allow).
 */

const DEFAULT_FLASK_ORIGIN = "https://bot.stratxcel.ai";

export function getDirectCheckoutOrigin() {
  const raw =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_CHECKOUT_API_BASE || process.env.NEXT_PUBLIC_BOT_API_URL || "")) ||
    "";
  const trimmed = String(raw).trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_FLASK_ORIGIN;
}

/**
 * @param {string} path - "/api/create-order" or "/api/payment-success"
 * @param {object} body
 * @returns {Promise<Response>}
 */
export async function checkoutFetch(path, body) {
  const relativeUrl = path.startsWith("/") ? path : `/${path}`;
  const directBase = getDirectCheckoutOrigin();
  const directUrl = `${directBase}${relativeUrl}`;

  const tryRelativeFirst = process.env.NEXT_PUBLIC_CHECKOUT_RELATIVE_FIRST !== "0";

  const attempts = tryRelativeFirst
    ? [
        { url: relativeUrl, label: "next" },
        { url: directUrl, label: "flask" },
      ]
    : [
        { url: directUrl, label: "flask" },
        { url: relativeUrl, label: "next" },
      ];

  let lastRes = /** @type {Response | null} */ (null);
  for (const { url } of attempts) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
      cache: "no-store",
    });
    lastRes = res;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const looksJson = ct.includes("application/json");
    if (res.status === 404 || (url === relativeUrl && res.ok && !looksJson)) {
      continue;
    }
    return res;
  }
  return lastRes;
}

/**
 * @param {Response} res
 * @returns {Promise<{ ok: boolean, data: object, status: number }>}
 */
export async function parseCheckoutJson(res) {
  const status = res.status;
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const text = await res.text().catch(() => "");
  if (!text.trim()) {
    return { ok: res.ok, data: { error: "empty_response" }, status };
  }
  if (!ct.includes("application/json")) {
    return {
      ok: false,
      data: { error: "server_returned_non_json", detail: text.slice(0, 120) },
      status,
    };
  }
  try {
    const data = JSON.parse(text);
    return { ok: res.ok, data: data && typeof data === "object" ? data : {}, status };
  } catch {
    return { ok: false, data: { error: "invalid_json" }, status };
  }
}
