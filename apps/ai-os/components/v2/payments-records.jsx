"use client";

import { useEffect, useState } from "react";

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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="rounded-2xl border border-black/10 bg-[var(--v2-surface)] p-4 shadow-sm dark:border-white/10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--v2-muted)]">Recent payment records</p>
        <button
          type="button"
          onClick={loadRecords}
          className="rounded-xl border border-black/10 px-3 py-1.5 text-xs dark:border-white/15"
        >
          Refresh
        </button>
      </div>
      {loading ? <p className="text-sm text-[var(--v2-muted)]">Loading records...</p> : null}
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/10 text-[var(--v2-muted)] dark:border-white/10">
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
            {rows.map((row) => (
              <tr key={`${row.payment_id}-${row.recorded_at_utc}`} className="border-b border-black/5 dark:border-white/5">
                <td className="px-3 py-2">{formatTime(row.recorded_at_utc)}</td>
                <td className="px-3 py-2">{row.status || "-"}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.payment_id || "-"}</td>
                <td className="px-3 py-2">{formatAmount(row.amount_rupees)}</td>
                <td className="px-3 py-2">{row.customer_name || row.customer_phone || "-"}</td>
                <td className="max-w-[280px] truncate px-3 py-2" title={row.reason || ""}>
                  {row.reason || "-"}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-[var(--v2-muted)]">
                  No payment records available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
