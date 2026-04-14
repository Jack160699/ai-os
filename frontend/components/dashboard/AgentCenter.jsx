"use client";

import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";
import { useRouter } from "next/navigation";

const STATUS_STYLES = {
  online: { dot: "bg-emerald-400", text: "text-emerald-300", pulse: "shadow-[0_0_0_0_rgba(52,211,153,0.55)] animate-[admin-pulse_1.7s_ease-out_infinite]" },
  busy: { dot: "bg-amber-400", text: "text-amber-300", pulse: "shadow-[0_0_0_0_rgba(251,191,36,0.5)] animate-[admin-pulse_1.9s_ease-out_infinite]" },
  offline: { dot: "bg-slate-500", text: "text-slate-400", pulse: "" },
};

function AgentRow({ item }) {
  const router = useRouter();
  const style = STATUS_STYLES[item.status] || STATUS_STYLES.offline;
  const actionable = Boolean(item.href);
  return (
    <article
      className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-[0_16px_44px_rgba(0,0,0,0.35)] ${
        actionable ? "cursor-pointer" : ""
      }`}
      role={actionable ? "button" : undefined}
      tabIndex={actionable ? 0 : undefined}
      onClick={actionable ? () => router.push(item.href) : undefined}
      onKeyDown={
        actionable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(item.href);
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-slate-100">{item.name}</p>
          <p className="mt-1 text-[12px] text-slate-500">{item.currentTask}</p>
        </div>
        <p className={`inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2 py-0.5 text-[11px] font-medium ${style.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot} ${style.pulse}`} />
          {item.statusLabel}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>Success rate: {item.successRate}</span>
        <span>Last active: {item.lastActive}</span>
      </div>
    </article>
  );
}

function AgentSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((k) => (
        <div key={k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
          <div className="admin-skeleton h-4 w-1/3" />
          <div className="admin-skeleton mt-2 h-3 w-10/12" />
          <div className="admin-skeleton mt-3 h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function AgentCenter({ agents = [], loading = false }) {
  return (
    <SurfaceCard className="p-6" delay={0.08}>
      <p className="text-sm font-semibold tracking-tight text-white">Agent Center</p>
      <p className="mt-1 text-[12px] text-slate-500">Status, throughput quality, and ownership across AI ops agents.</p>

      <div className="mt-4 grid gap-3">{loading ? <AgentSkeleton /> : agents.map((agent) => <AgentRow key={agent.id} item={agent} />)}</div>
    </SurfaceCard>
  );
}

