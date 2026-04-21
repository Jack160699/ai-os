import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  Home,
  Inbox,
  Kanban,
  LayoutGrid,
  LineChart,
  Settings,
  Sparkles,
} from "lucide-react";

export type OsNavItem = { href: string; label: string; icon: LucideIcon; keywords: string[] };

export const OS_MAIN_NAV: OsNavItem[] = [
  { href: "/", label: "Dashboard", icon: Home, keywords: ["home", "status", "hub"] },
  { href: "/inbox", label: "Inbox", icon: Inbox, keywords: ["messages", "mail"] },
  { href: "/leads", label: "Leads", icon: LayoutGrid, keywords: ["contacts", "crm"] },
  { href: "/pipeline", label: "Pipeline", icon: Kanban, keywords: ["board", "deals"] },
  { href: "/more/payments", label: "Payments", icon: CreditCard, keywords: ["links", "razorpay"] },
  { href: "/analytics", label: "Analytics", icon: LineChart, keywords: ["reports", "metrics"] },
  { href: "/more/ai-workspace", label: "AI Copilot", icon: Sparkles, keywords: ["ai", "prompts"] },
  { href: "/more/settings", label: "Settings", icon: Settings, keywords: ["account", "batch"] },
];

export function navActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
