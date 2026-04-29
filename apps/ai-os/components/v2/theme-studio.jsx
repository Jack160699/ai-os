"use client";

import { useEffect, useState } from "react";
import { getAnalyticsSummary, recordThemeSelected, recordThemeSwitch } from "@/lib/v2/theme-analytics";
import { getThemeById, listThemes } from "@/lib/v2/themes";
import { useThemeStudio } from "@/components/v2/theme-provider";

export function ThemeStudio() {
  const { themeId, theme, immersion, setThemeId } = useThemeStudio();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [stats, setStats] = useState(() => getAnalyticsSummary());
  const themes = listThemes();

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 1600);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="relative">
      <div className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] p-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--v2-muted)]">Theme Studio</p>
        <p className="mt-1 text-xs text-[var(--v2-muted)]">Customize Workspace</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-[var(--v2-text)]">Current: {theme.name}</p>
            <p className="mt-0.5 text-[10px] text-[color-mix(in_oklab,var(--v2-accent)_75%,var(--v2-muted))]">{immersion.statusLine}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-lg border border-[var(--v2-border)] bg-[var(--v2-panel)] px-2.5 py-1 text-[11px] text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)] hover:text-[var(--v2-text)] active:scale-[0.98]"
          >
            Change Theme
          </button>
        </div>
      </div>

      {open ? (
        <div className="absolute bottom-[calc(100%+10px)] left-0 z-50 w-[280px] rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-2 shadow-xl">
          {themes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id !== themeId) {
                  recordThemeSwitch(themeId, item.id);
                  recordThemeSelected(item.id);
                }
                setThemeId(item.id);
                setToast("Theme updated ✨");
              }}
              className={`mb-1 flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition active:scale-[0.99] ${
                themeId === item.id
                  ? "border-[var(--v2-focus)] bg-[var(--v2-elevated)]"
                  : "border-transparent hover:border-[var(--v2-border)] hover:bg-[var(--v2-elevated)]"
              }`}
            >
              <span>
                <span className="block text-xs font-medium text-[var(--v2-text)]">{item.name}</span>
                <span className="block text-[10px] text-[var(--v2-muted)]">{item.subtitle}</span>
              </span>
              <span className="flex items-center gap-1.5">
                {item.preview.map((hex) => (
                  <span
                    key={`${item.id}-${hex}`}
                    className="h-2.5 w-2.5 rounded-full border border-black/20"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {toast ? (
        <p className="mt-2 text-[11px] text-[var(--v2-muted)]">{toast}</p>
      ) : null}

      <details
        className="mt-3 border-t border-[var(--v2-border)] pt-2"
        onToggle={(e) => {
          if (e.currentTarget.open) setStats(getAnalyticsSummary());
        }}
      >
        <summary className="cursor-pointer text-[10px] uppercase tracking-[0.12em] text-[var(--v2-muted)]">Internal analytics · this device</summary>
        <div className="mt-2 space-y-2 text-[10px] text-[var(--v2-muted)]">
          <p>
            <span className="text-[var(--v2-text)]">Most selected:</span>{" "}
            {stats.mostSelectedThemeId ? getThemeById(stats.mostSelectedThemeId).name : "—"} ({stats.mostSelectedCount})
          </p>
          <p>
            <span className="text-[var(--v2-text)]">Most retained (time):</span>{" "}
            {stats.mostRetainedThemeId ? getThemeById(stats.mostRetainedThemeId).name : "—"} ({stats.mostRetainedMinutes}m)
          </p>
          <p>
            <span className="text-[var(--v2-text)]">Theme switches:</span> {stats.totalThemeSwitches} total · {stats.themeSwitchesLast30d} last 30d
          </p>
          <div>
            <p className="text-[var(--v2-text)]">Top pages per theme</p>
            <ul className="mt-1 max-h-28 space-y-1 overflow-y-auto pl-2">
              {Object.keys(stats.topPagesByTheme).length === 0 ? (
                <li className="text-[var(--v2-muted)]">No route samples yet.</li>
              ) : (
                Object.entries(stats.topPagesByTheme).map(([tid, rows]) => (
                  <li key={tid} className="list-none">
                    <span className="font-medium text-[var(--v2-text)]">{getThemeById(tid).name}</span>
                    <span className="text-[var(--v2-muted)]">
                      {" "}
                      —{" "}
                      {rows.map((r) => `${r.path} (${r.count})`).join(", ")}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}
