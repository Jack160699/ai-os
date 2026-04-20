import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const links = [
  { href: "/more/automation", label: "Automation", hint: "Sequences & triggers" },
  { href: "/more/proposals", label: "Proposal templates", hint: "Send from inbox" },
  { href: "/more/payments", label: "Payments", hint: "Links & reconciliation" },
  { href: "/more/team", label: "Team", hint: "Roles & access" },
  { href: "/more/branding", label: "Branding", hint: "Client-facing polish" },
  { href: "/more/ai-workspace", label: "AI workspace", hint: "Prompts & tools" },
  { href: "/more/settings", label: "Settings", hint: "Batch, integrations" },
] as const;

export default function MorePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-3 md:p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">More</h1>
        <p className="text-sm text-slate-500">Secondary tools stay out of the main path.</p>
      </div>
      <div className="space-y-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="block">
            <Card className="flex items-center justify-between rounded-xl px-4 py-3 transition hover:border-white/15">
              <div>
                <p className="text-sm font-medium text-foreground">{l.label}</p>
                <p className="text-xs text-slate-500">{l.hint}</p>
              </div>
              <ChevronRight className="size-4 text-slate-500" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
