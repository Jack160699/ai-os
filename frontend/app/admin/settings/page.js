import { AdminShell } from "@/app/admin/_components/AdminShell";
import { requireAdminAuth } from "@/app/admin/_lib/auth";

const settingsGroups = [
  { name: "Workspace", hint: "Branding, timezone, and data retention." },
  { name: "Integrations", hint: "WhatsApp Cloud, CRM sync, and webhooks." },
  { name: "Security", hint: "Admin auth, API secrets, and audit controls." },
];

export default async function AdminSettingsPage() {
  await requireAdminAuth();
  return (
    <AdminShell
      activePath="/admin/settings"
      title="Settings"
      subtitle="Configuration center for system controls and environment dependencies."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settingsGroups.map((group) => (
          <div key={group.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-semibold text-white">{group.name}</p>
            <p className="mt-2 text-sm text-slate-400">{group.hint}</p>
            <button className="mt-4 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05]">
              Configure
            </button>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
