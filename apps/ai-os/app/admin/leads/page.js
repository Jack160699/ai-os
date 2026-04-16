import { AdminShell } from "@/app/admin/_components/AdminShell";
import { EmptyState } from "@/app/admin/_components/EmptyState";
import { requireAdminAuth } from "@/app/admin/_lib/auth";
import { getDashboardData } from "@/app/admin/_lib/data";

export default async function AdminLeadsPage() {
  await requireAdminAuth();
  let rows = [];
  try {
    const data = await getDashboardData();
    rows = Array.isArray(data?.recent_leads) ? data.recent_leads : [];
  } catch {
    rows = [];
  }

  return (
    <AdminShell
      activePath="/admin/leads"
      title="Leads"
      subtitle="Structured captures with intent, urgency, and the story behind each thread."
    >
      <div className="admin-table-shell shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
        <div className="border-b border-white/[0.06] px-6 py-4 sm:px-8 sm:py-5">
          <p className="text-sm font-semibold tracking-tight text-white">Registry</p>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-500">
            Sortable columns follow your backend order—use search in the header to jump by phone or keyword.
          </p>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Phone</th>
                <th>Business</th>
                <th>Pain point</th>
                <th>Intent</th>
                <th>Urgency</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border-none p-0">
                    <div className="p-6 sm:p-8">
                      <EmptyState
                        title="No rows yet"
                        description="Qualified leads land here automatically—check pipeline if conversations are still in flight."
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={`${row.phone || "lead"}-${row.timestamp_utc || i}`} className="cursor-default">
                    <td className="font-medium text-slate-100">{row.phone || "—"}</td>
                    <td className="text-slate-400">{row.business_type || "—"}</td>
                    <td className="text-slate-400">{row.pain_point || "—"}</td>
                    <td className="tabular-nums text-slate-400">{row.intent_score ?? "—"}</td>
                    <td className="text-slate-400">{row.urgency || "—"}</td>
                    <td className="max-w-[280px] truncate text-slate-500" title={row.summary || ""}>
                      {row.summary || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
