"use client";

export function ChatIntelSidebar({ selected, detail, loadingDetail, mobileTab }) {
  return (
    <aside
      className={`flex min-h-0 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${
        mobileTab === "intel" ? "flex" : "hidden"
      } lg:flex`}
    >
      {!selected ? (
        <p className="text-[13px] text-slate-500">Select a thread for lead intel.</p>
      ) : loadingDetail && !detail ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Summary</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-200">{detail?.intelligence?.summary}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Sentiment</p>
              <p className="mt-1 text-sm font-semibold text-white">{detail?.intelligence?.sentiment?.label}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Intent</p>
              <p className="mt-1 text-sm font-semibold text-white">{detail?.intelligence?.intent_score}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Next best action</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-sky-100/90">{detail?.intelligence?.recommended_next_action}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[12px] text-slate-400">
            <p>
              <span className="text-slate-500">Step:</span> {detail?.state?.step || "—"}
            </p>
            <p className="mt-1">
              <span className="text-slate-500">Business:</span> {detail?.state?.business_type || "—"}
            </p>
            <p className="mt-1">
              <span className="text-slate-500">Urgency:</span> {detail?.state?.urgency || "—"}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
