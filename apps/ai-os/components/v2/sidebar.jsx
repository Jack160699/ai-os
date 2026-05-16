"use client";

import { ChevronLeft, ChevronRight, CircleUserRound, CreditCard, House, Inbox, Settings, Users } from "lucide-react";
import Link from "next/link";
import { ThemeStudio } from "@/components/v2/theme-studio";

const ICONS = {
  "/v2": House,
  "/v2/inbox": Inbox,
  "/v2/payments": CreditCard,
  "/v2/team": Users,
  "/v2/settings": Settings,
};

export function Sidebar({ navItems, pathname, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-[var(--v2-border)] bg-[var(--v2-panel)] transition-[width,transform] duration-200 ease-out touch-pan-y lg:static ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${collapsed ? "w-[72px]" : "w-[220px]"}`}
    >
      <div
        className={`flex h-14 items-center border-b border-[var(--v2-border)]/80 px-3 lg:h-[3.75rem] lg:px-4 ${
          collapsed ? "justify-center" : "justify-between gap-2"
        }`}
      >
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--v2-muted)]">Console</p>
          </div>
        ) : (
          <span className="sr-only">Navigation</span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={`hidden rounded-md border border-[var(--v2-border)]/90 bg-transparent p-1.5 text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)] hover:text-[var(--v2-text)] lg:inline-flex ${collapsed ? "" : "ml-auto"}`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={1.75} /> : <ChevronLeft size={14} strokeWidth={1.75} />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-px overflow-y-auto px-2 py-4" aria-label="Primary">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = ICONS[item.href] || CircleUserRound;
          const row = collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5";
          const state = active
            ? collapsed
              ? "bg-[color-mix(in_oklab,var(--v2-elevated)_75%,transparent)] text-[var(--v2-text)]"
              : "border-l-2 border-[color-mix(in_oklab,var(--v2-accent)_65%,var(--v2-muted))] bg-[color-mix(in_oklab,var(--v2-elevated)_88%,transparent)] pl-[10px] text-[var(--v2-text)]"
            : collapsed
              ? "text-[var(--v2-muted)] hover:bg-[var(--v2-elevated)]/50 hover:text-[var(--v2-text)]"
              : "border-l-2 border-transparent text-[var(--v2-muted)] hover:bg-[var(--v2-elevated)]/60 hover:text-[var(--v2-text)]";
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center rounded-md text-[13px] font-normal tracking-[-0.01em] transition-colors duration-200 active:scale-[0.99] ${row} ${state}`}
            >
              <Icon
                size={16}
                strokeWidth={1.75}
                className={`shrink-0 ${active ? "text-[var(--v2-text)]" : "text-[var(--v2-muted)] group-hover:text-[var(--v2-text)]"}`}
              />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="mt-auto border-t border-[var(--v2-border)]/80 px-3 py-4">
          <ThemeStudio variant="minimal" />
        </div>
      ) : null}
    </aside>
  );
}
