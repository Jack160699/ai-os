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

function MiniBars({ title, points, emptyHint = "No data yet." }) {
  const list = Array.isArray(points) ? points : [];
  const max = Math.max(1, ...list.map((d) => Number(d.count) || 0));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{emptyHint}</p>
      ) : (
        <div className="mt-4 flex h-40 items-end gap-2 sm:gap-3">
          {list.map((point) => (
            <div key={String(point.date)} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-[#7C3AED] to-[#A78BFA]"
                  style={{ height: `${Math.max(8, ((Number(point.count) || 0) / max) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">{point.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FunnelBars({ title, items }) {
  const list = Array.isArray(items) ? items : [];
  const max = Math.max(1, ...list.map((d) => Number(d.count) || 0));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No funnel data.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {list.map((step) => (
            <div key={String(step.label)}>
              <div className="mb-1.5 flex items-center justify-between text-xs text-slate-300">
                <span>{step.label}</span>
                <span>{step.count ?? 0}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#F97316] to-[#FB923C]"
                  style={{ width: `${Math.max(5, ((Number(step.count) || 0) / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PIE_COLORS = ["#F97316", "#38BDF8", "#94A3B8"];

function ScorePie({ title, segments }) {
  const list = Array.isArray(segments) ? segments : [];
  const total = list.reduce((s, x) => s + (Number(x.count) || 0), 0);
  if (total <= 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-4 text-sm text-slate-400">No score distribution yet.</p>
      </div>
    );
  }
  let acc = 0;
  const parts = [];
  for (let i = 0; i < list.length; i++) {
    const c = Number(list[i].count) || 0;
    const deg = (c / total) * 360;
    const start = acc;
    acc += deg;
    parts.push(`${PIE_COLORS[i % PIE_COLORS.length]} ${start.toFixed(2)}deg ${acc.toFixed(2)}deg`);
  }
  const gradient = `conic-gradient(from -90deg, ${parts.join(", ")})`;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
        <div
          className="h-36 w-36 shrink-0 rounded-full border border-white/10 shadow-[0_0_0_10px_rgba(255,255,255,0.04)_inset]"
          style={{ background: gradient }}
        />
        <ul className="w-full max-w-xs space-y-2 text-sm">
          {list.map((x, i) => (
            <li key={String(x.label)} className="flex items-center justify-between gap-2 text-slate-300">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {x.label}
              </span>
              <span className="text-slate-400">{x.count ?? 0}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function mergeRecentTableRows(data) {
  const pipeline = Array.isArray(data?.recent_pipeline) ? data.recent_pipeline : [];
  const completed = Array.isArray(data?.recent_leads) ? data.recent_leads : [];
  const rows = [];

  for (const r of pipeline) {
    rows.push({
      phone: r.phone ?? "-",
      business_type: r.business_type ?? "-",
      pain_point: r.pain_point ?? "-",
      intent: r.intent ?? "-",
      intent_score: r.intent_score ?? "-",
      urgency: r.urgency ?? "-",
      summary: r.summary ?? "-",
      followup_stage: r.followup_stage ?? "-",
      status: r.status ?? "-",
      sort_ts: r.last_reply_time || "",
    });
  }
  for (const e of completed) {
    rows.push({
      phone: e.phone ?? "-",
      business_type: e.business_type ?? "-",
      pain_point: e.pain_point ?? "-",
      intent: e.intent ?? "-",
      intent_score: e.intent_score ?? "-",
      urgency: e.urgency ?? "-",
      summary: e.summary ?? "-",
      followup_stage: "-",
      status: "completed",
      sort_ts: e.timestamp_utc || "",
    });
  }
  rows.sort((a, b) => String(b.sort_ts).localeCompare(String(a.sort_ts)));
  return rows.slice(0, 35);
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
  const hotLeads = Array.isArray(data?.hot_leads) ? data.hot_leads : [];
  const followupsByDay = Array.isArray(data?.followups_by_day) ? data.followups_by_day : [];
  const funnel = Array.isArray(data?.funnel) ? data.funnel : [];
  const scorePie = Array.isArray(data?.score_pie) ? data.score_pie : [];
  const recentRows = data ? mergeRecentTableRows(data) : [];

  const trendMax = Math.max(1, ...trend.map((d) => d.count || 0));
  const painMax = Math.max(1, ...painPoints.map((d) => d.count || 0));

  const conversionPct = summary.conversion_rate_pct ?? summary.conversion_rate ?? 0;

  return (
    <main className="min-h-screen bg-[#0B1220] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <Logo variant="dark" />
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Lead Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Real-time lead capture, follow-ups, and conversion.</p>
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

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <KpiCard label="Follow-ups sent" value={summary.followups_sent ?? 0} hint="Automated nudges logged" />
          <KpiCard label="Replied after follow-up" value={summary.replied_after_followup ?? 0} hint="Re-opened threads" />
          <KpiCard label="Revival conversions" value={summary.revival_conversions ?? 0} hint="Reply after a nudge" />
          <KpiCard label="Hot leads" value={summary.hot_leads_count ?? 0} hint="Priority preview list size" />
          <KpiCard label="Active leads" value={summary.active_leads ?? 0} hint="In funnel (open)" />
          <KpiCard label="Cold leads" value={summary.cold_leads ?? 0} hint="Inactive / final pool" />
          <KpiCard label="Conversion rate" value={`${conversionPct}%`} hint="Booked calls / total leads" />
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Daily Leads" value={summary.daily_leads ?? 0} hint={`30-day total: ${summary.total_30d ?? 0}`} />
          <KpiCard label="Hot score (heuristic)" value={summary.hot_score_count ?? 0} hint="Completed leads scored Hot" />
          <KpiCard label="Booking Rate" value={`${summary.booking_rate ?? 0}%`} hint={`Bookings: ${summary.bookings_total ?? 0}`} />
          <KpiCard label="Completion Rate" value={`${summary.completion_rate ?? 0}%`} hint={`Drop-off: ${summary.drop_off ?? 0}`} />
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-3">
          <MiniBars title="Follow-ups by day (7d)" points={followupsByDay} />
          <FunnelBars title="Leads funnel" items={funnel} />
          <ScorePie title="Hot / Warm / Cold" segments={scorePie} />
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
              <p className="mt-0.5 text-xs text-slate-400">Pipeline + latest completed (merged, newest first)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[920px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 sm:px-5">Phone</th>
                    <th className="px-4 py-3 sm:px-5">Business</th>
                    <th className="px-4 py-3 sm:px-5">Pain</th>
                    <th className="px-4 py-3 sm:px-5">Intent</th>
                    <th className="px-4 py-3 sm:px-5">Intent score</th>
                    <th className="px-4 py-3 sm:px-5">Urgency</th>
                    <th className="px-4 py-3 sm:px-5">Summary</th>
                    <th className="px-4 py-3 sm:px-5">Follow-up</th>
                    <th className="px-4 py-3 sm:px-5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-slate-400 sm:px-5" colSpan={9}>
                        No leads yet.
                      </td>
                    </tr>
                  ) : (
                    recentRows.map((lead, i) => (
                      <tr key={`${lead.phone}-${lead.sort_ts || "x"}-${i}`} className="border-t border-white/5">
                        <td className="px-4 py-3 sm:px-5">{lead.phone}</td>
                        <td className="px-4 py-3 text-slate-300 sm:px-5">{lead.business_type}</td>
                        <td className="max-w-[140px] truncate px-4 py-3 text-slate-300 sm:px-5" title={lead.pain_point}>
                          {lead.pain_point}
                        </td>
                        <td className="px-4 py-3 sm:px-5">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200">{lead.intent}</span>
                        </td>
                        <td className="px-4 py-3 sm:px-5">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200">{lead.intent_score}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 sm:px-5">{lead.urgency}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-slate-400 sm:px-5" title={lead.summary}>
                          {lead.summary}
                        </td>
                        <td className="px-4 py-3 text-slate-300 sm:px-5">{String(lead.followup_stage)}</td>
                        <td className="px-4 py-3 text-slate-400 sm:px-5">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize">{lead.status}</span>
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
                      Intent: {lead.intent || "-"} · Score: {lead.intent_score || "-"} ·{" "}
                      {String(lead.timestamp_utc || "-").slice(0, 16).replace("T", " ")}
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
