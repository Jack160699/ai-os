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
      subtitle="Structured lead records, intent signals, and qualification details."
    >
      <div className="admin-table-shell">
        <div className="border-b border-white/[0.06] px-6 py-4 sm:px-8">
          <p className="text-sm font-semibold tracking-tight text-white">Lead registry</p>
          <p className="mt-1 text-[12px] text-slate-500">Latest structured captures from your funnel.</p>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Phone</th>
                <th>Business</th>
                <th>Pain point</th>
                <th>Intent score</th>
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
                        title="No lead records yet"
                        description="When new leads qualify through your assistant, they will appear in this registry."
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={`${row.phone || "lead"}-${row.timestamp_utc || i}`}>
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
