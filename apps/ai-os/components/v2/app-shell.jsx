"use client";

import { motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  House,
  Inbox,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ModeSwitch } from "@/components/v2/mode-switch";

const ICONS = {
  "/v2": House,
  "/v2/inbox": Inbox,
  "/v2/payments": CreditCard,
  "/v2/team": Users,
  "/v2/settings": Settings,
};

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const persisted = window.localStorage.getItem("v2-theme");
    return persisted === "light" || persisted === "dark" ? persisted : "dark";
  });

  useEffect(() => {
    window.localStorage.setItem("v2-theme", theme);
    document.documentElement.dataset.v2Theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <button
      type="button"
      className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs font-medium text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)]"
      onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
    >
      <span className="inline-flex items-center gap-1.5">
        {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </button>
  );
}

export function AppShell({ user, role, navItems, logoutAction, children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")?.[0] ||
      "User"
    );
  }, [user]);

  return (
    <div className="min-h-screen bg-[var(--v2-bg)] text-[var(--v2-text)] transition-colors duration-200">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-black/55 lg:hidden"
          />
        ) : null}
        <motion.aside
          initial={{ x: -12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`fixed inset-y-0 left-0 z-40 shrink-0 border-r border-[var(--v2-border)] bg-[var(--v2-panel)] p-4 transition-all duration-200 lg:static ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${collapsed ? "w-[76px]" : "w-[236px]"}
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            {!collapsed ? (
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--v2-muted)]">Operations</p>
                <p className="mt-1 text-sm font-semibold text-[var(--v2-text)]">Admin Console</p>
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
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] p-1 text-[var(--v2-muted)] lg:hidden"
            >
              <X size={12} />
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
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]">System</p>
                <p className="mt-2 text-xs text-[var(--v2-text)]">Operational</p>
                <p className="text-[11px] text-[var(--v2-muted)]">Version 2.0.0</p>
                <div className="mt-3">
                  <ThemeToggle />
                </div>
              </>
            ) : (
              <span className="mx-auto block h-2.5 w-2.5 rounded-full bg-[var(--v2-muted)]" />
            )}
          </div>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--v2-border)] bg-[var(--v2-bg)]/95 px-4 py-3 backdrop-blur md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-2 text-[var(--v2-muted)] lg:hidden"
              >
                <Menu size={16} />
              </button>
              <div className="min-w-[220px] flex-1">
                <div className="flex max-w-xl items-center gap-2 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2">
                  <Search size={14} className="text-[var(--v2-muted)]" />
                  <input
                    readOnly
                    value="Search dashboard, conversations, payments..."
                    className="w-full bg-transparent text-xs text-[var(--v2-muted)] outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs font-medium text-[var(--v2-text)] transition hover:bg-[var(--v2-elevated)]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Plus size={13} />
                    New
                  </span>
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs text-[var(--v2-muted)]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Bell size={13} />
                    Alerts
                  </span>
                </button>
                <ModeSwitch />
                <ThemeToggle />
                <details className="relative">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--v2-elevated)] text-[11px] font-semibold">
                      {String(userName).slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-left">
                      <span className="block font-semibold text-[var(--v2-text)]">{userName}</span>
                      <span className="block text-[10px] uppercase tracking-[0.12em] text-[var(--v2-muted)]">{role}</span>
                    </span>
                  </summary>
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-2 shadow-xl">
                    <button type="button" className="w-full rounded-lg px-2 py-2 text-left text-xs text-[var(--v2-muted)] hover:bg-[var(--v2-elevated)] hover:text-[var(--v2-text)]">
                      Profile
                    </button>
                    <button type="button" className="w-full rounded-lg px-2 py-2 text-left text-xs text-[var(--v2-muted)] hover:bg-[var(--v2-elevated)] hover:text-[var(--v2-text)]">
                      Preferences
                    </button>
                  </div>
                </details>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs font-medium text-[var(--v2-muted)] transition hover:bg-[var(--v2-elevated)]"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className="flex-1 bg-[#05070b] px-4 py-6 md:px-8">
            <div className="mx-auto w-full max-w-[1320px]">{children}</div>
          </main>
          <nav className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-[var(--v2-border)] bg-[var(--v2-panel)] p-2 lg:hidden">
            {navItems.slice(0, 5).map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = ICONS[item.href] || CircleUserRound;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] ${
                    active ? "text-[var(--v2-text)]" : "text-[var(--v2-muted)]"
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
