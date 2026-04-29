"use client";

import { useEffect, useState } from "react";
import { listThemes } from "@/lib/v2/themes";
import { useThemeStudio } from "@/components/v2/theme-provider";

export function ThemeStudio() {
  const { themeId, theme, setThemeId } = useThemeStudio();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
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
          <p className="text-xs font-medium text-[var(--v2-text)]">Current: {theme.name}</p>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-lg border border-[var(--v2-border)] bg-[var(--v2-panel)] px-2.5 py-1 text-[11px] text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)] hover:text-[var(--v2-text)]"
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
                setThemeId(item.id);
                setToast("Theme updated ✨");
              }}
              className={`mb-1 flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition ${
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
    </div>
  );
}
