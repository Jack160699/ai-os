import Link from "next/link";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

const STEPS = [
  { id: "wa", label: "Connect WhatsApp", href: "/admin/settings?tab=integrations" },
  { id: "leads", label: "Add leads", href: "/admin/leads" },
  { id: "automation", label: "Create automation", href: "/admin/automation" },
  { id: "team", label: "Invite team", href: "/admin/settings?tab=team" },
  { id: "campaign", label: "Launch first campaign", href: "/admin/automation?preset=campaign" },
];

export function OnboardingChecklist() {
  return (
    <SurfaceCard className="p-6" delay={0.03}>
      <p className="text-sm font-semibold tracking-tight text-white">Setup checklist</p>
      <p className="mt-1 text-[12px] text-slate-500">For new workspaces: complete these once to unlock a stable growth loop.</p>
      <ul className="mt-4 space-y-2.5">
        {STEPS.map((step, idx) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-[13px] text-slate-200 transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-sky-400/35 hover:bg-white/[0.05]"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.12] text-[11px] tabular-nums text-slate-400">
                {idx + 1}
              </span>
              <span>{step.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SurfaceCard>
  );
}

