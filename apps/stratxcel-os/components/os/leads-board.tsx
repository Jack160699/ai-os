"use client";

import * as React from "react";
import type { Lead } from "@/lib/models";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { AddLeadQuickButton } from "@/components/os/add-lead-quick-button";

type Filter = "all" | "hot" | "unreplied" | "high_value";

const money = (cents: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    Math.round(cents / 100),
  );

export function LeadsBoard({ leads: initial }: { leads: Lead[] }) {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Lead | null>(null);

  const leads = React.useMemo(() => {
    let rows = initial.filter((l) => !l.archived);
    if (filter === "hot") rows = rows.filter((l) => l.temperature === "hot");
    if (filter === "unreplied") rows = rows.filter((l) => l.has_unreplied);
    if (filter === "high_value") rows = rows.filter((l) => l.estimated_value_cents >= 250000);
    return rows;
  }, [initial, filter]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 md:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <AddLeadQuickButton className="border-white/10 text-slate-200" />
        {(
          [
            ["all", "All"],
            ["hot", "Hot leads"],
            ["unreplied", "Unreplied"],
            ["high_value", "High value"],
          ] as const
        ).map(([key, label]) => (
          <Button key={key} type="button" size="sm" variant={filter === key ? "secondary" : "outline"} onClick={() => setFilter(key)}>
            {label}
          </Button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {leads.map((lead) => (
          <button
            key={lead.id}
            type="button"
            className="text-left"
            onClick={() => {
              setActive(lead);
              setOpen(true);
            }}
          >
            <Card className={cn("h-full rounded-xl transition hover:border-white/15")}>
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{lead.full_name}</CardTitle>
                  <div className="flex shrink-0 items-center gap-1">
                    {lead.temperature === "hot" ? <Badge variant="hot">Priority</Badge> : null}
                    <Badge variant={lead.temperature === "hot" ? "hot" : lead.temperature === "warm" ? "warm" : "cold"} className="capitalize">
                      {lead.temperature}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{lead.phone ?? "—"}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Source</span>
                  <span className="text-slate-200">{lead.source ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI score</span>
                  <span className="text-slate-200">{lead.ai_score}</span>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {active ? (
            <>
              <SheetHeader>
                <SheetTitle>{active.full_name}</SheetTitle>
                <SheetDescription>{active.phone ?? "No phone"}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">AI {active.ai_score}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {active.temperature}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Source</span>
                  <span className="text-right text-slate-200">{active.source ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Est. value</span>
                  <span className="text-right text-slate-200">{money(active.estimated_value_cents)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Unreplied</span>
                  <span className="text-right text-slate-200">{active.has_unreplied ? "Yes (needs reply)" : "No"}</span>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
