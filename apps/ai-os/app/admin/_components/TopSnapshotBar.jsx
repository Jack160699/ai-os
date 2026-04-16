import { PremiumCounter } from "@/app/admin/_components/PremiumCounter";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

export function TopSnapshotBar({ summary, syncedAt }) {
  const todayLeads = Number(summary?.daily_leads ?? 0);
  const paidToday = Number(summary?.bookings_today ?? 0);
  const revenueToday = Number(summary?.paid_revenue_rupees ?? 0);
  const conversion = Number(summary?.conversion_rate_pct ?? summary?.booking_rate ?? 0);
  const pendingFollowups = Number(summary?.active_leads ?? 0);
  const avgReply = Number(summary?.avg_time_to_reply_min ?? 0);

  const cards = [
    { label: "Total Leads Today", value: todayLeads, format: "number", href: "/admin/leads" },
    { label: "Paid Customers Today", value: paidToday, format: "number", href: "/admin/payments" },
    { label: "Revenue Today", value: revenueToday, format: "currency", href: "/admin/analytics" },
    { label: "Conversion %", value: conversion, format: "percent", href: "/admin/analytics?focus=conversion" },
    { label: "Pending Followups", value: pendingFollowups, format: "number", href: "/admin/pipeline" },
    { label: "Avg Response Time", value: avgReply, format: "time", href: "/admin/chats" },
  ];

  return (
    <section className="space-y-5">
      <SurfaceCard className="relative overflow-hidden border-white/[0.12] bg-gradient-to-br from-white/[0.06] via-slate-900/30 to-sky-950/30 p-6" hover={false}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_45%)]" aria-hidden />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">CEO Command Center</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white md:text-3xl">Welcome back, Shriyansh 👋</h2>
            <p className="mt-2 text-sm text-slate-300">Today’s business snapshot looks strong.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Live status pulse
            </span>
            <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-slate-300">
              Last sync: {new Date(syncedAt || Date.now()).toLocaleTimeString()}
            </span>
            <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-slate-300">Notifications: 3</span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.14] bg-slate-700 text-[11px] font-semibold text-white">SC</span>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <SurfaceCard key={c.label} className="p-5" href={c.href}>
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{c.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
              <PremiumCounter value={c.value} format={c.format} />
            </p>
            <p className="mt-2 text-[11px] text-slate-500">Open filtered view →</p>
          </SurfaceCard>
        ))}
      </div>
    </section>
  );
}

