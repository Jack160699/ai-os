"use client";

import { useThemeStudio } from "@/components/v2/theme-provider";

const MENU_ITEMS = [
  "Profile",
  "Preferences",
  "Theme",
  "Notifications",
  "Security",
  "Billing",
  "Help Center",
  "Keyboard Shortcuts",
];

export function ProfileMenu({ userName, role, logoutAction }) {
  const { theme } = useThemeStudio();

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--v2-elevated)] text-[11px] font-semibold text-[var(--v2-text)]">
          {String(userName || "U").slice(0, 1).toUpperCase()}
        </span>
        <span className="text-left">
          <span className="block font-semibold text-[var(--v2-text)]">{userName}</span>
          <span className="block text-[10px] uppercase tracking-[0.12em] text-[var(--v2-muted)]">{role}</span>
        </span>
      </summary>
      <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-2 shadow-xl">
        <p className="px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--v2-muted)]">STRATXCEL OS</p>
        <div className="mb-2 mt-1 rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-2 py-2">
          <p className="text-xs font-semibold text-[var(--v2-text)]">{userName}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--v2-muted)]">{role}</p>
          <p className="mt-1 text-[10px] text-[var(--v2-muted)]">Theme: {theme.name}</p>
        </div>
        {MENU_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            className="mb-0.5 w-full rounded-lg px-2 py-2 text-left text-xs text-[var(--v2-muted)] transition hover:bg-[var(--v2-elevated)] hover:text-[var(--v2-text)]"
          >
            {item}
          </button>
        ))}
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-1 w-full rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-2 py-2 text-left text-xs text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)] hover:text-[var(--v2-text)]"
          >
            Sign Out
          </button>
        </form>
      </div>
    </details>
  );
}
