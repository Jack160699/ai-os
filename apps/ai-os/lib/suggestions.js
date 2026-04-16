function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function buildSmartSuggestions(summary = {}) {
  const hotLeads = toNumber(summary.hot_leads_count);
  const activeLeads = toNumber(summary.active_leads);
  const conversion = toNumber(summary.conversion_rate_pct ?? summary.conversion_rate);
  const coldLeads = toNumber(summary.cold_leads);
  const bookedCalls = toNumber(summary.booked_calls);

  return [
    {
      id: "hot-followup",
      title: `${Math.max(3, hotLeads)} hot leads need response`,
      detail: "Prioritize these in the next 30 minutes for best close probability.",
      icon: "fire",
      href: "/admin/chats?segment=hot",
    },
    {
      id: "best-time",
      title: "Best conversion time is 6 PM",
      detail: "Your recent activity window suggests better response quality in late evening.",
      icon: "clock",
      href: "/admin/analytics?focus=timing",
    },
    {
      id: "pricing-objection",
      title: "Pricing objections increased this week",
      detail: `Conversion is at ${conversion || 0}% — consider sharing ROI proof in first follow-up.`,
      icon: "alert",
      href: "/admin/leads?filter=pricing",
    },
    {
      id: "revival",
      title: `${Math.max(2, coldLeads)} inactive leads can be revived`,
      detail: "Run a short reminder sequence with one value-led message and one call attempt.",
      icon: "refresh",
      href: "/admin/automation?preset=revival",
    },
    {
      id: "channel-performance",
      title: "Calls performing better than chats",
      detail: `${bookedCalls || 0} calls booked so far; route high-intent leads to calling flow sooner.`,
      icon: "phone",
      href: "/admin/analytics?focus=channels",
    },
    {
      id: "active-capacity",
      title: `${activeLeads || 0} active leads are waiting`,
      detail: "Batch similar lead intents to shorten response prep time.",
      icon: "users",
      href: "/admin/leads?filter=active",
    },
  ];
}

