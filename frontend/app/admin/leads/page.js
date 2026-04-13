import { AdminShell } from "@/app/admin/_components/AdminShell";
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
      <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-sm font-semibold text-white">Lead Registry</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[840px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Pain Point</th>
                <th className="px-5 py-3">Intent Score</th>
                <th className="px-5 py-3">Urgency</th>
                <th className="px-5 py-3">Summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-4 text-slate-400">
                    No lead records yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={`${row.phone || "lead"}-${row.timestamp_utc || i}`} className="border-t border-white/5">
                    <td className="px-5 py-3">{row.phone || "-"}</td>
                    <td className="px-5 py-3 text-slate-300">{row.business_type || "-"}</td>
                    <td className="px-5 py-3 text-slate-300">{row.pain_point || "-"}</td>
                    <td className="px-5 py-3 text-slate-300">{row.intent_score || "-"}</td>
                    <td className="px-5 py-3 text-slate-300">{row.urgency || "-"}</td>
                    <td className="max-w-[260px] truncate px-5 py-3 text-slate-400" title={row.summary || "-"}>
                      {row.summary || "-"}
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
