"use client";

import { useThemeStudio } from "@/components/v2/theme-provider";

export function EmptyState({ title, description }) {
  const { immersion } = useThemeStudio();
  const e = immersion.empty;

  return (
    <div className="rounded-xl border border-dashed border-[var(--v2-border)] bg-[var(--v2-elevated)]/45 p-4">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[color-mix(in_oklab,var(--v2-accent)_80%,var(--v2-text))]" />
        <p className="text-sm font-medium text-[var(--v2-text)]">{title ?? e.genericTitle}</p>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--v2-muted)]">{description ?? e.genericDescription}</p>
    </div>
  );
}
