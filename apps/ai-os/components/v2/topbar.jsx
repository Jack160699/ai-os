"use client";

import { Bell, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { ModeSwitch } from "@/components/v2/mode-switch";
import { ProfileMenu } from "@/components/v2/profile-menu";
import { useThemeStudio } from "@/components/v2/theme-provider";
import { UserStatus } from "@/components/v2/user-status";

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
      className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs font-medium text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)] active:scale-[0.98]"
      onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
    >
      <span className="inline-flex items-center gap-1.5">
        {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </button>
  );
}

export function Topbar({ userKey, userName, role, logoutAction, setMobileOpen }) {
  const { immersion } = useThemeStudio();
  const accentIcon = "text-[color-mix(in_oklab,var(--v2-accent)_82%,var(--v2-text))]";

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--v2-border)] bg-[var(--v2-bg)]/95 px-4 py-3 backdrop-blur-xl md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-2 text-[var(--v2-muted)] lg:hidden"
        >
          <Menu size={16} />
        </button>
        <div className="min-w-[220px] flex-1">
          <div className="v2-panel-soft flex max-w-xl items-center gap-2 rounded-xl border border-[var(--v2-border)] px-3 py-2.5">
            <Search size={14} className={accentIcon} strokeWidth={2} />
            <input readOnly value={immersion.search.placeholder} className="w-full bg-transparent text-xs tracking-tight text-[var(--v2-muted)] outline-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
          <button
            type="button"
            className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs font-medium text-[var(--v2-text)] transition hover:border-[var(--v2-focus)] hover:bg-[var(--v2-elevated)] active:scale-[0.98]"
          >
            <span className="inline-flex items-center gap-1.5">
              <Plus size={13} className={accentIcon} strokeWidth={2.25} />
              {immersion.buttons.quickAdd}
            </span>
          </button>
          <button
            type="button"
            className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)] hover:text-[var(--v2-text)] active:scale-[0.98]"
          >
            <span className="inline-flex items-center gap-1.5">
              <Bell size={13} className={accentIcon} strokeWidth={2} />
              {immersion.buttons.notifications}
            </span>
          </button>
          <ModeSwitch />
          <UserStatus userKey={userKey} userName={userName} role={role} />
          <ThemeToggle />
          <ProfileMenu userKey={userKey} userName={userName} role={role} logoutAction={logoutAction} />
        </div>
      </div>
    </header>
  );
}
