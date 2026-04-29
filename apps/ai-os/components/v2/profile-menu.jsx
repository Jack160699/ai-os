"use client";

import { useMemo } from "react";
import { ProfileCard } from "@/components/v2/profile-card";
import { useThemeStudio } from "@/components/v2/theme-provider";
import { getAnalyticsSummary } from "@/lib/v2/theme-analytics";

export function ProfileMenu({ userKey, userName, role, logoutAction }) {
  const { theme, immersion } = useThemeStudio();
  const p = immersion.profile;
  const identity = useMemo(() => {
    const stats = getAnalyticsSummary();
    const xp = 120 + (stats.totalThemeSwitches || 0) * 24;
    const level = Math.max(1, Math.floor(xp / 120) + 1);
    return { xp, level };
  }, []);

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs transition hover:border-[var(--v2-focus)] active:scale-[0.98]">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--v2-elevated)] text-[11px] font-semibold text-[var(--v2-text)]">
          {String(userName || "U").slice(0, 1).toUpperCase()}
        </span>
        <span className="text-left">
          <span className="block font-semibold text-[var(--v2-text)]">{userName}</span>
          <span className="block text-[10px] uppercase tracking-[0.12em] text-[var(--v2-muted)]">{role}</span>
        </span>
      </summary>
      <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-2 shadow-xl">
        <p className="px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--v2-muted)]">{p.workspaceLabel}</p>
        <ProfileCard userKey={userKey} userName={userName} role={role} themeName={theme.name} level={identity.level} xp={identity.xp} />
        {p.menu.map((item, idx) => (
          <button
            key={`${item}-${idx}`}
            type="button"
            className="mb-0.5 w-full rounded-lg px-2 py-2 text-left text-xs text-[var(--v2-muted)] transition hover:bg-[var(--v2-elevated)] hover:text-[var(--v2-text)] active:scale-[0.99]"
          >
            {item}
          </button>
        ))}
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-1 w-full rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-2 py-2 text-left text-xs text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)] hover:text-[var(--v2-text)] active:scale-[0.99]"
          >
            {p.signOut}
          </button>
        </form>
      </div>
    </details>
  );
}
