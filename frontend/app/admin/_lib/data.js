function backendDashboardUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
  return `${base.replace(/\/+$/, "")}/dashboard.json`;
}

export function getBackendDashboardUrl() {
  return backendDashboardUrl();
}

export async function getDashboardData() {
  const url = backendDashboardUrl();
  const backendPassword =
    process.env.BACKEND_DASHBOARD_PASSWORD || process.env.DASHBOARD_PASSWORD || "";
  const res = await fetch(url, {
    cache: "no-store",
    headers: backendPassword ? { "X-Dashboard-Password": backendPassword } : undefined,
  });
  if (!res.ok) {
    throw new Error(`Dashboard API error (${res.status})`);
  }
  return res.json();
}
