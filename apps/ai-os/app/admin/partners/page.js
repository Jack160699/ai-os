import { AdminShell } from "@/app/admin/_components/AdminShell";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";
import { requireAdminAuth } from "@/app/admin/_lib/auth";

const partnerStats = [
  { label: "Signups", value: "38" },
  { label: "Monthly commission", value: "₹42,500" },
  { label: "Pending payout", value: "₹12,200" },
];

export default async function AdminPartnersPage() {
  await requireAdminAuth();
  return (
    <AdminShell
      activePath="/admin/partners"
      title="Partner & Referral"
      subtitle="Track referral growth, commissions, and payouts from one clean workspace panel."
    >
      <SurfaceCard className="p-6" delay={0.04}>
        <p className="text-sm font-semibold tracking-tight text-white">Referral link</p>
        <p className="mt-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-slate-300">
          https://stratxcel.ai/ref/partner-demo
        </p>
        <button
          type="button"
          className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[12px] font-semibold text-slate-200 transition hover:border-white/[0.13] hover:bg-white/[0.06]"
        >
          Copy referral link
        </button>
      </SurfaceCard>

      <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
        {partnerStats.map((item, idx) => (
          <SurfaceCard key={item.label} className="p-5" delay={idx * 0.03}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{item.value}</p>
          </SurfaceCard>
        ))}
      </div>
    </AdminShell>
  );
}

