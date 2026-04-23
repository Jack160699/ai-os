import { adminApiHeaders, backendBase } from "@/app/admin/_lib/backendFetch";

function backendDashboardUrl() {
  return `${backendBase()}/dashboard.json`;
}

export function getBackendDashboardUrl() {
  return backendDashboardUrl();
}

export async function getDashboardData() {
  const url = backendDashboardUrl();
  const res = await fetch(url, {
    cache: "no-store",
    headers: adminApiHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Dashboard API error (${res.status})`);
  }
  return res.json();
}
