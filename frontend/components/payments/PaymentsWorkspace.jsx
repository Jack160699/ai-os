"use client";

import { useEffect, useMemo, useState } from "react";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

const REFUND_STATUS_OPTIONS = ["none", "requested", "initiated", "processed", "rejected"];

function moneyInr(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatTime(value) {
  const d = new Date(value || "");
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function PaymentsWorkspace() {
  const [amount, setAmount] = useState("499");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("Diagnosis Session");
  const [customerEmail, setCustomerEmail] = useState("");
  const [latestLink, setLatestLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");
  const [logs, setLogs] = useState([]);
  const [latestSuccessful, setLatestSuccessful] = useState([]);
  const [failedRecent, setFailedRecent] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dailySummary, setDailySummary] = useState({ date_utc: "", revenue_rupees: 0, success_count: 0, failed_count: 0 });
  const [noteDraftByPayment, setNoteDraftByPayment] = useState({});
  const [refundStatusByPayment, setRefundStatusByPayment] = useState({});

  const successRows = useMemo(
    () => latestSuccessful.filter((row) => row && row.payment_id).slice(0, 8),
    [latestSuccessful]
  );

  async function loadLogs() {
    setLogsLoading(true);
    setLogsError("");
    try {
      const res = await fetch("/api/admin/payments/logs", { cache: "no-store", credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load payment logs");
      setLogs(Array.isArray(data.events) ? data.events : []);
      setLatestSuccessful(Array.isArray(data.latest_successful) ? data.latest_successful : []);
      setFailedRecent(Array.isArray(data.failed_recent) ? data.failed_recent : []);
      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      setDailySummary(data.daily_summary || { date_utc: "", revenue_rupees: 0, success_count: 0, failed_count: 0 });
    } catch (e) {
      setLogsError(e?.message || "Failed to load payment logs");
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  async function createLink() {
    setLoading(true);
    setLogsError("");
    try {
      const res = await fetch("/api/payments/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          amount,
          name: customer,
          phone,
          description,
          email: customerEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Could not create payment link");
      setLatestLink(String(data.payment_link || data.short_url || ""));
      setLogsError("");
    } catch (e) {
      setLogsError(e?.message || "Could not create payment link");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!latestLink) return;
    try {
      await navigator.clipboard.writeText(latestLink);
    } catch {}
  }

  async function sendWhatsapp(link = latestLink) {
    if (!link) return;
    const text = encodeURIComponent(`Secure payment link: ${link}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  async function resendPaymentLink(row) {
    const rowAmount = Number(row?.amount_rupees || amount || 0);
    if (!customer.trim() || !phone.trim()) {
      setLogsError("Enter customer + phone first, then retry resend payment link.");
      return;
    }
    setLoading(true);
    setLogsError("");
    try {
      const res = await fetch("/api/payments/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          amount: rowAmount > 0 ? rowAmount : amount,
          name: customer,
          phone,
          description,
          email: customerEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to resend payment link");
      const url = String(data.payment_link || data.short_url || "");
      setLatestLink(url);
      await sendWhatsapp(url);
    } catch (e) {
      setLogsError(e?.message || "Failed to resend payment link");
    } finally {
      setLoading(false);
    }
  }

  async function saveRefundNote(paymentId) {
    const note = String(noteDraftByPayment[paymentId] || "").trim();
    if (!paymentId || !note) return;
    try {
      const res = await fetch("/api/admin/payments/refund-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          payment_id: paymentId,
          note,
          refund_status: refundStatusByPayment[paymentId] || "requested",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Could not save refund note");
      setNoteDraftByPayment((prev) => ({ ...prev, [paymentId]: "" }));
      await loadLogs();
    } catch (e) {
      setLogsError(e?.message || "Could not save refund note");
    }
  }

  return (
    <div className="grid gap-6">
      <SurfaceCard className="p-6" delay={0.04}>
        <p className="text-sm font-semibold tracking-tight text-white">Generate / Resend payment link</p>
        <p className="mt-1 text-[12px] text-slate-500">Live Razorpay link generation with WhatsApp resend support.</p>
        <div className="mt-4 grid gap-3">
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name (required)" className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone with country code digits (required)" className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (INR)" type="number" className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]" />
          <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Customer email (optional if RAZORPAY_CUSTOMER_EMAIL_FALLBACK is set on server)" type="email" className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={createLink} disabled={loading} className="rounded-xl border border-sky-400/35 bg-sky-500/20 px-3.5 py-2 text-[12px] font-semibold text-sky-200 transition hover:border-sky-300/45 hover:bg-sky-500/28 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? "Please wait..." : "Generate link"}
            </button>
            <button type="button" onClick={copyLink} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[12px] font-semibold text-slate-200 transition hover:border-white/[0.13] hover:bg-white/[0.06]">
              Copy link
            </button>
            <button type="button" onClick={sendWhatsapp} className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-2 text-[12px] font-semibold text-emerald-100 transition hover:border-emerald-300/45 hover:bg-emerald-500/22">
              Send to WhatsApp
            </button>
            <button type="button" onClick={loadLogs} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[12px] font-semibold text-slate-200 transition hover:border-white/[0.13] hover:bg-white/[0.06]">
              Refresh logs
            </button>
          </div>
          {latestLink ? <p className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-slate-300">{latestLink}</p> : null}
          {logsError ? <p className="text-xs text-rose-300">{logsError}</p> : null}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SurfaceCard className="p-6" delay={0.07}>
          <p className="text-sm font-semibold tracking-tight text-white">Daily revenue summary</p>
          <p className="mt-2 text-[13px] text-slate-400">Date (UTC): {dailySummary.date_utc || "-"}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Revenue</p>
              <p className="mt-1 text-lg font-semibold text-emerald-200">{moneyInr(dailySummary.revenue_rupees)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Success</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{dailySummary.success_count || 0}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Failed</p>
              <p className="mt-1 text-lg font-semibold text-amber-200">{dailySummary.failed_count || 0}</p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6" delay={0.09}>
          <p className="text-sm font-semibold tracking-tight text-white">Payment alerts</p>
          <div className="mt-4 space-y-2">
            {alerts.length === 0 ? <p className="text-[12px] text-emerald-300">No payment alerts right now.</p> : null}
            {alerts.map((alert) => (
              <div key={alert.text} className="rounded-xl border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100">
                {alert.text}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SurfaceCard className="p-6">
          <p className="text-sm font-semibold tracking-tight text-white">Latest successful payments</p>
          <div className="mt-4 space-y-2">
            {successRows.length === 0 ? <p className="text-[12px] text-slate-500">No successful payments found yet.</p> : null}
            {successRows.map((row) => (
              <div key={`${row.payment_id}-${row.recorded_at_utc}`} className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2">
                <p className="text-[12px] text-slate-200">{row.payment_id || "-"}</p>
                <p className="mt-1 text-[11px] text-slate-400">{formatTime(row.recorded_at_utc)} · {moneyInr(row.amount_rupees)}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <p className="text-sm font-semibold tracking-tight text-white">Failed payment reasons</p>
          <div className="mt-4 space-y-2">
            {failedRecent.length === 0 ? <p className="text-[12px] text-slate-500">No failed payments in recent logs.</p> : null}
            {failedRecent.slice(0, 10).map((row) => (
              <div key={`${row.payment_id}-${row.recorded_at_utc}`} className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-3 py-2">
                <p className="text-[12px] text-rose-100">{row.payment_id || row.order_id || "-"}</p>
                <p className="mt-1 text-[11px] text-rose-200/90">{row.reason || "Unknown failure reason"}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="p-6">
        <p className="text-sm font-semibold tracking-tight text-white">Admin payment logs</p>
        {logsLoading ? <p className="mt-3 text-[12px] text-slate-500">Loading payment logs...</p> : null}
        <div className="admin-table-shell mt-4">
          <div className="admin-table-scroll">
            <table className="admin-table min-w-[980px]">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Refund Tracking Notes</th>
                  <th>Resend Link</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item, idx) => (
                  <tr key={`${item.payment_id || item.order_id || "row"}-${idx}`}>
                    <td>{formatTime(item.recorded_at_utc)}</td>
                    <td>{item.status || "-"}</td>
                    <td className="font-mono text-[11px]">{item.payment_id || item.order_id || "-"}</td>
                    <td>{moneyInr(item.amount_rupees)}</td>
                    <td className="max-w-[220px] truncate" title={item.reason || ""}>{item.reason || "-"}</td>
                    <td>
                      <div className="flex min-w-[260px] flex-col gap-2">
                        {item.refund_note ? <p className="text-[11px] text-slate-400">Current: {item.refund_note}</p> : null}
                        <select
                          value={refundStatusByPayment[item.payment_id] || item.refund_status || "none"}
                          onChange={(e) =>
                            setRefundStatusByPayment((prev) => ({
                              ...prev,
                              [item.payment_id]: e.target.value,
                            }))
                          }
                          className="h-8 rounded-md border border-white/[0.1] bg-white/[0.03] px-2 text-[11px] text-slate-100 outline-none"
                        >
                          {REFUND_STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s} className="bg-[#0d1118]">
                              {s}
                            </option>
                          ))}
                        </select>
                        <input
                          value={noteDraftByPayment[item.payment_id] || ""}
                          onChange={(e) =>
                            setNoteDraftByPayment((prev) => ({
                              ...prev,
                              [item.payment_id]: e.target.value,
                            }))
                          }
                          placeholder="Add refund tracking note"
                          className="h-8 rounded-md border border-white/[0.1] bg-white/[0.03] px-2 text-[11px] text-slate-100 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => saveRefundNote(item.payment_id)}
                          disabled={!item.payment_id}
                          className="rounded-md border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save note
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => resendPaymentLink(item)}
                        className="rounded-md border border-emerald-300/35 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-100"
                      >
                        Resend link
                      </button>
                    </td>
                  </tr>
                ))}
                {!logsLoading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-slate-500">
                      No payment events yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
