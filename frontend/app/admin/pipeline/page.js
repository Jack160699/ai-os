import { AdminShell } from "@/app/admin/_components/AdminShell";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";
import { requireAdminAuth } from "@/app/admin/_lib/auth";
import { getDashboardData } from "@/app/admin/_lib/data";

const COLUMNS = [
  { key: "active", label: "Active" },
  { key: "booked", label: "Booked" },
  { key: "completed", label: "Completed" },
  { key: "cold", label: "Cold / inactive" },
];

export default async function AdminPipelinePage() {
  await requireAdminAuth();
  let rows = [];
  try {
    const data = await getDashboardData();
    rows = Array.isArray(data?.recent_pipeline) ? data.recent_pipeline : [];
  } catch {
    rows = [];
  }

  const grouped = {
    active: [],
    booked: [],
    completed: [],
    cold: [],
  };
  for (const row of rows) {
    const status = String(row.status || "").toLowerCase();
    if (status.includes("booked")) grouped.booked.push(row);
    else if (status.includes("complete")) grouped.completed.push(row);
    else if (status.includes("cold") || status.includes("inactive")) grouped.cold.push(row);
    else grouped.active.push(row);
  }

  return (
    <AdminShell
      activePath="/admin/pipeline"
      title="Pipeline"
      subtitle="Operational view of lead movement across lifecycle stages."
    >
      <div className="grid gap-6 lg:grid-cols-4">
        {COLUMNS.map((col, i) => (
          <SurfaceCard key={col.key} className="p-5" delay={i * 0.05}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold tracking-tight text-white">{col.label}</p>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-300">
                {grouped[col.key].length}
              </span>
            </div>
            <div className="space-y-2">
              {grouped[col.key].slice(0, 8).map((row, j) => (
                <div
                  key={`${row.phone || col.key}-${j}`}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 transition-[border-color,background-color] duration-150 hover:border-white/[0.11] hover:bg-white/[0.04]"
                >
                  <p className="text-[13px] font-medium text-slate-100">{row.phone || "—"}</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {row.business_type || "—"} · Stage {row.followup_stage ?? "—"}
                  </p>
                </div>
              ))}
              {grouped[col.key].length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.015] px-3 py-6 text-center text-[12px] text-slate-500">
                  No records in this lane.
                </p>
              ) : null}
            </div>
          </SurfaceCard>
        ))}
      </div>
    </AdminShell>
  );
}
