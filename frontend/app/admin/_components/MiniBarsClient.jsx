"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EmptyState } from "@/app/admin/_components/EmptyState";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MiniBarsClient({
  title,
  points,
  emptyHint = "No data yet.",
  emptyDescription = "Once events flow in, this chart will populate automatically.",
  from = "#1e3a8a",
  to = "#45c4ff",
}) {
  const list = Array.isArray(points) ? points : [];
  const reduce = useReducedMotion();
  const chartId = `chart-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const stroke = to;
  const glow = withAlpha(to, 0.24);

  const data = list.map((point) => ({
    date: point.date,
    count: Number(point.count) || 0,
  }));

  return (
    <div className="admin-card-surface rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5 transition-[border-color,background-color] duration-200 hover:border-white/[0.11] hover:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold tracking-tight text-white">{title}</p>
        <span className="hidden text-[11px] font-medium text-slate-500 sm:inline">Volume</span>
      </div>
      {list.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={emptyHint} description={emptyDescription} className="py-8" />
        </div>
      ) : (
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-5 h-48 overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent px-2 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 6, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={`${chartId}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={to} stopOpacity={0.38} />
                  <stop offset="95%" stopColor={from} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--admin-subtle)" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--admin-subtle)" }} tickLine={false} axisLine={false} width={24} />
              <Tooltip
                cursor={{ stroke: withAlpha(stroke, 0.32), strokeWidth: 1 }}
                contentStyle={{
                  border: "1px solid var(--admin-border)",
                  borderRadius: 12,
                  background: "var(--admin-surface-1)",
                  color: "var(--admin-text)",
                  boxShadow: "0 14px 36px rgba(0,0,0,0.35)",
                }}
                labelStyle={{ color: "var(--admin-muted)", fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={stroke}
                strokeWidth={2.25}
                fill={`url(#${chartId}-fill)`}
                animationDuration={reduce ? 0 : 760}
                activeDot={{ r: 4, stroke: stroke, strokeWidth: 1.5, fill: "#fff" }}
                style={{ filter: `drop-shadow(0 0 10px ${glow})` }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}

function withAlpha(hexColor, alpha) {
  const hex = String(hexColor || "").replace("#", "");
  const normalized = hex.length === 3 ? hex.split("").map((ch) => ch + ch).join("") : hex;
  const num = Number.parseInt(normalized, 16);
  if (!Number.isFinite(num)) return `rgba(56,189,248,${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
