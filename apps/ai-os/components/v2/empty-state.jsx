"use client";

import { useThemeStudio } from "@/components/v2/theme-provider";

export function EmptyState({ title, description }) {
  const { immersion } = useThemeStudio();
  const e = immersion.empty;

  return (
    <div className="rounded-xl border border-dashed border-[var(--v2-border)] bg-[var(--v2-elevated)]/50 p-4">
      <p className="text-sm font-medium text-[var(--v2-text)]">{title ?? e.genericTitle}</p>
      <p className="mt-1 text-xs text-[var(--v2-muted)]">{description ?? e.genericDescription}</p>
    </div>
  );
}
