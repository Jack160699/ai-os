/**
 * Page-aware suggested actions for StratXcel Copilot.
 * Labels rotate between premium section titles per route.
 */

const SECTION_TITLES = ["Suggested Actions", "Recommended Moves", "Smart Commands", "Try These", "Next Best Actions"];

function titleForPath(path) {
  const h = path.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return SECTION_TITLES[h % SECTION_TITLES.length];
}

function items(path) {
  const p = path || "/admin";
  if (p === "/admin" || p.startsWith("/admin?")) {
    return [
      { id: "dash-1", label: "Analyze today performance", prompt: "Analyze today performance and highlight weak metrics." },
      { id: "dash-2", label: "Show weak metrics", prompt: "Which KPIs are underperforming vs last week?" },
      { id: "dash-3", label: "Rearrange widgets", prompt: "Suggest a better dashboard widget order for operators." },
      { id: "dash-4", label: "Improve dashboard layout", prompt: "Improve this page layout for faster scanning." },
      { id: "dash-5", label: "Show cost leaks", prompt: "Where are we leaking cost in AI usage?" },
      { id: "dash-6", label: "Add new KPI widget", prompt: "Propose a new KPI widget for pipeline velocity." },
      { id: "dash-7", label: "Build growth plan", prompt: "Draft a 30-day growth plan from current metrics." },
    ];
  }
  if (p.startsWith("/admin/chats")) {
    return [
      { id: "inbox-1", label: "Show hot unread leads", prompt: "Open hot unread conversations and summarize urgency." },
      { id: "inbox-2", label: "Draft reply to latest chat", prompt: "Draft a concise reply for the latest thread." },
      { id: "inbox-3", label: "Find leads likely to convert", prompt: "List leads most likely to convert this week." },
      { id: "inbox-4", label: "Bulk follow up", prompt: "Plan a bulk follow-up for stale threads >48h." },
      { id: "inbox-5", label: "Show response delays", prompt: "Show average response delays by lane." },
      { id: "inbox-6", label: "Auto assign chats", prompt: "Suggest auto-assignment rules for inbox load balancing." },
    ];
  }
  if (p.startsWith("/admin/leads")) {
    return [
      { id: "lead-1", label: "Rank hottest leads", prompt: "Rank top 10 hottest leads by intent and recency." },
      { id: "lead-2", label: "Segment by quality", prompt: "Segment leads into A/B/C quality buckets." },
      { id: "lead-3", label: "Show cold leads", prompt: "List cold leads that need revival." },
      { id: "lead-4", label: "Create follow-up plan", prompt: "Create a follow-up plan for active pipeline." },
      { id: "lead-5", label: "Add new lead field company size", prompt: "Add schema field company size to leads." },
      { id: "lead-6", label: "Export lead sheet", prompt: "Prepare a CSV export of current lead filters." },
    ];
  }
  if (p.startsWith("/admin/payments") || p.startsWith("/admin/billing")) {
    return [
      { id: "pay-1", label: "Show pending payments", prompt: "List all pending payment links and amounts." },
      { id: "pay-2", label: "Create payment link", prompt: "Create payment link for Rahul ₹2999" },
      { id: "pay-3", label: "Send reminder messages", prompt: "Draft WhatsApp reminders for overdue invoices." },
      { id: "pay-4", label: "Add Razorpay integration", prompt: "Open integration checklist for Razorpay." },
      { id: "pay-5", label: "Export revenue report", prompt: "Export revenue summary for this month." },
      { id: "pay-6", label: "Show failed transactions", prompt: "Show failed transactions in the last 14 days." },
    ];
  }
  if (p.startsWith("/admin/team")) {
    return [
      { id: "team-1", label: "Invite new manager", prompt: "Invite Aman as manager" },
      { id: "team-2", label: "Change permissions", prompt: "Open permissions matrix for team roles." },
      { id: "team-3", label: "Show productivity report", prompt: "Summarize team productivity vs targets." },
      { id: "team-4", label: "Detect inactive agents", prompt: "Flag agents inactive for 7+ days." },
      { id: "team-5", label: "Create shifts", prompt: "Suggest shift coverage for peak hours." },
      { id: "team-6", label: "Compare performance", prompt: "Compare agent performance this week." },
    ];
  }
  if (p.startsWith("/admin/branding")) {
    return [
      { id: "brand-1", label: "Improve colors", prompt: "Suggest a premium palette aligned with trust." },
      { id: "brand-2", label: "Replace logo", prompt: "Checklist for safe logo replacement across surfaces." },
      { id: "brand-3", label: "Generate landing page", prompt: "Outline a high-converting landing page structure." },
      { id: "brand-4", label: "White-label setup", prompt: "White-label rollout steps for enterprise clients." },
      { id: "brand-5", label: "Improve trust design", prompt: "Identify trust gaps in current branding." },
      { id: "brand-6", label: "Brand consistency scan", prompt: "Run a mock brand consistency scan." },
    ];
  }
  if (p.startsWith("/admin/analytics")) {
    return [
      { id: "ana-1", label: "Explain conversion drop", prompt: "Explain conversion drop vs last period." },
      { id: "ana-2", label: "Show growth opportunities", prompt: "List top 5 growth opportunities from data." },
      { id: "ana-3", label: "Compare weekly data", prompt: "Compare this week vs last week KPIs." },
      { id: "ana-4", label: "Build new chart", prompt: "Suggest a new chart for funnel health." },
      { id: "ana-5", label: "Funnel leak report", prompt: "Generate a funnel leak report." },
      { id: "ana-6", label: "Export insights PDF", prompt: "Prepare mock PDF export of insights." },
    ];
  }
  if (p.startsWith("/admin/automation")) {
    return [
      { id: "auto-1", label: "Build nurture campaign", prompt: "Build WhatsApp reminder automation" },
      { id: "auto-2", label: "Add WhatsApp reminder flow", prompt: "Draft a 3-step WhatsApp reminder flow." },
      { id: "auto-3", label: "Add abandoned lead sequence", prompt: "Create abandoned lead nurture sequence." },
      { id: "auto-4", label: "Improve timing logic", prompt: "Optimize send windows for higher reply rate." },
      { id: "auto-5", label: "Create follow-up ladder", prompt: "Design a follow-up ladder for warm leads." },
    ];
  }
  if (p.startsWith("/admin/partners")) {
    return [
      { id: "part-1", label: "Show top referrers", prompt: "Rank referrers by signups this month." },
      { id: "part-2", label: "Calculate payouts", prompt: "Calculate pending partner payouts." },
      { id: "part-3", label: "Build referral landing page", prompt: "Outline referral landing page sections." },
      { id: "part-4", label: "Optimize commissions", prompt: "Suggest commission structure tweaks." },
    ];
  }
  if (p.startsWith("/admin/pipeline")) {
    return [
      { id: "pipe-1", label: "Surface stuck deals", prompt: "List deals stuck >5 days per stage." },
      { id: "pipe-2", label: "Forecast close", prompt: "Forecast likely closes for this week." },
    ];
  }
  if (p.startsWith("/admin/my-ai")) {
    return [
      { id: "my-1", label: "Resume last workflow", prompt: "Resume my last saved automation draft." },
      { id: "my-2", label: "Summarize my week", prompt: "Summarize my AI usage and wins this week." },
    ];
  }
  if (p.startsWith("/admin/ai-control")) {
    return [
      { id: "ctl-1", label: "Run diagnostics", prompt: "Diagnose system" },
      { id: "ctl-2", label: "Flush action queue", prompt: "Show action queue status and clear mock queue." },
    ];
  }
  return [
    { id: "gen-1", label: "Open payments", prompt: "Take me to payments" },
    { id: "gen-2", label: "Open team", prompt: "Take me to team" },
    { id: "gen-3", label: "Diagnose system", prompt: "Diagnose system" },
  ];
}

export function getCopilotContext(pathname) {
  const path = pathname || "/admin";
  return {
    sectionTitle: titleForPath(path),
    actions: items(path),
  };
}
