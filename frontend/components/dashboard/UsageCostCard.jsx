import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";
import { formatInr } from "@/lib/costEstimator";

function MetricCell({ label, value, hint, tone = "text-slate-400" }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-lg font-semibold tracking-tight text-white">{value}</p>
      {hint ? <p className={`mt-1 text-[11px] ${tone}`}>{hint}</p> : null}
    </div>
  );
}

export function UsageCostCard({ data }) {
  const usageText = `${(data?.usageToday?.tokens || 0).toLocaleString("en-IN")} tokens · ${data?.usageToday?.requests || 0} req`;

  return (
    <SurfaceCard className="p-6" delay={0.04}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">AI Usage & Cost</p>
          <p className="mt-1 text-[12px] text-slate-500">Operational visibility across API, calling, and voice channels.</p>
        </div>
        <div className="space-y-1 text-right text-xs">
          <p className="font-semibold text-emerald-300">+12% vs last month</p>
          <p className="font-semibold text-sky-300">-8% optimized usage</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCell label="OpenAI API Usage Today" value={usageText} />
        <MetricCell label="Estimated OpenAI Cost This Month" value={formatInr(data?.openAiCost || 0)} />
        <MetricCell label="Calling Cost" value={formatInr(data?.callingCost || 0)} hint="Exotel placeholder/manual config" />
        <MetricCell label="Voice Cost" value={formatInr(data?.voiceCost || 0)} hint="ElevenLabs placeholder/manual config" />
        <MetricCell label="Total Estimated Monthly Cost" value={formatInr(data?.totalMonthlyCost || 0)} hint="Blended channel spend" tone="text-emerald-300/90" />
        <MetricCell label="Cost Per Lead" value={formatInr(data?.costPerLead || 0)} />
        <MetricCell label="Cost Per Conversion" value={formatInr(data?.costPerConversion || 0)} />
      </div>

      <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-200/90">Cost optimization suggestions</p>
        <ul className="mt-2.5 space-y-1.5 text-[12px] text-amber-50/95">
          <li>Reduce unused polling to save cost</li>
          <li>Compress prompts to reduce tokens</li>
          <li>Follow-up timing can save ₹500/month</li>
        </ul>
      </div>
    </SurfaceCard>
  );
}

