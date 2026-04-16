"use client";

import { useState } from "react";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

const DEFAULT = {
  wa_ai: true,
  auto_followup: true,
  razorpay: true,
  handoff: true,
  urgency: false,
};

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full border transition ${
        checked ? "border-emerald-300/45 bg-emerald-500/35" : "border-white/[0.15] bg-white/[0.06]"
      }`}
      aria-pressed={checked}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}

export function AutomationControlPanel() {
  const [state, setState] = useState(DEFAULT);
  const items = [
    ["WhatsApp AI", "wa_ai"],
    ["Auto follow-up", "auto_followup"],
    ["Razorpay", "razorpay"],
    ["Human handoff", "handoff"],
    ["Smart urgency mode", "urgency"],
  ];

  return (
    <SurfaceCard className="p-6">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Automation Control Panel</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">System switches</h3>
      <div className="mt-4 space-y-3">
        {items.map(([label, key]) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5">
            <span className="text-sm text-slate-200">{label}</span>
            <Toggle checked={state[key]} onChange={() => setState((p) => ({ ...p, [key]: !p[key] }))} />
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

