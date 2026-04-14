export function getAssistantPageLabel(pathname = "") {
  const path = String(pathname || "");
  if (path.startsWith("/admin/chats")) return "Inbox";
  if (path.startsWith("/admin/payments")) return "Payments";
  if (path.startsWith("/admin/team")) return "Team";
  if (path.startsWith("/admin/leads")) return "Leads";
  if (path.startsWith("/admin/analytics")) return "Analytics";
  return "Dashboard";
}

export function buildAssistantReply(input, pathname = "") {
  const text = String(input || "").toLowerCase();
  const page = getAssistantPageLabel(pathname);

  if (text.includes("hot lead")) return { text: "You have high-intent leads waiting. Prioritize unread hot threads first.", href: "/admin/chats?segment=hot" };
  if (text.includes("conversion") || text.includes("dropped"))
    return { text: "Conversion dip usually comes from delayed follow-ups and weak qualification. Check timing and objection patterns.", href: "/admin/analytics?focus=conversion" };
  if (text.includes("campaign")) return { text: "Recommended: start a short nurture campaign with one proof message and one call CTA.", href: "/admin/automation?preset=campaign" };
  if (text.includes("pending") || text.includes("followup")) return { text: "Pending follow-ups are concentrated in active pipeline lanes. Move top 10 first.", href: "/admin/pipeline?filter=pending" };
  if (text.includes("today") || text.includes("performance")) return { text: "Today is stable. Lead inflow is healthy and response quality remains consistent.", href: "/admin/analytics?focus=today" };

  if (page === "Payments") return { text: "For payments, keep links short-lived and send reminders 30 minutes before follow-up.", href: "/admin/payments" };
  if (page === "Team") return { text: "Team health tip: keep manager ownership on hot leads and finance ownership on overdue payments.", href: "/admin/team" };
  if (page === "Inbox") return { text: "Inbox tip: respond to unread hot leads within 10 minutes for better close probability.", href: "/admin/chats?segment=hot" };
  if (page === "Leads") return { text: "Lead quality is best improved by tighter qualification and quick second-touch follow-ups.", href: "/admin/leads" };
  return { text: "I can help with leads, conversions, campaigns, and payments. Ask for a focused action.", href: "/admin" };
}

export const ASSISTANT_QUICK_PROMPTS = [
  "Show hot leads",
  "Why conversions dropped?",
  "Create campaign",
  "Show pending followups",
  "Summarize today performance",
];

