import { AdminShell } from "@/app/admin/_components/AdminShell";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";
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
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {settingsGroups.map((group, i) => (
          <SurfaceCard key={group.name} className="p-6" delay={i * 0.05}>
            <p className="text-sm font-semibold tracking-tight text-white">{group.name}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{group.hint}</p>
            <button
              type="button"
              className="mt-5 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[12px] font-semibold text-slate-200 transition-colors duration-150 hover:border-white/[0.14] hover:bg-white/[0.06]"
            >
              Configure
            </button>
          </SurfaceCard>
        ))}
      </div>
    </AdminShell>
  );
}
