"use client";

import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

export function SalesFunnelVisual({ summary = {} }) {
  const started = Number(summary.total_started ?? summary.total_leads ?? 0);
  const pain = Number(summary.total_completed ?? Math.max(0, Math.round(started * 0.54)));
  const cta = Number(summary.booked_calls ?? Math.max(0, Math.round(pain * 0.45)));
  const clicked = Number(summary.payments_count_30d ?? Math.max(0, Math.round(cta * 0.35)));
  const paid = Number(summary.bookings_today ?? Math.max(0, Math.round(clicked * 0.4)));

  const steps = [
    { label: "Started Chat", value: started },
    { label: "Pain Identified", value: pain },
    { label: "CTA Shown", value: cta },
    { label: "Payment Clicked", value: clicked },
    { label: "Paid", value: paid },
  ];
  const top = Math.max(1, started);

  return (
    <SurfaceCard className="p-6">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Live Sales Funnel</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">Conversion flow with percentages</h3>
      <div className="mt-5 space-y-3">
        {steps.map((s, idx) => {
          const pct = Math.round((s.value / top) * 100);
          return (
            <div key={s.label}>
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="text-slate-300">
                  {idx + 1}. {s.label}
                </span>
                <span className="text-slate-400">
                  {s.value} <span className="text-slate-500">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06]">
                <div className="h-2 rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300" style={{ width: `${Math.max(3, pct)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}

