"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { recordPageView } from "@/lib/v2/theme-analytics";
import { useThemeStudio } from "@/components/v2/theme-provider";

/**
 * One increment per (theme, pathname) pair when either changes — anonymous internal usage.
 */
export function ThemeAnalyticsTracker() {
  const pathname = usePathname();
  const { themeId } = useThemeStudio();
  const last = useRef("");

  useEffect(() => {
    const key = `${themeId}::${pathname}`;
    if (last.current === key) return;
    last.current = key;
    recordPageView(themeId, pathname);
  }, [themeId, pathname]);

  return null;
}
