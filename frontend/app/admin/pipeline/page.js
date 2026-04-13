import { AdminShell } from "@/app/admin/_components/AdminShell";
import { requireAdminAuth } from "@/app/admin/_lib/auth";
import { getDashboardData } from "@/app/admin/_lib/data";

const COLUMNS = [
  { key: "active", label: "Active" },
  { key: "booked", label: "Booked" },
  { key: "completed", label: "Completed" },
  { key: "cold", label: "Cold / Inactive" },
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
      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{col.label}</p>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                {grouped[col.key].length}
              </span>
            </div>
            <div className="space-y-2">
              {grouped[col.key].slice(0, 8).map((row, i) => (
                <div key={`${row.phone || col.key}-${i}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                  <p className="text-sm text-white">{row.phone || "-"}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {row.business_type || "-"} · Stage {row.followup_stage ?? "-"}
                  </p>
                </div>
              ))}
              {grouped[col.key].length === 0 ? <p className="text-xs text-slate-500">No records.</p> : null}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
