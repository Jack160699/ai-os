"use client";

import { Bell, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { ModeSwitch } from "@/components/v2/mode-switch";
import { ProfileMenu } from "@/components/v2/profile-menu";

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
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

export function Topbar({ userName, role, logoutAction, setMobileOpen }) {
  return (
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
              Notifications
            </span>
          </button>
          <ModeSwitch />
          <ThemeToggle />
          <ProfileMenu userName={userName} role={role} logoutAction={logoutAction} />
        </div>
      </div>
    </header>
  );
}
