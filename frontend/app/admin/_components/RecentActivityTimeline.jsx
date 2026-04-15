import Link from "next/link";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

export function RecentActivityTimeline({ rows = [] }) {
  const items = rows.slice(0, 8);
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Recent Activity Timeline</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">Latest high-signal actions</h3>
        </div>
        <Link href="/admin/chats" className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-200">
          Open Chat
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.14] bg-gradient-to-b from-white/[0.03] to-transparent p-5 text-center">
            <p className="text-sm font-medium text-slate-200">Your timeline is ready</p>
            <p className="mt-1 text-[12px] text-slate-500">As leads interact, important actions will appear here with clear priority.</p>
          </div>
        ) : (
          items.map((row, idx) => (
            <div key={`${row.phone}-${idx}`} className="group relative rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 transition hover:border-white/[0.14] hover:bg-white/[0.04]">
              <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gradient-to-b from-sky-400/70 to-transparent opacity-60 group-hover:opacity-100" />
              <p className="ml-2 text-[12px] font-medium text-slate-100">{row.phone}</p>
              <p className="ml-2 mt-0.5 text-[11px] text-slate-400">{row.pain_point || row.summary || "Lead update"} · {row.status || "active"}</p>
              <p className="ml-2 mt-1 text-[10px] text-slate-500">{row.sort_ts || "-"}</p>
            </div>
          ))
        )}
      </div>
    </SurfaceCard>
  );
}

