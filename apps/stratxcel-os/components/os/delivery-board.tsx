"use client";

type DeliveryTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  phone?: string | null;
  updated_at?: string;
};

const ORDER = ["kickoff", "in_progress", "review", "completed"];

export function DeliveryBoard({ tasks }: { tasks: DeliveryTask[] }) {
  const grouped = ORDER.map((status) => ({
    status,
    tasks: tasks.filter((t) => String(t.status || "kickoff") === status),
  }));

  return (
    <div className="flex min-h-0 gap-3 overflow-x-auto p-3 md:p-4">
      {grouped.map((col) => (
        <div key={col.status} className="flex min-h-0 w-[280px] shrink-0 flex-col rounded-xl border border-white/10 bg-white/[0.02] p-2">
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{col.status.replace(/_/g, " ")}</p>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {col.tasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-white/[0.08] bg-[#121821] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-100">{task.title}</p>
                  {task.priority === "high" ? (
                    <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-200">Hot</span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">{task.phone || "No phone"}</p>
              </div>
            ))}
            {col.tasks.length === 0 ? <p className="px-2 py-4 text-xs text-slate-500">No tasks</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
