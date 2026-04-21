"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const axis = { stroke: "oklch(0.55 0.02 260)", fontSize: 11 };
const grid = { stroke: "oklch(1 0 0 / 0.06)" };
const tip = {
  contentStyle: {
    background: "oklch(0.18 0.02 260)",
    border: "1px solid oklch(1 0 0 / 0.1)",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "oklch(0.85 0.01 260)" },
};

export type DashboardChartsProps = {
  revenueTrend: { day: string; revenue: number }[];
  funnel: { stage: string; count: number; fill: string }[];
  conversion: { day: string; rate: number }[];
};

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <Card className="sx-card h-full overflow-hidden rounded-xl border-white/[0.08]">
        <CardHeader className="pb-1 pt-4">
          <CardTitle className="text-sm font-medium tracking-tight text-foreground">{title}</CardTitle>
          <CardDescription className="text-xs text-slate-500">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          <div className="h-[220px] w-full min-h-[220px]">{children}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PureDashboardCharts({ revenueTrend, funnel, conversion }: DashboardChartsProps) {
  const rev = revenueTrend.map((r) => ({ ...r, label: r.day.slice(5) }));
  const conv = conversion.map((c) => ({ ...c, label: c.day.slice(5) }));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard title="Revenue trend" description="Won deal value by close day (last 14d)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rev} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" {...grid} vertical={false} />
            <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
            <YAxis tick={axis} tickLine={false} axisLine={false} width={36} />
            <Tooltip {...tip} formatter={(v: number) => [`$${v}`, "Revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke="#38bdf8" strokeWidth={2} fill="url(#revFill)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Pipeline funnel" description="Active leads per stage">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnel} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} horizontal={false} />
            <XAxis type="number" tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="stage" width={88} tick={axis} tickLine={false} axisLine={false} />
            <Tooltip {...tip} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive={false}>
              {funnel.map((e, i) => (
                <Cell key={i} fill={e.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Win rate" description="Won ÷ (won+lost) by activity day">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={conv} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} vertical={false} />
            <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} width={32} unit="%" />
            <Tooltip {...tip} formatter={(v: number) => [`${v}%`, "Rate"]} />
            <Line type="monotone" dataKey="rate" stroke="#a78bfa" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export const DashboardCharts = React.memo(PureDashboardCharts);
