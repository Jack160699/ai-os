"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Home,
  Inbox,
  LayoutGrid,
  MoreHorizontal,
  Search,
  UserRound,
  Kanban,
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
import { CopilotFab } from "@/components/os/copilot-fab";
import { AddLeadQuickButton } from "@/components/os/add-lead-quick-button";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/leads", label: "Leads", icon: LayoutGrid },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/more", label: "More", icon: MoreHorizontal },
] as const;

export function OsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/[0.06] bg-[oklch(0.12_0.02_260)] md:flex">
        <div className="flex h-14 items-center border-b border-white/[0.06] px-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
            StratXcel OS
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-white/10 text-foreground" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                )}
              >
                <Icon className="size-4 opacity-80" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-white/[0.06] bg-background/80 px-3 backdrop-blur-md md:px-4">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input placeholder="Search leads, messages…" className="h-9 w-full pl-9" />
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/more">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:overflow-auto md:pb-0">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/[0.08] bg-[oklch(0.12_0.02_260/0.92)] px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md md:hidden">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
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
        </nav>

        <CopilotFab />
      </div>
    </div>
  );
}
