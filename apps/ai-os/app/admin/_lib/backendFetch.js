export function backendBase() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000").replace(/\/+$/, "");
}

/** Headers for server-side proxy calls to Flask (dashboard / inbox). */
export function adminApiHeaders() {
  const pwd = process.env.BACKEND_DASHBOARD_PASSWORD || process.env.DASHBOARD_PASSWORD || "";
  const h = { "Content-Type": "application/json" };
  if (pwd) {
    h["X-Dashboard-Password"] = pwd;
  }
  return h;
}
