import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { adminApiHeaders, backendBase } from "@/app/admin/_lib/backendFetch";

export const dynamic = "force-dynamic";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isPaidStatus(status) {
  const s = String(status || "").toLowerCase();
  return s === "paid" || s === "payment.captured" || s === "payment_link.paid";
}

function isFailedStatus(status) {
  return String(status || "").toLowerCase().includes("fail");
}

export async function GET(request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  try {
    const res = await fetch(`${backendBase()}/dashboard.json`, {
      cache: "no-store",
      headers: adminApiHeaders(),
    });
    const raw = await res.text().catch(() => "");
    if (!res.ok) {
      return Response.json({ ok: false, error: `backend dashboard error (${res.status})` }, { status: 502 });
    }
    const data = JSON.parse(raw || "{}");
    const events = Array.isArray(data?.payment_events_recent) ? data.payment_events_recent : [];
    const successful = events.filter((row) => isPaidStatus(row?.status));
    const failed = events.filter((row) => isFailedStatus(row?.status));

    const now = Date.now();
    const last24h = events.filter((row) => {
      const ts = Date.parse(String(row?.recorded_at_utc || ""));
      if (!Number.isFinite(ts)) return false;
      return now - ts <= 24 * 60 * 60 * 1000;
    });
    const last24hFailures = last24h.filter((row) => isFailedStatus(row?.status)).length;
    const last24hPaid = last24h.filter((row) => isPaidStatus(row?.status)).length;

    const todayUtc = new Date().toISOString().slice(0, 10);
    const dailyRevenueRupees = events.reduce((sum, row) => {
      if (!isPaidStatus(row?.status)) return sum;
      const ts = String(row?.recorded_at_utc || "");
      if (!ts.startsWith(todayUtc)) return sum;
      return sum + toNumber(row?.amount_rupees);
    }, 0);

    const alerts = [];
    if (last24hFailures > 0) {
      alerts.push({
        severity: "high",
        text: `${last24hFailures} payment failure${last24hFailures > 1 ? "s" : ""} in last 24h`,
      });
    }
    if (last24h.length >= 5 && last24hFailures / Math.max(1, last24h.length) >= 0.4) {
      alerts.push({ severity: "high", text: "Failure rate above 40% in recent checkout attempts" });
    }
    if (last24hPaid === 0) {
      alerts.push({ severity: "medium", text: "No successful payment captured in last 24h" });
    }

    return Response.json({
      ok: true,
      events,
      latest_successful: successful.slice(0, 10),
      failed_recent: failed.slice(0, 20),
      alerts,
      daily_summary: {
        date_utc: todayUtc,
        revenue_rupees: dailyRevenueRupees,
        success_count: successful.filter((row) => String(row?.recorded_at_utc || "").startsWith(todayUtc)).length,
        failed_count: failed.filter((row) => String(row?.recorded_at_utc || "").startsWith(todayUtc)).length,
      },
    });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

