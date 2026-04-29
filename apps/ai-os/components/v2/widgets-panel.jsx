"use client";

const LABELS = {
  my_tasks: "My Tasks",
  my_revenue: "My Revenue",
  my_leads: "My Leads",
  pending_chats: "Pending Chats",
  calendar: "Calendar",
  recent_clients: "Recent Clients",
  team_rank: "Team Rank",
  daily_goals: "Daily Goals",
};

function move(list, index, delta) {
  const next = list.slice();
  const to = index + delta;
  if (to < 0 || to >= list.length) return next;
  const [item] = next.splice(index, 1);
  next.splice(to, 0, item);
  return next;
}

export function WidgetsPanel({ widgets, setWidgets, allWidgetIds }) {
  return (
    <section className="rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.16)]">
      <p className="v2-title-tight text-sm font-semibold text-[var(--v2-text)]">Homepage Widgets</p>
      <p className="mt-1 text-xs text-[var(--v2-muted)]">Toggle what appears on your dashboard and adjust order.</p>

      <div className="mt-3 space-y-2">
        {allWidgetIds.map((id) => {
          const enabled = widgets.enabled.includes(id);
          return (
            <div key={id} className="flex items-center justify-between rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)]/90 px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  setWidgets((prev) => {
                    const enabledSet = new Set(prev.enabled);
                    if (enabledSet.has(id)) enabledSet.delete(id);
                    else enabledSet.add(id);
                    return { ...prev, enabled: Array.from(enabledSet) };
                  });
                }}
                className={`rounded-md px-2 py-1 text-xs transition ${enabled ? "text-[var(--v2-text)]" : "text-[var(--v2-muted)]"}`}
              >
                {LABELS[id] || id}
              </button>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded border border-[var(--v2-border)] px-2 py-0.5 text-[10px] text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)]"
                  onClick={() =>
                    setWidgets((prev) => ({ ...prev, order: move(prev.order, prev.order.indexOf(id), -1) }))
                  }
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rounded border border-[var(--v2-border)] px-2 py-0.5 text-[10px] text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)]"
                  onClick={() =>
                    setWidgets((prev) => ({ ...prev, order: move(prev.order, prev.order.indexOf(id), 1) }))
                  }
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
