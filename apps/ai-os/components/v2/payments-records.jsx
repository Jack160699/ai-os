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
  const [statusFilter, setStatusFilter] = useState("all_status");
  const [rangeFilter, setRangeFilter] = useState("today");
  const [sourceFilter, setSourceFilter] = useState("all_source");
  const [modalOpen, setModalOpen] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [historyPhone, setHistoryPhone] = useState("");
  const [form, setForm] = useState({
    customer: "",
    phone: "",
    amount: "499",
    purpose: "Consultation",
    expiry: "24h",
    notes: "",
    source: "staff_generated",
  });

  async function loadRecords() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v2/payments/records", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || "Could not load payment records");
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
    const source = String(row?.source || "").toLowerCase();
    const recordedAt = new Date(String(row?.recorded_at_utc || ""));
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const matchesRange =
      rangeFilter === "today"
        ? (!Number.isNaN(recordedAt.getTime()) && recordedAt.toDateString() === now.toDateString())
        : rangeFilter === "this_week"
          ? (!Number.isNaN(recordedAt.getTime()) && recordedAt >= oneWeekAgo)
          : true;
    const matchesStatus =
      statusFilter === "all_status"
        ? true
        : statusFilter === "paid"
          ? (status.includes("paid") || status.includes("captured"))
          : statusFilter === "pending"
            ? (status.includes("pending") || status.includes("created"))
            : status.includes("fail");
    const matchesSource = sourceFilter === "all_source" ? true : source.includes(sourceFilter);
    const haystack = `${row?.payment_id || ""} ${row?.customer_name || ""} ${row?.customer_phone || ""} ${row?.reason || ""} ${row?.purpose || ""}`.toLowerCase();
    const matchesQuery = query.trim() ? haystack.includes(query.trim().toLowerCase()) : true;
    return matchesRange && matchesStatus && matchesSource && matchesQuery;
  });

  function statusClass(status) {
    const s = String(status || "").toLowerCase();
    if (s.includes("paid") || s.includes("captured")) return "border-white/25 bg-white/[0.14] text-white";
    if (s.includes("pending") || s.includes("created")) return "border-white/20 bg-white/[0.08] text-white";
    if (s.includes("fail")) return "border-white/15 bg-white/[0.05] text-[#b3b3b3]";
    return "border-[var(--v2-border)] bg-[var(--v2-elevated)] text-[var(--v2-muted)]";
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

  async function createPaymentLink() {
    setCreatingLink(true);
    setGeneratedLink("");
    setError("");
    try {
      const res = await fetch("/api/v2/payments/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.amount || 0),
          name: form.customer,
          phone: form.phone,
          description: form.purpose,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Could not generate payment link");
      const link = String(data?.payment_link || data?.short_url || "");
      setGeneratedLink(link);
      setRows((prev) => [
        {
          payment_id: data?.id || `generated-${Date.now()}`,
          status: "created",
          amount_rupees: Number(form.amount || 0),
          reason: form.notes || "",
          recorded_at_utc: new Date().toISOString(),
          customer_phone: form.phone,
          customer_name: form.customer,
          source: form.source,
          purpose: form.purpose,
          paid_at: null,
          created_by: "admin",
          link,
        },
        ...prev,
      ]);
    } catch (err) {
      setError(err?.message || "Could not generate payment link");
    } finally {
      setCreatingLink(false);
    }
  }

  async function updateStatus(paymentId, status) {
    if (!paymentId) return;
    try {
      const res = await fetch(`/api/v2/payments/${encodeURIComponent(paymentId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not update status");
      setRows((prev) =>
        prev.map((row) =>
          row.payment_id === paymentId
            ? { ...row, status, paid_at: status.includes("paid") ? new Date().toISOString() : row.paid_at }
            : row,
        ),
      );
    } catch (err) {
      setError(err?.message || "Could not update status");
    }
  }

  function exportCsv() {
    const headers = ["date", "customer", "phone", "amount", "source", "purpose", "status", "paid_at", "created_by", "payment_id"];
    const lines = filtered.map((row) =>
      [
        row.recorded_at_utc || "",
        row.customer_name || "",
        row.customer_phone || "",
        row.amount_rupees || 0,
        row.source || "",
        row.purpose || row.reason || "",
        row.status || "",
        row.paid_at || "",
        row.created_by || "",
        row.payment_id || "",
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const customerHistory = historyPhone
    ? rows.filter((row) => String(row.customer_phone || "") === String(historyPhone))
    : [];

  return (
    <div className="rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Today Collected: {formatAmount(totals.totalAmount)}</div>
        <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Pending Amount: {totals.pending}</div>
        <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Success Rate: {totals.paid + totals.failed > 0 ? Math.round((totals.paid / (totals.paid + totals.failed)) * 100) : 0}%</div>
        <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Links Sent Today: {rows.filter((row) => row.link).length}</div>
        <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Overdue: {totals.pending}</div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select value={rangeFilter} onChange={(e) => setRangeFilter(e.target.value)} className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]">
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="all_time">All Time</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]">
            <option value="all_status">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="fail">Failed</option>
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]">
            <option value="all_source">All Sources</option>
            <option value="website">Website</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="manual">Manual</option>
            <option value="upi">UPI Direct</option>
            <option value="staff">Staff Generated</option>
          </select>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name / number / payment id" className="w-[260px] rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setModalOpen(true)} className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]">+ Generate Payment Link</button>
          <button type="button" onClick={exportCsv} className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Export CSV</button>
          <button type="button" onClick={loadRecords} disabled={loading} className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)] disabled:opacity-60">{loading ? "Refreshing..." : "Refresh"}</button>
        </div>
      </div>

      {loading ? <p className="text-sm text-[var(--v2-muted)]">Loading records...</p> : null}
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="min-w-[1320px] text-left text-sm">
          <thead className="sticky top-0 border-b border-[var(--v2-border)] bg-[var(--v2-panel)] text-[var(--v2-muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Purpose</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Paid At</th>
              <th className="px-3 py-2 font-medium">Created By</th>
              <th className="px-3 py-2 font-medium">Link</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={`${row.payment_id}-${row.recorded_at_utc}`} className="border-b border-[var(--v2-border)] hover:bg-[var(--v2-elevated)]">
                <td className="px-3 py-2">{formatTime(row.recorded_at_utc)}</td>
                <td className="px-3 py-2">{row.customer_name || "-"}</td>
                <td className="px-3 py-2">{row.customer_phone || "-"}</td>
                <td className="px-3 py-2">{formatAmount(row.amount_rupees)}</td>
                <td className="px-3 py-2">{row.source || "website"}</td>
                <td className="px-3 py-2">{row.purpose || row.reason || "-"}</td>
                <td className="px-3 py-2"><span className={`rounded-full border px-2 py-1 text-[11px] ${statusClass(row.status)}`}>{row.status || "-"}</span></td>
                <td className="px-3 py-2">{formatTime(row.paid_at)}</td>
                <td className="px-3 py-2">{row.created_by || "system"}</td>
                <td className="px-3 py-2">{row.link ? <a className="underline" href={row.link} target="_blank" rel="noreferrer">Open</a> : "-"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => updateStatus(row.payment_id, "paid")} className="rounded border border-[var(--v2-border)] px-2 py-1 text-[10px] text-[var(--v2-muted)]">Mark paid</button>
                    <button className="rounded border border-[var(--v2-border)] px-2 py-1 text-[10px] text-[var(--v2-muted)]">Resend</button>
                    <button className="rounded border border-[var(--v2-border)] px-2 py-1 text-[10px] text-[var(--v2-muted)]">Refund note</button>
                    <button onClick={() => setHistoryPhone(row.customer_phone || "")} className="rounded border border-[var(--v2-border)] px-2 py-1 text-[10px] text-[var(--v2-muted)]">History</button>
                    <button className="rounded border border-[var(--v2-border)] px-2 py-1 text-[10px] text-[var(--v2-muted)]">Receipt</button>
                    <button className="rounded border border-[var(--v2-border)] px-2 py-1 text-[10px] text-[var(--v2-muted)]">Invoice</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-4 text-[var(--v2-muted)]">No payment records match current filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {proMode ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Collection rate: {totals.paid + totals.failed > 0 ? Math.round((totals.paid / (totals.paid + totals.failed)) * 100) : 0}%</div>
          <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Aging buckets: 0-7d {totals.pending}</div>
          <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Advanced filters enabled</div>
        </div>
      ) : null}

      {historyPhone ? (
        <div className="mt-3 rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--v2-text)]">Customer History ({historyPhone})</p>
            <button onClick={() => setHistoryPhone("")} className="text-xs text-[var(--v2-muted)]">Close</button>
          </div>
          <div className="mt-2 space-y-1.5">
            {customerHistory.slice(0, 8).map((row) => (
              <div key={`${row.payment_id}-${row.recorded_at_utc}`} className="rounded-lg border border-[var(--v2-border)] px-2 py-1 text-xs text-[var(--v2-muted)]">
                {formatTime(row.recorded_at_utc)} · {formatAmount(row.amount_rupees)} · {row.status}
              </div>
            ))}
            {customerHistory.length === 0 ? <p className="text-xs text-[var(--v2-muted)]">No history found.</p> : null}
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-4">
            <h3 className="text-sm font-semibold text-[var(--v2-text)]">Generate Payment Link</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]" placeholder="Customer name" value={form.customer} onChange={(e) => setForm((p) => ({ ...p, customer: e.target.value }))} />
              <input className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]" placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <input className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]" placeholder="Amount" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
              <input className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]" placeholder="Purpose" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} />
              <input className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]" placeholder="Expiry" value={form.expiry} onChange={(e) => setForm((p) => ({ ...p, expiry: e.target.value }))} />
              <input className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]" placeholder="Source" value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} />
            </div>
            <textarea className="mt-2 h-16 w-full rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]" placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            {generatedLink ? <p className="mt-2 truncate rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">{generatedLink}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={createPaymentLink} disabled={creatingLink} className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]">{creatingLink ? "Generating..." : "Generate"}</button>
              <button onClick={async () => { if (generatedLink) await navigator.clipboard.writeText(generatedLink); }} className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Copy link</button>
              <button onClick={() => window.open(generatedLink || "#", "_blank", "noopener,noreferrer")} className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Open checkout</button>
              <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generatedLink || "")}`, "_blank", "noopener,noreferrer")} className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Send WhatsApp</button>
              <button onClick={() => setModalOpen(false)} className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]">Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
