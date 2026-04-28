"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { NotificationCenter } from "@/components/v2/notification-center";

const ICONS = {
  grid: "◻",
  chat: "◉",
  coins: "◎",
  chart: "◍",
  users: "◌",
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
      className="rounded-xl border border-black/10 bg-black/3 px-3 py-2 text-xs font-medium text-[var(--v2-muted)] transition hover:bg-black/6 dark:border-white/15 dark:bg-white/5"
      onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

export function AppShell({ user, role, navItems, logoutAction, children }) {
  const pathname = usePathname();
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
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <motion.aside
          initial={{ x: -12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="hidden w-72 shrink-0 border-r border-black/8 bg-[var(--v2-surface)] p-6 shadow-sm dark:border-white/10 lg:block"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#60a5fa]">
            StratXcel V2
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--v2-text)]">Admin Dashboard</p>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? "bg-[#2563eb] text-white"
                      : "text-[var(--v2-muted)] hover:bg-black/5 hover:text-[var(--v2-text)] dark:hover:bg-white/10"
                  }`}
                >
                  <span className="text-xs">{ICONS[item.icon] || "•"}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-black/8 bg-[var(--v2-surface)]/90 px-4 py-4 backdrop-blur dark:border-white/10 md:px-8">
            <div>
              <p className="text-sm text-[var(--v2-muted)]">Signed in as</p>
              <p className="text-sm font-semibold">
                {userName} <span className="text-[var(--v2-muted)]">({role})</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <nav className="flex items-center gap-1 rounded-xl border border-black/10 p-1 dark:border-white/10 lg:hidden">
                {navItems.slice(0, 4).map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-lg px-2 py-1 text-xs ${
                        active
                          ? "bg-[#2563eb] text-white"
                          : "text-[var(--v2-muted)] hover:bg-black/5 dark:hover:bg-white/10"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <NotificationCenter />
              <ThemeToggle />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-xl border border-black/10 bg-black/3 px-3 py-2 text-xs font-medium text-[var(--v2-muted)] transition hover:bg-black/6 dark:border-white/15 dark:bg-white/5"
                >
                  Logout
                </button>
              </form>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
