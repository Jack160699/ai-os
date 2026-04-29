"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_THEME_ID, getThemeById, THEME_STORAGE_KEY } from "@/lib/v2/themes";

const ThemeStudioContext = createContext({
  themeId: DEFAULT_THEME_ID,
  theme: getThemeById(DEFAULT_THEME_ID),
  setThemeId: () => {},
});

function readStorage() {
  if (typeof window === "undefined") return { global: DEFAULT_THEME_ID, users: {} };
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return { global: DEFAULT_THEME_ID, users: {} };
    const parsed = JSON.parse(raw);
    return {
      global: typeof parsed?.global === "string" ? parsed.global : DEFAULT_THEME_ID,
      users: typeof parsed?.users === "object" && parsed?.users ? parsed.users : {},
    };
  } catch {
    return { global: DEFAULT_THEME_ID, users: {} };
  }
}

function writeStorage(next) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
}

function applyThemeVars(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  Object.entries(theme.vars || {}).forEach(([key, value]) => {
    root.style.setProperty(key, String(value));
  });
  root.dataset.v2Personality = theme.id;
}

export function ThemeProvider({ userKey = "", children }) {
  const [themeId, setThemeIdState] = useState(DEFAULT_THEME_ID);

  useEffect(() => {
    const storage = readStorage();
    const resolved = userKey && storage.users[userKey] ? storage.users[userKey] : storage.global;
    setThemeIdState(resolved || DEFAULT_THEME_ID);
  }, [userKey]);

  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  useEffect(() => {
    applyThemeVars(theme);
  }, [theme]);

  const setThemeId = (nextThemeId) => {
    const normalized = getThemeById(nextThemeId).id;
    setThemeIdState(normalized);
    const storage = readStorage();
    const next = {
      ...storage,
      global: normalized,
      users: {
        ...(storage.users || {}),
        ...(userKey ? { [userKey]: normalized } : {}),
      },
    };
    writeStorage(next);
  };

  return (
    <ThemeStudioContext.Provider value={{ themeId, theme, setThemeId }}>
      {children}
    </ThemeStudioContext.Provider>
  );
}

export function useThemeStudio() {
  return useContext(ThemeStudioContext);
}
