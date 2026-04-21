"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Home,
  Inbox,
  Kanban,
  LayoutGrid,
  LogOut,
  MoreHorizontal,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CopilotFab } from "@/components/os/copilot-fab";
import { AddLeadQuickButton } from "@/components/os/add-lead-quick-button";
import { createClient } from "@/lib/supabase/client";

const primaryNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/leads", label: "Leads", icon: LayoutGrid },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
] as const;

const moreLinks = [
  { href: "/more/automation", label: "Automation" },
  { href: "/more/proposals", label: "Proposal templates" },
  { href: "/more/payments", label: "Payments" },
  { href: "/more/team", label: "Team" },
  { href: "/more/branding", label: "Branding" },
  { href: "/more/ai-workspace", label: "AI workspace" },
  { href: "/more/settings", label: "Settings" },
] as const;

function isPrimaryActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
        <nav className="mt-4 flex max-h-[min(60vh,28rem)] flex-col gap-1 overflow-y-auto pr-1">
          {moreLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2.5 text-sm text-slate-200 transition-colors hover:bg-white/5"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function OsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(() => pathname.startsWith("/more"));

  React.useEffect(() => {
    if (pathname.startsWith("/more")) setMoreOpen(true);
  }, [pathname]);

  const moreActive = pathname.startsWith("/more");

  const signOut = React.useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }, []);

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/[0.06] bg-[oklch(0.12_0.02_260)] md:flex">
        <div className="flex h-14 items-center border-b border-white/[0.06] px-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
            StratXcel OS
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {primaryNav.map(({ href, label, icon: Icon }) => {
            const active = isPrimaryActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-white/10 text-foreground shadow-sm" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                )}
              >
                <Icon className="size-4 opacity-80" />
                {label}
              </Link>
            );
          })}

          <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
            <CollapsibleTrigger
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                moreActive ? "bg-white/10 text-foreground" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )}
            >
              <span className="flex items-center gap-2">
                <MoreHorizontal className="size-4 opacity-80" />
                More
              </span>
              <ChevronDown className={cn("size-4 opacity-60 transition-transform", moreOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 pl-2 pt-0.5 data-[state=closed]:animate-none">
              {moreLinks.map((l) => {
                const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "block rounded-md py-1.5 pl-7 pr-2 text-[13px] transition-colors",
                      active ? "text-sky-200" : "text-slate-500 hover:text-slate-300",
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-white/[0.06] bg-background/85 px-3 backdrop-blur-xl md:px-4">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input placeholder="Search leads, messages…" className="h-9 w-full border-white/[0.08] bg-white/[0.03] pl-9 shadow-inner" />
            </div>
            <div className="flex flex-1 items-center md:hidden">
              <span className="text-sm font-semibold tracking-tight">StratXcel OS</span>
            </div>
          </div>
          <AddLeadQuickButton className="border-white/10 text-slate-200" />
          <Button variant="ghost" size="icon" className="text-slate-300" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-300" aria-label="Profile">
                <UserRound className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-white/[0.08] bg-[oklch(0.16_0.02_260)]">
              <DropdownMenuLabel className="text-xs font-normal text-slate-500">Account</DropdownMenuLabel>
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
        </header>

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:overflow-auto md:pb-0">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/[0.08] bg-[oklch(0.12_0.02_260/0.92)] px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl md:hidden">
          {primaryNav.map(({ href, label, icon: Icon }) => {
            const active = isPrimaryActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-sky-300" : "text-slate-500",
                )}
              >
                <Icon className={cn("size-5", active && "text-sky-400")} />
                {label}
              </Link>
            );
          })}
          <MobileMoreSheet>
            <button
              type="button"
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors",
                moreActive ? "text-sky-300" : "text-slate-500",
              )}
            >
              <MoreHorizontal className={cn("size-5", moreActive && "text-sky-400")} />
              More
            </button>
          </MobileMoreSheet>
        </nav>

        <CopilotFab />
      </div>
    </div>
  );
}
