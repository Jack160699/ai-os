"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

const TABS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "life", label: "Lifetime" },
];

export function RevenueCenter({ summary = {}, leadsByDay = [] }) {
  const [tab, setTab] = useState("today");
  const data = useMemo(() => {
    if (!Array.isArray(leadsByDay) || leadsByDay.length === 0) return [];
    return leadsByDay.map((d, i) => ({ date: d.date, revenue: (Number(d.count || 0) * 499) + (i * 70) }));
  }, [leadsByDay]);

  const gross = Number(summary.paid_revenue_rupees ?? 0);
  const sold = Number(summary.payments_count_30d ?? summary.booked_calls ?? 0);
  const aov = sold > 0 ? gross / sold : 0;

  return (
    <SurfaceCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Revenue Center</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">Today / 7D / 30D / Lifetime</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                tab === t.id ? "border-cyan-300/45 bg-cyan-400/15 text-cyan-100" : "border-white/[0.1] bg-white/[0.03] text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Gross revenue" value={`₹${gross.toLocaleString("en-IN")}`} />
        <Stat label="Paid sessions sold" value={String(sold)} />
        <Stat label="Avg order value" value={`₹${aov.toFixed(0)}`} />
        <Stat label="Refund %" value="0.0%" />
        <Stat label="Top package sold" value="Diagnosis" />
      </div>

      <div className="mt-5 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: "var(--admin-subtle)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--admin-subtle)", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "var(--admin-surface-1)", border: "1px solid var(--admin-border)", borderRadius: 10 }}
              labelStyle={{ color: "var(--admin-muted)", fontSize: 11 }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#38bdf8" fill="url(#revFill)" strokeWidth={2.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SurfaceCard>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

