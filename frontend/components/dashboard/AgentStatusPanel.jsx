import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

const STATUS_STYLES = {
  online: { dot: "bg-emerald-400", text: "text-emerald-300" },
  busy: { dot: "bg-amber-400", text: "text-amber-300" },
  offline: { dot: "bg-slate-500", text: "text-slate-400" },
};

function AgentRow({ item }) {
  const style = STATUS_STYLES[item.status] || STATUS_STYLES.offline;

  return (
    <article className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-slate-100">{item.name}</p>
          <p className="mt-1 text-[12px] text-slate-500">{item.currentTask}</p>
        </div>
        <p className={`inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2 py-0.5 text-[11px] font-medium ${style.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
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

export function AgentStatusPanel({ agents = [] }) {
  return (
    <SurfaceCard className="p-6" delay={0.08}>
      <p className="text-sm font-semibold tracking-tight text-white">Agent Center</p>
      <p className="mt-1 text-[12px] text-slate-500">Live status for your core operating agents.</p>

      <div className="mt-4 grid gap-3">
        {agents.map((agent) => (
          <AgentRow key={agent.name} item={agent} />
        ))}
      </div>
    </SurfaceCard>
  );
}

