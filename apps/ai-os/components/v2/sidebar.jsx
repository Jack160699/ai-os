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
      className={`fixed inset-y-0 left-0 z-40 shrink-0 border-r border-[var(--v2-border)] bg-[var(--v2-panel)] p-4 transition-all duration-200 lg:static ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${collapsed ? "w-[76px]" : "w-[236px]"}`}
    >
      <div className="mb-4 flex items-center justify-between">
        {!collapsed ? (
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--v2-muted)]">Workspace</p>
            <p className="mt-1 text-sm font-semibold text-[var(--v2-text)]">Admin</p>
          </div>
        ) : (
          <p className="mx-auto text-sm font-semibold text-[var(--v2-text)]">V2</p>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="hidden rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-2 py-1 text-[11px] text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)] lg:inline-flex"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      <nav className="mt-4 space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = ICONS[item.href] || CircleUserRound;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : ""}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "border border-[var(--v2-focus)] bg-[var(--v2-elevated)] text-[var(--v2-text)]"
                  : "border border-transparent text-[var(--v2-muted)] hover:border-[var(--v2-border)] hover:bg-[var(--v2-elevated)] hover:text-[var(--v2-text)]"
              }`}
            >
              <Icon size={15} className={active ? "text-[var(--v2-text)]" : "text-[var(--v2-muted)] group-hover:text-[var(--v2-text)]"} />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-[var(--v2-border)] pt-4">
        {!collapsed ? (
          <>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--v2-muted)]">System Status</p>
            <p className="mt-1 text-xs text-[var(--v2-text)]">Operational</p>
            <p className="text-[11px] text-[var(--v2-muted)]">Version 2.0.0</p>
            <div className="mt-3">
              <ThemeStudio />
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}
