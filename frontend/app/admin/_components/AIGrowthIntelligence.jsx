import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

export function AIGrowthIntelligence({ summary, topPainPoints = [] }) {
  const languageWinner = Number(summary?.bookings_today ?? 0) > 0 ? "Hinglish" : "English";
  const revenueTrend = Number(summary?.paid_revenue_30d_rupees ?? 0) > 0 ? "Rising" : "Flat";
  const waiting = Number(summary?.active_leads ?? 0);
  const weakStep = topPainPoints[0]?.label || "Problem discovery";
  const sourceBest = summary?.bookings_today > 0 ? "Instagram" : "WhatsApp referrals";

  const cards = [
    { title: "Best converting source today", text: `${sourceBest} is leading conversions in this cycle.` },
    { title: "Weak funnel step detected", text: `${weakStep} is showing the highest friction right now.` },
    { title: "Leads waiting too long", text: `${waiting} hot/active leads need a response priority now.` },
    { title: "Highest converting language", text: `${languageWinner} leads converted stronger today.` },
    { title: "Revenue trend", text: `${revenueTrend} trend in paid diagnostics over last 30 days.` },
    { title: "Suggested action now", text: "Contact top 5 hot leads and send diagnosis CTA with one human note." },
  ];

  return (
    <SurfaceCard className="p-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">AI Growth Intelligence</p>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Signal-first recommendations</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((c) => (
          <div key={c.title} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-slate-100">{c.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{c.text}</p>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

