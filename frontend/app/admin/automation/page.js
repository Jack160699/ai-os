import { AdminShell } from "@/app/admin/_components/AdminShell";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";
import { requireAdminAuth } from "@/app/admin/_lib/auth";

const modules = [
  {
    title: "Follow-up sequences",
    text: "Multi-stage outreach cadences with send limits and stop rules.",
    status: "Live",
  },
  {
    title: "Intent routing",
    text: "Prioritize high-intent leads and assign playbooks by score and urgency.",
    status: "Live",
  },
  {
    title: "Revival campaigns",
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
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((m, i) => (
          <SurfaceCard key={m.title} className="p-6" delay={i * 0.05}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold tracking-tight text-white">{m.title}</p>
              <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                {m.status}
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-500">{m.text}</p>
          </SurfaceCard>
        ))}
      </div>
    </AdminShell>
  );
}
