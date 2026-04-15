"use client";

import { useMemo, useState } from "react";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

const FILTERS = ["All", "Hot", "Paid", "Pending", "Lost"];

function pill(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("paid") || s.includes("booked")) return "border-emerald-300/25 bg-emerald-400/10 text-emerald-200";
  if (s.includes("hot")) return "border-rose-300/25 bg-rose-400/10 text-rose-200";
  if (s.includes("cold") || s.includes("lost")) return "border-slate-400/20 bg-slate-500/10 text-slate-300";
  return "border-amber-300/25 bg-amber-400/10 text-amber-200";
}

export function LeadsCommandCenter({ rows = [] }) {
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "All") return true;
      const score = String(r.intent_score || "");
      const status = String(r.status || "");
      if (filter === "Hot") return /hot/i.test(score);
      if (filter === "Paid") return /paid|booked/i.test(status);
      if (filter === "Pending") return /active|pending/i.test(status);
      if (filter === "Lost") return /cold|inactive|lost/i.test(status);
      return true;
    });
  }, [filter, rows]);

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Leads Command Center</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">Live CRM operations</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                filter === f ? "border-sky-300/45 bg-sky-400/15 text-sky-100" : "border-white/[0.1] bg-white/[0.03] text-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.14] bg-gradient-to-b from-white/[0.03] to-transparent p-8 text-center">
            <p className="text-base font-semibold text-slate-100">No leads in this filter yet</p>
            <p className="mt-2 text-[13px] text-slate-400">Great moment to trigger a follow-up or launch a focused campaign.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button type="button" className="rounded-xl border border-sky-300/35 bg-sky-400/15 px-3 py-1.5 text-[11px] font-semibold text-sky-100">
                One-click Follow-up
              </button>
              <button type="button" className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-200">
                Add New Lead
              </button>
            </div>
          </div>
        ) : (
        <table className="admin-table min-w-[980px] w-full text-left text-[12px]">
          <thead>
            <tr>
              {["Name", "WhatsApp", "Need", "Tags", "Stage", "Growth", "Last Action", "Status", "Payment", "Actions"].map((h) => (
                <th key={h} className="px-2.5 py-2 text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 25).map((r, i) => {
              const status = r.status || "active";
              const paid = /paid|booked/i.test(status) ? "Paid" : "Pending";
              const tags = Array.isArray(r.lead_tags) ? r.lead_tags : [];
              const g = r.growth_score != null ? `${r.growth_score}${r.growth_label ? ` (${r.growth_label})` : ""}` : "—";
              return (
                <tr key={`${r.phone}-${i}`} className="border-t border-white/[0.05]">
                  <td className="px-2.5 py-3 text-slate-100">{r.name || `Lead ${i + 1}`}</td>
                  <td className="px-2.5 py-3 text-slate-300">{r.phone}</td>
                  <td className="px-2.5 py-3 text-slate-300">{r.pain_point || r.summary || "-"}</td>
                  <td className="px-2.5 py-3 text-slate-400">{tags.length ? tags.join(", ") : "—"}</td>
                  <td className="px-2.5 py-3 text-slate-300">{r.followup_stage || "-"}</td>
                  <td className="px-2.5 py-3 text-slate-300">{g}</td>
                  <td className="px-2.5 py-3 text-slate-400">{r.last_reply_time || "-"}</td>
                  <td className="px-2.5 py-3">
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${pill(status)}`}>{status}</span>
                  </td>
                  <td className="px-2.5 py-3 text-slate-300">{paid}</td>
                  <td className="px-2.5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {["Open Chat", "Send Payment", "Assign Team", "Follow-up", "Notes"].map((a) => (
                        <button key={a} type="button" className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-2 py-1 text-[10px] text-slate-200">
                          {a}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </SurfaceCard>
  );
}

