"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ModeSwitch } from "@/components/v2/mode-switch";
import { NotificationCenter } from "@/components/v2/notification-center";

const ICONS = {
  grid: "▦",
  chat: "◍",
  coins: "◒",
  users: "◎",
  settings: "◈",
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
      className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium text-[var(--v2-muted)] transition hover:border-white/20 hover:bg-white/[0.05]"
      onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

export function AppShell({ user, role, navItems, logoutAction, children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const userName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")?.[0] ||
      "User"
    );
  }, [user]);

  return (
    <div className="min-h-screen bg-[#05070b] text-[var(--v2-text)] transition-colors duration-200">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
        <motion.aside
          initial={{ x: -12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`hidden shrink-0 border-r border-white/10 bg-[#0a0f19] p-4 transition-all duration-200 lg:block ${
            collapsed ? "w-[76px]" : "w-[236px]"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            {!collapsed ? (
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#7ea6ff]">Operations</p>
                <p className="mt-1 text-sm font-semibold text-white">Admin Console</p>
              </div>
            ) : (
              <p className="mx-auto text-sm font-semibold text-[#7ea6ff]">V2</p>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-[var(--v2-muted)] transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>

          <nav className="mt-4 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : ""}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? "border border-[#1d4ed8]/45 bg-[#1d4ed8]/22 text-white shadow-[0_0_0_1px_rgba(29,78,216,0.18)]"
                      : "border border-transparent text-[#94a3b8] hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className={`text-xs ${active ? "text-[#90b4ff]" : "text-white/70 group-hover:text-white"}`}>
                    {ICONS[item.icon] || "•"}
                  </span>
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-4">
            {!collapsed ? (
              <>
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]">System</p>
                <p className="mt-2 text-xs text-white">Operational</p>
                <p className="text-[11px] text-[#94a3b8]">Version 2.0.0</p>
                <div className="mt-3">
                  <button
                    type="button"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-[#94a3b8] transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    Theme Control
                  </button>
                </div>
              </>
            ) : (
              <span className="mx-auto block h-2.5 w-2.5 rounded-full bg-emerald-400" />
            )}
          </div>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070c15]/92 px-4 py-3 backdrop-blur md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-[220px] flex-1">
                <div className="flex max-w-xl items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                  <span className="text-xs text-white/50">⌘K</span>
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
                  className="rounded-xl border border-[#1d4ed8]/45 bg-[#1d4ed8]/22 px-3 py-2 text-xs font-medium text-[#c8d9ff] transition hover:bg-[#1d4ed8]/28"
                >
                  + Quick Add
                </button>
                <NotificationCenter />
                <ThemeToggle />
                <ModeSwitch />
                <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
                  <p className="font-medium text-white">{userName}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--v2-muted)]">{role}</p>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium text-[var(--v2-muted)] transition hover:border-white/20 hover:bg-white/[0.05]"
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
        </div>
      </div>
    </div>
  );
}
