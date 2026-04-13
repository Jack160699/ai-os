import { AdminShell } from "@/app/admin/_components/AdminShell";
import { requireAdminAuth } from "@/app/admin/_lib/auth";

const modules = [
  {
    title: "Follow-up Sequences",
    text: "Manage multi-stage outreach cadences with safe send limits and stop rules.",
    status: "Live",
  },
  {
    title: "Intent Routing",
    text: "Prioritize high-intent leads and assign action playbooks by score and urgency.",
    status: "Live",
  },
  {
    title: "Revival Campaigns",
    text: "Re-engage dormant leads with controlled, value-first sequences.",
    status: "Configurable",
  },
];

export default async function AdminAutomationPage() {
  await requireAdminAuth();
  return (
    <AdminShell
      activePath="/admin/automation"
      title="Automation"
      subtitle="Operational controls for sequences, routing, and autonomous lead actions."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((m) => (
          <div key={m.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{m.title}</p>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{m.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{m.text}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
