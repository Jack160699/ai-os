"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const presets = [
  { title: "Analyze lead", body: "Summarize intent, objections, and next best move for the active lead." },
  { title: "Suggest reply", body: "Draft a concise reply that moves the deal forward without sounding salesy." },
  { title: "Next action", body: "Recommend the single highest-leverage action for the next 30 minutes." },
  { title: "Generate message", body: "Create a short follow-up message with a clear CTA." },
] as const;

export function CopilotFab() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type="button"
        size="icon"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 h-12 w-12 rounded-full border border-sky-400/30 bg-gradient-to-br from-sky-600 to-indigo-700 shadow-lg shadow-sky-900/40 transition hover:brightness-110 md:bottom-8 md:right-6"
        aria-label="Open AI copilot"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-5 text-white" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="left-0 right-0 top-auto flex h-[min(72dvh,560px)] w-full max-w-none flex-col rounded-t-2xl border-t border-white/10 p-0 sm:left-auto sm:top-0 sm:h-full sm:max-w-md sm:rounded-none sm:border-l sm:border-t-0"
        >
          <SheetHeader className="space-y-1 border-b border-white/[0.06] px-5 py-4 text-left">
            <SheetTitle className="text-base">Copilot</SheetTitle>
            <SheetDescription className="text-xs">Fast actions. Wire to your model when ready.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {presets.map((p) => (
              <div key={p.title} className="os-glass rounded-lg p-3 transition hover:border-white/15">
                <p className="text-sm font-medium text-foreground">{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{p.body}</p>
              </div>
            ))}
            <Separator className="bg-white/10" />
            <p className="text-xs text-slate-500">
              Connect prompts to Supabase + your LLM route. This panel is intentionally minimal for operator speed.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
