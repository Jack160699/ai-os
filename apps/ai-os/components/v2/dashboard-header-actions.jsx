"use client";

import { useThemeStudio } from "@/components/v2/theme-provider";

export function DashboardHeaderActions() {
  const { immersion } = useThemeStudio();
  const p = immersion.pages.dashboard;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)] hover:text-[var(--v2-text)]"
      >
        {p.export}
      </button>
      <button
        type="button"
        className="rounded-xl border border-[color-mix(in_oklab,var(--v2-accent)_45%,var(--v2-border))] bg-[color-mix(in_oklab,var(--v2-accent)_12%,var(--v2-elevated))] px-3 py-2 text-xs font-medium text-[var(--v2-text)] transition hover:border-[var(--v2-accent)]"
      >
        {p.newReport}
      </button>
    </div>
  );
}
