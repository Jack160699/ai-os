"use client";

import { EmptyState } from "@/app/admin/_components/EmptyState";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const DONUT_COLORS = ["#38bdf8", "#818cf8", "#22c55e", "#f59e0b", "#f97316", "#ef4444"];

export function DonutScoreChartClient({ data = [] }) {
  const list = Array.isArray(data)
    ? data.map((item) => ({
        label: String(item.label ?? "Unknown"),
        count: Number(item.count) || 0,
      }))
    : [];

  const total = list.reduce((acc, item) => acc + item.count, 0);

  if (list.length === 0) {
    return (
      <div className="mt-5">
        <EmptyState
          title="No distribution yet"
          description="Once scoring runs at volume, hot / warm / cold splits land in this panel."
          className="py-10"
        />
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="h-[260px] rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <filter id="score-donut-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#38bdf8" floodOpacity="0.22" />
              </filter>
            </defs>
            <Pie
              data={list}
              dataKey="count"
              nameKey="label"
              innerRadius={62}
              outerRadius={96}
              paddingAngle={3}
              cornerRadius={6}
              animationDuration={760}
              animationEasing="ease-out"
              filter="url(#score-donut-glow)"
            >
              {list.map((entry, index) => (
                <Cell key={`${entry.label}-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value}`, "Count"]}
              contentStyle={{
                border: "1px solid var(--admin-border)",
                borderRadius: 12,
                background: "var(--admin-surface-1)",
                color: "var(--admin-text)",
                boxShadow: "0 14px 36px rgba(0,0,0,0.35)",
              }}
              labelStyle={{ color: "var(--admin-muted)", fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2.5">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Total scored</p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-white">{total}</p>
        </div>
        {list.map((entry, index) => {
          const color = DONUT_COLORS[index % DONUT_COLORS.length];
          const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
          return (
            <div
              key={entry.label}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[12px] font-medium text-slate-200">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {entry.label}
                </p>
                <p className="text-[12px] tabular-nums text-slate-400">{pct}%</p>
              </div>
              <p className="mt-1 text-[17px] font-semibold tracking-tight text-white">{entry.count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

