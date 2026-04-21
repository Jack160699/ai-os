"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { createLead } from "@/app/(os)/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function AddLeadQuickButton({ className, showLabel }: { className?: string; showLabel?: boolean }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type="button"
        size={showLabel ? "sm" : "icon"}
        variant="outline"
        aria-label="Add lead"
        className={cn(showLabel && "gap-1.5 px-3", className)}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        {showLabel ? <span className="hidden text-xs font-medium sm:inline">Quick add</span> : null}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="left-0 right-0 top-auto flex h-[min(88dvh,640px)] w-full max-w-none flex-col rounded-t-2xl border-t border-white/10 p-0 sm:left-auto sm:top-0 sm:h-full sm:max-w-md sm:rounded-none sm:border-l sm:border-t-0"
        >
          <SheetHeader className="space-y-1 border-b border-white/[0.06] px-5 py-4 text-left">
            <SheetTitle className="text-base">Add lead</SheetTitle>
            <SheetDescription className="text-xs">Creates a lead and an empty inbox thread for the active batch.</SheetDescription>
          </SheetHeader>
          <form action={createLead} className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Name</Label>
              <Input id="full_name" name="full_name" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" inputMode="tel" autoComplete="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" placeholder="Ads / referral / inbound" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_value_major">Est. deal value (major units)</Label>
              <Input id="estimated_value_major" name="estimated_value_major" inputMode="decimal" placeholder="0" defaultValue="0" />
            </div>
            <div className="mt-auto flex gap-2 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
