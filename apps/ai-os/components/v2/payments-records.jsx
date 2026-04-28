"use client";

import { useEffect, useState } from "react";
import { useProMode } from "@/components/v2/pro-mode";

function formatAmount(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatTime(value) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function PaymentsRecords() {
  const { proMode } = useProMode();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadRecords() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v2/payments/records", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Could not load payment records");
      }
      setRows(Array.isArray(data?.records) ? data.records : []);
    } catch (err) {
      setError(err?.message || "Could not load payment records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  const filtered = rows.filter((row) => {
    const status = String(row?.status || "").toLowerCase();
    const matchesStatus = statusFilter === "all" ? true : status.includes(statusFilter);
    const haystack = `${row?.payment_id || ""} ${row?.customer_name || ""} ${row?.customer_phone || ""} ${row?.reason || ""}`.toLowerCase();
    const matchesQuery = query.trim() ? haystack.includes(query.trim().toLowerCase()) : true;
    return matchesStatus && matchesQuery;
  });

  function statusClass(status) {
    const s = String(status || "").toLowerCase();
    if (s.includes("paid") || s.includes("captured")) return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
    if (s.includes("fail")) return "border-rose-400/30 bg-rose-500/15 text-rose-200";
    if (s.includes("pending") || s.includes("created")) return "border-amber-400/30 bg-amber-500/15 text-amber-200";
    return "border-white/15 bg-white/[0.03] text-[var(--v2-muted)]";
  }

  const totals = filtered.reduce(
    (acc, row) => {
      const amount = Number(row?.amount_rupees || 0);
      const status = String(row?.status || "").toLowerCase();
      acc.totalAmount += amount;
      if (status.includes("paid") || status.includes("captured")) acc.paid += 1;
      if (status.includes("pending") || status.includes("created")) acc.pending += 1;
      if (status.includes("fail")) acc.failed += 1;
      return acc;
    },
    { totalAmount: 0, paid: 0, pending: 0, failed: 0 },
  );

  return (
    <div className="rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Total: {formatAmount(totals.totalAmount)}</div>
        <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Paid: {totals.paid}</div>
        <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Pending: {totals.pending}</div>
        <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Failed: {totals.failed}</div>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search payment, customer, reason..."
            className="w-[260px] rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)] outline-none transition focus:border-[var(--v2-focus)]"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)] outline-none"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="fail">Failed</option>
          </select>
        </div>
        <button
          type="button"
          onClick={loadRecords}
          disabled={loading}
          className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {loading ? <p className="text-sm text-[var(--v2-muted)]">Loading records...</p> : null}
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 border-b border-[var(--v2-border)] bg-[var(--v2-panel)] text-[var(--v2-muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Payment ID</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b border-white/5">
                    <td className="px-3 py-3" colSpan={6}>
                      <div className="h-4 animate-pulse rounded bg-white/[0.06]" />
                    </td>
                  </tr>
                ))
              : null}
            {filtered.map((row) => (
              <tr key={`${row.payment_id}-${row.recorded_at_utc}`} className="border-b border-[var(--v2-border)] transition hover:bg-[var(--v2-elevated)]">
                <td className="px-3 py-2">{formatTime(row.recorded_at_utc)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full border px-2 py-1 text-[11px] ${statusClass(row.status)}`}>
                    {row.status || "-"}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{row.payment_id || "-"}</td>
                <td className="px-3 py-2">{formatAmount(row.amount_rupees)}</td>
                <td className="px-3 py-2">{row.customer_name || row.customer_phone || "-"}</td>
                <td className="max-w-[280px] truncate px-3 py-2" title={row.reason || ""}>
                  {row.reason || "-"}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-[var(--v2-muted)]">
                  No payment records match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {proMode ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-[#94a3b8]">Collection rate: {totals.paid + totals.failed > 0 ? Math.round((totals.paid / (totals.paid + totals.failed)) * 100) : 0}%</div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-[#94a3b8]">Aging bucket 0-7d: {totals.pending}</div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-[#94a3b8]">Advanced mode enabled</div>
        </div>
      ) : null}
    </div>
  );
}
