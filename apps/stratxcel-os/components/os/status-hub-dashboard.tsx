"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Gauge, Share2, Maximize2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { DashboardAlert } from "@/lib/models";
import type { FunnelStageViz, KpiDelta, LeadSourceSlice, RevenueForecastPoint, TimelineItem } from "@/lib/dashboard-chart-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWorkspace, statusHubRegion } from "@/components/os/workspace-context";

const axis = { fill: "#7f8a9d", fontSize: 11 };
const grid = { stroke: "rgba(255,255,255,0.07)" };
const tip = {
  contentStyle: {
    background: "#121821",
    border: "1px solid #1E2632",
    borderRadius: 10,
    fontSize: 12,
  },
  labelStyle: { color: "#d8e0ee" },
};

function EmptyState({
  title,
  hint,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  hint: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-lg border border-[#1E2632] bg-[#0f141c] px-4 text-center">
      <p className="text-sm font-semibold tracking-tight text-slate-200">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>
      {ctaLabel && ctaHref ? (
        <Button asChild size="sm" variant="outline" className="mt-3 h-8 text-[11px]">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const pts = data.map((v, i) => ({ i, v }));
  const stroke = positive ? "#5b6cff" : "#95a1b6";
  if (pts.length === 0) return <div className="h-7 w-16" />;
  return (
    <div className="h-7 w-20 opacity-90">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pts} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const RevenuePerformance = React.memo(function RevenuePerformance({ data }: { data: RevenueForecastPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    actualVal: d.actual === null ? undefined : d.actual,
  }));
  const lastActual = [...data].reverse().find((d) => d.actual !== null);
  const targetLabel = lastActual ? `Land ~₹${(lastActual.forecast * 1.05).toLocaleString("en-IN")}` : "";

  return (
    <Card className="sx-card overflow-hidden rounded-xl border-[#1E2632] bg-[#121821]">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-6">
        <div>
          <CardTitle className="text-[15px] font-semibold tracking-tight text-foreground">Revenue performance</CardTitle>
          <CardDescription className="text-xs text-slate-500">Actuals vs forecast (current run rate)</CardDescription>
        </div>
        {targetLabel ? (
          <span className="max-w-[10rem] text-right text-[10px] leading-tight text-slate-400">{targetLabel}</span>
        ) : null}
      </CardHeader>
      <CardContent className="pb-5 pt-0">
        <div className="h-[280px] w-full">
          {data.length === 0 ? (
            <EmptyState
              title="No closed revenue yet"
              hint="Revenue trend appears once won deals are recorded."
              ctaLabel="Open pipeline"
              ctaHref="/pipeline"
            />
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revAct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b6cff" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#5b6cff" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" {...grid} vertical={false} />
              <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} dy={6} />
              <YAxis tick={axis} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                {...tip}
                formatter={(v, name) => {
                  const n = typeof v === "number" ? v : Number(v) || 0;
                  const label = String(name) === "actualVal" ? "Actual" : "Forecast";
                  return [`₹${n.toLocaleString("en-IN")}`, label];
                }}
              />
              <Area type="monotone" dataKey="actualVal" stroke="#5b6cff" strokeWidth={2.2} fill="url(#revAct)" isAnimationActive={false} />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#8FA0BF"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

const FunnelViz = React.memo(function FunnelViz({ funnel }: { funnel: FunnelStageViz[] }) {
  const max = Math.max(1, ...funnel.map((f) => f.count));
  return (
    <Card className="sx-card flex h-full flex-col rounded-xl border-[#1E2632] bg-[#121821]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
        <div>
          <CardTitle className="text-[15px] font-semibold tracking-tight">Pipeline funnel</CardTitle>
          <CardDescription className="text-xs">Stage volume & conversion</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center gap-3 pb-5">
        {funnel.length === 0 ? (
          <EmptyState
            title="No pipeline distribution yet"
            hint="Create leads and move stages to populate funnel."
            ctaLabel="Add lead"
            ctaHref="/leads"
          />
        ) : null}
        {funnel.slice(0, 8).map((row, i) => {
          const w = Math.round((100 * row.count) / max);
          return (
            <div key={row.stage} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-medium text-slate-200">{row.stage}</span>
                <span className="tabular-nums text-slate-300">{row.count}</span>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, w)}%` }}
                  transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: "#5b6cff",
                    opacity: 0.72,
                    boxShadow: "none",
                  }}
                />
              </div>
              {row.pctFromPrev != null ? (
                <p className="text-[10px] text-slate-500">{row.pctFromPrev}% from previous stage</p>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});

const SourcesDonut = React.memo(function SourcesDonut({ sources }: { sources: LeadSourceSlice[] }) {
  const barData = sources.map((s) => ({ name: s.name, pct: s.value }));
  return (
    <Card className="sx-card rounded-xl border-[#1E2632] bg-[#121821]">
      <CardHeader className="pb-2 pt-5">
        <CardTitle className="text-[15px] font-semibold tracking-tight">Lead source breakdown</CardTitle>
        <CardDescription className="text-xs">Share of active leads</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pb-5 md:grid-cols-[1fr_140px]">
        {sources.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState
              title="No lead-source data yet"
              hint="Lead source share appears when source values are captured."
              ctaLabel="Review leads"
              ctaHref="/leads"
            />
          </div>
        ) : null}
        <div className="h-[200px] min-h-[180px]">
          {sources.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid {...grid} horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} unit="%" dy={4} />
              <YAxis type="category" dataKey="name" width={72} tick={axis} tickLine={false} axisLine={false} />
              <Tooltip {...tip} formatter={(v: number) => [`${v}%`, "Share"]} />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                {sources.map((s, i) => (
                  <Cell key={i} fill="#5b6cff" fillOpacity={Math.max(0.3, 1 - i * 0.12)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          ) : null}
        </div>
        <div className="relative mx-auto h-[180px] w-[140px]">
          {sources.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sources}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={2}
                isAnimationActive={false}
              >
                {sources.map((s, i) => (
                  <Cell key={i} fill="#5b6cff" fillOpacity={Math.max(0.34, 1 - i * 0.12)} />
                ))}
              </Pie>
              <Tooltip {...tip} formatter={(v: number, n: string) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
});

export type StatusHubDashboardProps = {
  subtitle: string;
  premiumKpis: KpiDelta[];
  revenueForecast: RevenueForecastPoint[];
  funnelViz: FunnelStageViz[];
  leadSources: LeadSourceSlice[];
  alerts: DashboardAlert[];
  insights: { id: string; summary: string }[];
  timeline: TimelineItem[];
  operationsExtras: {
    pendingReplies: number;
    inboxThreads: number;
    pendingPayments: number;
  };
};

export function StatusHubDashboard({
  subtitle,
  premiumKpis,
  revenueForecast,
  funnelViz,
  leadSources,
  alerts,
  insights,
  timeline,
  operationsExtras,
}: StatusHubDashboardProps) {
  const { id: workspaceId } = useWorkspace();
  const [mode, setMode] = React.useState<"sales" | "operations">("sales");

  const alertHref = (a: DashboardAlert) => {
    if (a.id.includes("reply") || a.id.includes("inbox")) return "/inbox";
    if (a.id.includes("payment")) return "/more/payments";
    if (a.id.includes("proposal")) return "/more/proposals";
    return "/pipeline";
  };

  const alertCta = (a: DashboardAlert) => {
    if (a.severity === "critical") return "View now";
    if (a.id.includes("payment")) return "Review";
    return "Open";
  };

  return (
    <div className="relative min-h-full w-full overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(91,108,255,0.09),transparent)]" />

      <div className="relative mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">StratXcel OS · Status hub</p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-white md:text-3xl lg:text-[1.9rem]">
              {statusHubRegion(workspaceId)}
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-400">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#1E2632] bg-[#121821] text-slate-200 hover:bg-[#171f2b]"
            >
              <Gauge className="mr-1.5 size-3.5 opacity-80" />
              Status
            </Button>
            <div className="flex rounded-lg border border-[#1E2632] bg-[#121821] p-0.5 shadow-inner">
              {(["sales", "operations"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "relative rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                    mode === m ? "text-white" : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  {mode === m ? (
                    <motion.span
                      layoutId="mode-pill"
                      className="absolute inset-0 rounded-md bg-[#5b6cff] shadow-[0_6px_16px_-8px_rgba(91,108,255,0.85)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <span className="relative z-10">{m === "sales" ? "Sales view" : "Operations view"}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {mode === "sales" ? (
            <motion.div
              key="sales"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6 lg:grid-cols-[1fr_320px]"
            >
              <div className="flex min-w-0 flex-col gap-6">
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.06 } },
                  }}
                  className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                >
                  {premiumKpis.map((k) => (
                    <motion.div
                      key={k.label}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        show: { opacity: 1, y: 0 },
                      }}
                    >
                      <Card className="sx-card h-full rounded-xl border-[#1E2632] bg-[#121821] p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">{k.label}</p>
                        <div className="mt-2 flex items-end justify-between gap-2">
                          <p className="text-[30px] font-semibold tabular-nums tracking-tight text-white">{k.value}</p>
                          {k.sparkline ? <Sparkline data={k.sparkline} positive={k.deltaPositive} /> : null}
                        </div>
                        <p
                          className={cn("mt-2 flex items-center gap-1 text-xs font-medium", k.deltaPositive ? "text-[#8ea0c4]" : "text-slate-500")}
                        >
                          {k.deltaPositive ? (
                            <ArrowUpRight className="size-3.5 text-[#8ea0c4]" />
                          ) : (
                            <ArrowDownRight className="size-3.5 text-slate-500" />
                          )}
                          {k.deltaText}
                        </p>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>

                <RevenuePerformance data={revenueForecast} />

                <div className="grid gap-4 lg:grid-cols-2">
                  <FunnelViz funnel={funnelViz} />
                  <SourcesDonut sources={leadSources} />
                </div>
              </div>

              <aside className="flex min-w-0 flex-col gap-4">
                <Card className="sx-card rounded-xl border-[#1E2632] bg-[#121821]">
                  <CardHeader className="pb-2 pt-5">
                    <CardTitle className="text-[15px] font-semibold tracking-tight">Quick-action feed</CardTitle>
                    <CardDescription className="text-xs">What needs you now</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    {alerts.length === 0 ? (
                      <EmptyState
                        title="No critical actions right now"
                        hint="Signals and automation alerts appear here in real time."
                        ctaLabel="Open pipeline"
                        ctaHref="/pipeline"
                      />
                    ) : (
                      alerts.slice(0, 4).map((a) => (
                        <div
                          key={a.id}
                          className="rounded-lg border border-[#1E2632] bg-[#0f141c] p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs leading-snug text-slate-200">{a.message}</p>
                            <Badge variant={a.severity === "critical" ? "hot" : a.severity === "warning" ? "warm" : "secondary"} className="shrink-0 text-[10px]">
                              {a.severity}
                            </Badge>
                          </div>
                          <Button asChild size="sm" className="mt-2 h-8 w-full text-xs" variant="secondary">
                            <Link href={alertHref(a)}>{alertCta(a)}</Link>
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="sx-card rounded-xl border-[#1E2632] bg-[#121821]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
                    <div>
                      <CardTitle className="text-[15px] font-semibold tracking-tight">AI insights</CardTitle>
                      <CardDescription className="text-xs">Model-assisted signals</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="size-8 text-slate-500 hover:text-slate-300" aria-label="Share">
                        <Share2 className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8 text-slate-500 hover:text-slate-300" aria-label="Expand">
                        <Maximize2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    {insights.length === 0 ? (
                      <EmptyState
                        title="No AI insights yet"
                        hint="Insights appear after activity analysis runs on your live data."
                        ctaLabel="Open inbox"
                        ctaHref="/inbox"
                      />
                    ) : (
                      insights.map((ins) => (
                        <div key={ins.id} className="flex gap-2 text-sm leading-snug text-slate-200">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#5b6cff]" />
                          <p>{ins.summary}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="sx-card rounded-xl border-[#1E2632] bg-[#121821]">
                  <CardHeader className="pb-2 pt-5">
                    <CardTitle className="text-[15px] font-semibold tracking-tight">Upcoming</CardTitle>
                    <CardDescription className="text-xs">Timeline</CardDescription>
                  </CardHeader>
                  <CardContent className="relative pb-4 pl-2">
                    {timeline.length === 0 ? (
                      <EmptyState
                        title="No upcoming items"
                        hint="Tasks and payment follow-ups will appear automatically."
                        ctaLabel="Review payments"
                        ctaHref="/more/payments"
                      />
                    ) : null}
                    <div className="absolute bottom-4 left-[11px] top-2 w-px bg-[#253148]" />
                    <ul className="space-y-4">
                      {timeline.map((t) => (
                        <li key={t.id} className="relative flex gap-3 pl-5">
                          <span className="absolute left-0 top-1.5 size-2.5 rounded-full border border-[#5b6cff]/70 bg-[#0b0f14]" />
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-[#8ea0c4]">{t.time}</p>
                            <p className="text-sm font-medium text-slate-100">{t.title}</p>
                            <p className="text-xs text-slate-500">{t.subtitle}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </aside>
            </motion.div>
          ) : (
            <motion.div
              key="ops"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="grid gap-4 md:grid-cols-3"
            >
              {[
                { label: "Pending replies", value: String(operationsExtras.pendingReplies), href: "/inbox" },
                { label: "Inbox threads", value: String(operationsExtras.inboxThreads), href: "/inbox" },
                { label: "Open payment links", value: String(operationsExtras.pendingPayments), href: "/more/payments" },
              ].map((x) => (
                <Card key={x.label} className="sx-card rounded-xl border-[#1E2632] bg-[#121821] p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{x.label}</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{x.value}</p>
                  <Button asChild variant="outline" size="sm" className="mt-4 border-white/10">
                    <Link href={x.href}>Open</Link>
                  </Button>
                </Card>
              ))}
              <Card className="sx-card rounded-xl border-[#1E2632] bg-[#121821] p-6 md:col-span-3">
                <p className="text-sm font-medium text-slate-200">Runbooks</p>
                <p className="mt-1 text-xs text-slate-500">Clear inbox → confirm payments → push proposals. Automation lives under More.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href="/more/automation">Automation</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/more/team">Team</Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
