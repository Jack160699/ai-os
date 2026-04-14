"use client";

import { useMemo, useState } from "react";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

export function PaymentsPanel() {
  const [amount, setAmount] = useState("2500");
  const [customer, setCustomer] = useState("");
  const [latestLink, setLatestLink] = useState("");
  const [history, setHistory] = useState([
    { id: "p1", customer: "Apex Pvt Ltd", amount: "₹12,000", status: "Paid", gateway: "Razorpay (placeholder)" },
    { id: "p2", customer: "Kite Foods", amount: "₹4,500", status: "Pending", gateway: "Stripe (placeholder)" },
  ]);

  const canGenerate = Number(amount) > 0;
  const monthlyReceived = useMemo(() => "₹16,500", []);

  function generateLink() {
    if (!canGenerate) return;
    const slug = Math.random().toString(36).slice(2, 8);
    const link = `https://pay.stratxcel.ai/${slug}`;
    setLatestLink(link);
    setHistory((prev) => [
      { id: `p-${slug}`, customer: customer || "New customer", amount: `₹${Number(amount).toLocaleString("en-IN")}`, status: "Pending", gateway: "Razorpay/Stripe (placeholder)" },
      ...prev,
    ]);
  }

  function markPaid(id) {
    setHistory((prev) => prev.map((item) => (item.id === id ? { ...item, status: "Paid" } : item)));
  }

  async function copyLink() {
    if (!latestLink) return;
    try {
      await navigator.clipboard.writeText(latestLink);
    } catch {}
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <SurfaceCard className="p-6" delay={0.04}>
        <p className="text-sm font-semibold tracking-tight text-white">Generate payment link</p>
        <p className="mt-1 text-[12px] text-slate-500">Use Razorpay/Stripe placeholder flow until gateway credentials are connected.</p>
        <div className="mt-4 grid gap-3">
          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Customer name"
            className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generateLink}
              className="rounded-xl border border-sky-400/35 bg-sky-500/20 px-3.5 py-2 text-[12px] font-semibold text-sky-200 transition hover:border-sky-300/45 hover:bg-sky-500/28"
            >
              Generate payment link
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[12px] font-semibold text-slate-200 transition hover:border-white/[0.13] hover:bg-white/[0.06]"
            >
              Copy link
            </button>
          </div>
        </div>
        {latestLink ? (
          <p className="mt-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-slate-300">{latestLink}</p>
        ) : null}
      </SurfaceCard>

      <SurfaceCard className="p-6" delay={0.07}>
        <p className="text-sm font-semibold tracking-tight text-white">Payment history</p>
        <p className="mt-1 text-[12px] text-slate-500">Monthly received: {monthlyReceived}</p>
        <div className="mt-4 space-y-2.5">
          {history.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-slate-100">{item.customer}</p>
                <p className="text-[13px] font-semibold text-white">{item.amount}</p>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{item.gateway}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-[11px] font-medium ${item.status === "Paid" ? "text-emerald-300" : "text-amber-300"}`}>{item.status}</span>
                {item.status !== "Paid" ? (
                  <button
                    type="button"
                    onClick={() => markPaid(item.id)}
                    className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-white/[0.12] hover:bg-white/[0.06]"
                  >
                    Mark paid
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

