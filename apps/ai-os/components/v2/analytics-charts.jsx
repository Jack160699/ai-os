"use client";

import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function ChartCard({ title, children }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-black/10 bg-[var(--v2-surface)] p-4 shadow-sm dark:border-white/10"
    >
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-[260px]">{children}</div>
    </motion.article>
  );
}

export function AnalyticsCharts({ data }) {
  const rows = Array.isArray(data?.timeline) ? data.timeline : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Chats Trend (7 days)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="chats" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Payments Actions (7 days)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="payments" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="lg:col-span-2">
        <ChartCard title="Team Output (assignments + replies)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="team_output" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
