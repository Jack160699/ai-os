import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Logo } from "@/app/components/Logo";

export const metadata = {
  title: "Admin Dashboard - Stratxcel",
  robots: { index: false, follow: false },
};

const AUTH_COOKIE = "sx_site_admin_auth";

function backendDashboardUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
  return `${base.replace(/\/+$/, "")}/dashboard.json`;
}

async function loginAction(formData) {
  "use server";
  const expected = process.env.ADMIN_DASHBOARD_PASSWORD || "";
  const submitted = String(formData.get("password") || "").trim();
  if (expected && submitted === expected) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, expected, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
      path: "/",
    });
  }
  redirect("/admin");
}

async function logoutAction() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", { maxAge: 0, path: "/" });
  redirect("/admin");
}

async function getDashboardData() {
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

function KpiCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-[1.85rem]">{value}</p>
      <p className="mt-1 text-[12px] text-slate-400">{hint}</p>
    </div>
  );
}

export default async function AdminPage() {
  const expectedPassword = process.env.ADMIN_DASHBOARD_PASSWORD || "";
  const cookieStore = await cookies();
  const authed = !expectedPassword || cookieStore.get(AUTH_COOKIE)?.value === expectedPassword;

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#0B1220] px-4 py-14 text-slate-100 sm:px-6">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-7">
          <Logo variant="dark" />
          <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Internal access only.</p>
          <form action={loginAction} className="mt-5 space-y-3">
            <input
              name="password"
              type="password"
              placeholder="Password"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/30"
            />
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#45C4FF] to-[#1E3A8A] text-sm font-semibold text-white transition hover:brightness-110"
            >
              Open Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  let data;
  let error = "";
  try {
    data = await getDashboardData();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load dashboard data";
  }

  const summary = data?.summary || {};
  const trend = Array.isArray(data?.trend_7d) ? data.trend_7d : [];
  const painPoints = Array.isArray(data?.top_pain_points) ? data.top_pain_points : [];
  const recentLeads = Array.isArray(data?.recent_leads) ? data.recent_leads : [];
  const hotLeads = Array.isArray(data?.hot_leads) ? data.hot_leads : [];
  const trendMax = Math.max(1, ...trend.map((d) => d.count || 0));
  const painMax = Math.max(1, ...painPoints.map((d) => d.count || 0));

  return (
    <main className="min-h-screen bg-[#0B1220] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <Logo variant="dark" />
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Lead Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Real-time lead capture and conversion metrics.</p>
          </div>
          <form action={logoutAction}>
            <button className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.05]">
              Logout
            </button>
          </form>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            Could not load `{backendDashboardUrl()}`: {error}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Daily Leads" value={summary.daily_leads ?? 0} hint={`30-day total: ${summary.total_30d ?? 0}`} />
          <KpiCard label="Hot Leads" value={summary.hot_leads_count ?? 0} hint="High intent and priority pain points" />
          <KpiCard label="Booking Rate" value={`${summary.booking_rate ?? 0}%`} hint={`Bookings: ${summary.bookings_total ?? 0}`} />
          <KpiCard label="Completion Rate" value={`${summary.completion_rate ?? 0}%`} hint={`Drop-off: ${summary.drop_off ?? 0}`} />
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-sm font-semibold text-white">7 Day Leads</p>
            <div className="mt-4 flex h-40 items-end gap-2 sm:gap-3">
              {trend.map((point) => (
                <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-[#1E3A8A] to-[#45C4FF]"
                      style={{ height: `${Math.max(8, ((point.count || 0) / trendMax) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">{point.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-sm font-semibold text-white">Top Pain Points</p>
            <div className="mt-4 space-y-3">
              {painPoints.length === 0 ? (
                <p className="text-sm text-slate-400">No data yet.</p>
              ) : (
                painPoints.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-300">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#45C4FF] to-[#1E3A8A]"
                        style={{ width: `${Math.max(5, ((item.count || 0) / painMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold text-white">Recent Leads</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 sm:px-5">Phone</th>
                    <th className="px-4 py-3 sm:px-5">Business Type</th>
                    <th className="px-4 py-3 sm:px-5">Pain Point</th>
                    <th className="px-4 py-3 sm:px-5">Intent</th>
                    <th className="px-4 py-3 sm:px-5">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-slate-400 sm:px-5" colSpan={5}>
                        No leads yet.
                      </td>
                    </tr>
                  ) : (
                    recentLeads.map((lead, i) => (
                      <tr key={`${lead.phone || "p"}-${lead.timestamp_utc || i}`} className="border-t border-white/5">
                        <td className="px-4 py-3 sm:px-5">{lead.phone || "-"}</td>
                        <td className="px-4 py-3 text-slate-300 sm:px-5">{lead.business_type || "-"}</td>
                        <td className="px-4 py-3 text-slate-300 sm:px-5">{lead.pain_point || "-"}</td>
                        <td className="px-4 py-3 sm:px-5">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200">{lead.intent || "-"}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 sm:px-5">
                          {String(lead.timestamp_utc || "-").slice(0, 16).replace("T", " ")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-sm font-semibold text-white">Hot Leads Priority</p>
            <ul className="mt-3 space-y-2">
              {hotLeads.length === 0 ? (
                <li className="text-sm text-slate-400">No hot leads yet.</li>
              ) : (
                hotLeads.map((lead, i) => (
                  <li key={`${lead.phone || "h"}-${lead.timestamp_utc || i}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-sm font-semibold text-white">{lead.phone || "-"}</p>
                    <p className="mt-1 text-xs text-slate-300">
                      {lead.business_type || "-"} · {lead.pain_point || "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Intent: {lead.intent || "-"} · {String(lead.timestamp_utc || "-").slice(0, 16).replace("T", " ")}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

