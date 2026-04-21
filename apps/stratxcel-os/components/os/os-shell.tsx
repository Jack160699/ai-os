"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Globe, LogOut, MoreHorizontal, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { OS_MAIN_NAV, navActive } from "@/lib/os-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CopilotFab } from "@/components/os/copilot-fab";
import { AddLeadQuickButton } from "@/components/os/add-lead-quick-button";
import { CommandPalette } from "@/components/os/command-palette";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace, type WorkspaceId } from "@/components/os/workspace-context";

const MOBILE_BAR = OS_MAIN_NAV.slice(0, 4);
const MOBILE_MORE = OS_MAIN_NAV.slice(4);

function MobileMoreSheet({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl border-white/[0.08] pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">More</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex max-h-[min(60vh,28rem)] flex-col gap-0.5 overflow-y-auto pr-1">
          {MOBILE_MORE.map((n) => {
            const active = navActive(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-[#4F6BFF]/15 text-slate-100" : "text-slate-300 hover:bg-white/5",
                )}
              >
                <n.icon className="size-4 opacity-80" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function OsShell({ children, userLabel = "Operator" }: { children: React.ReactNode; userLabel?: string }) {
  const pathname = usePathname();
  const { id: workspaceId, label: workspaceLabel, setWorkspace } = useWorkspace();
  const [cmdOpen, setCmdOpen] = React.useState(false);

  const signOut = React.useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }, []);

  return (
    <div className="flex min-h-dvh bg-[#0B0F14] text-foreground">
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#1E2632] bg-[#0f141c] md:flex">
        <div className="flex h-14 items-center border-b border-[#1E2632] px-4">
          <Link href="/" className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">StratXcel</span>
            <span className="text-sm font-semibold tracking-tight text-white">StratXcel OS</span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {OS_MAIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = navActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                  active
                    ? "nav-item-active text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
                )}
              >
                <Icon className={cn("size-4", active ? "text-[#9aabff]" : "opacity-70")} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-[#1E2632] p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#1E2632] bg-[#121821] px-3 py-2 text-left text-xs font-medium text-slate-200 transition-colors hover:border-[#2a3442] hover:bg-[#141c27]"
              >
                <span className="truncate">{workspaceLabel}</span>
                <ChevronDown className="size-3.5 shrink-0 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 border-[#1E2632] bg-[#121821]">
              <DropdownMenuLabel className="text-[10px] font-normal uppercase tracking-wide text-slate-500">
                Workspace
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {(["india", "global"] as WorkspaceId[]).map((id) => (
                <DropdownMenuItem
                  key={id}
                  className="text-slate-200 focus:bg-white/10"
                  onClick={() => setWorkspace(id)}
                >
                  {id === "india" ? "StratXcel India" : "StratXcel Global"}
                  {workspaceId === id ? <span className="ml-auto text-[10px] text-[#90a2cf]">Active</span> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={() => setWorkspace("global")}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-500 transition-colors hover:text-slate-300",
              workspaceId === "global" && "text-[#90a2cf]",
            )}
          >
            <Globe className="size-3.5 opacity-70" />
            StratXcel Global
            <span className="ml-auto rounded border border-white/10 px-1 font-mono text-[9px] text-slate-600">v</span>
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-[#1E2632] bg-[#0B0F14]/95 px-3 backdrop-blur-xl md:gap-3 md:px-5">
          <div className="hidden shrink-0 md:block md:w-[248px]" aria-hidden />

          <div className="flex min-w-0 flex-1 justify-center">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="group relative flex h-9 w-full max-w-xl items-center gap-2 rounded-lg border border-[#1E2632] bg-[#121821] px-3 text-left text-sm text-slate-500 shadow-inner transition-colors hover:border-[#2a3442] hover:bg-[#141c27]"
            >
              <Search className="size-4 shrink-0 opacity-70" />
              <span className="truncate">Global command bar</span>
              <kbd className="ml-auto hidden shrink-0 rounded border border-[#253142] bg-[#111823] px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline-block">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
            <AddLeadQuickButton showLabel className="hidden border-white/10 sm:flex" />
            <AddLeadQuickButton className="border-white/10 sm:hidden" />
            <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-white/5" aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 gap-2 rounded-lg px-2 text-slate-200 hover:bg-white/5"
                  aria-label="Profile menu"
                >
                  <span className="flex size-7 items-center justify-center rounded-full border border-[#2b3550] bg-[#192233] text-xs font-semibold text-white">
                    {userLabel.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[7rem] truncate text-xs font-medium md:inline">{userLabel}</span>
                  <ChevronDown className="hidden size-3.5 opacity-50 md:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 border-[#1E2632] bg-[#121821]">
                <DropdownMenuLabel className="text-xs font-normal text-slate-500">Signed in as {userLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild className="text-slate-200 focus:bg-white/10">
                  <Link href="/more/settings" className="flex cursor-pointer items-center gap-2">
                    <Settings className="size-3.5 opacity-70" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="cursor-pointer text-slate-200 focus:bg-white/10"
                  onSelect={(e) => {
                    e.preventDefault();
                    void signOut();
                  }}
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="size-3.5 opacity-70" />
                    Log out
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:overflow-auto md:pb-0">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#1E2632] bg-[#0f141c]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl md:hidden">
          {MOBILE_BAR.map(({ href, label, icon: Icon }) => {
            const active = navActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-[#a2b0d6]" : "text-slate-500",
                )}
              >
                <Icon className={cn("size-5", active && "text-[#8ea0c4]")} />
                <span className="max-w-full truncate px-0.5">{label}</span>
              </Link>
            );
          })}
          <MobileMoreSheet>
            <button
              type="button"
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors",
                MOBILE_MORE.some((n) => navActive(pathname, n.href)) ? "text-[#a2b0d6]" : "text-slate-500",
              )}
            >
              <MoreHorizontal className="size-5" />
              More
            </button>
          </MobileMoreSheet>
        </nav>

        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
        <CopilotFab />
      </div>
    </div>
  );
}
