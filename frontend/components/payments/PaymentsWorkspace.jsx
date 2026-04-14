"use client";

import { useState } from "react";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

const STATUS_OPTIONS = ["Pending", "Paid", "Failed"];

export function PaymentsWorkspace() {
  const [amount, setAmount] = useState("2500");
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Pending");
  const [latestLink, setLatestLink] = useState("");
  const [rows, setRows] = useState([
    { id: "1", date: "Apr 14", name: "Apex Corp", amount: "₹12,000", status: "Paid" },
    { id: "2", date: "Apr 13", name: "Kite Foods", amount: "₹4,500", status: "Pending" },
  ]);

  function createLink() {
    const slug = Math.random().toString(36).slice(2, 8);
    const url = `https://pay.stratxcel.ai/${slug}`;
    setLatestLink(url);
    setRows((prev) => [
      {
        id: slug,
        date: "Today",
        name: customer || "New customer",
        amount: `₹${Number(amount || 0).toLocaleString("en-IN")}`,
        status,
      },
      ...prev,
    ]);
  }

  async function copyLink() {
    if (!latestLink) return;
    try {
      await navigator.clipboard.writeText(latestLink);
    } catch {}
  }

  async function sendWhatsapp() {
    if (!latestLink) return;
    const text = encodeURIComponent(`Payment link: ${latestLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
      <SurfaceCard className="p-6" delay={0.04}>
        <p className="text-sm font-semibold tracking-tight text-white">Generate payment link</p>
        <p className="mt-1 text-[12px] text-slate-500">Gateway-ready placeholders: Razorpay, Stripe, and UPI QR.</p>
        <div className="mt-4 grid gap-3">
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={3} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]">
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item} className="bg-[#0d1118]">
                {item}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={createLink} className="rounded-xl border border-sky-400/35 bg-sky-500/20 px-3.5 py-2 text-[12px] font-semibold text-sky-200 transition hover:border-sky-300/45 hover:bg-sky-500/28">
              Generate link
            </button>
            <button type="button" onClick={copyLink} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[12px] font-semibold text-slate-200 transition hover:border-white/[0.13] hover:bg-white/[0.06]">
              Copy link
            </button>
            <button type="button" onClick={sendWhatsapp} className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-2 text-[12px] font-semibold text-emerald-100 transition hover:border-emerald-300/45 hover:bg-emerald-500/22">
              Send to WhatsApp
            </button>
          </div>
          {latestLink ? <p className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-slate-300">{latestLink}</p> : null}
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6" delay={0.07}>
        <p className="text-sm font-semibold tracking-tight text-white">Payment history</p>
        <div className="admin-table-shell mt-4">
          <div className="admin-table-scroll">
            <table className="admin-table min-w-[520px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.name}</td>
                    <td>{item.amount}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}

