"use client";

import { useThemeStudio } from "@/components/v2/theme-provider";

/**
 * @param {"dashboard"|"inbox"|"team"|"payments"|"settings"|undefined} page — when set, title/subtitle default from theme immersion unless overridden.
 */
export function PageHeader({ page, title, subtitle, action }) {
  const { immersion } = useThemeStudio();
  const meta = page ? immersion?.pages?.[page] : null;
  const resolvedTitle = title ?? meta?.title ?? "";
  const resolvedSubtitle = subtitle ?? meta?.subtitle ?? "";
  const showWelcome = page === "dashboard";

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="v2-title-tight text-2xl font-semibold tracking-tight text-[var(--v2-text)] md:text-[1.78rem]">{resolvedTitle}</h1>
        {resolvedSubtitle ? <p className="mt-1.5 text-sm text-[var(--v2-muted)]">{resolvedSubtitle}</p> : null}
        {showWelcome ? (
          <p className="mt-2 text-xs font-medium tracking-tight text-[color-mix(in_oklab,var(--v2-accent)_88%,var(--v2-text))]">{immersion.welcome}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
