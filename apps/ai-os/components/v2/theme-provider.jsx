"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { addActiveMs } from "@/lib/v2/theme-analytics";
import { DEFAULT_THEME_ID, getThemeById, THEME_STORAGE_KEY } from "@/lib/v2/themes";

const ThemeStudioContext = createContext({
  themeId: DEFAULT_THEME_ID,
  theme: getThemeById(DEFAULT_THEME_ID),
  immersion: getThemeById(DEFAULT_THEME_ID).immersion,
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
  const activeSegmentTheme = useRef(null);
  const activeSince = useRef(typeof performance !== "undefined" ? performance.now() : Date.now());

  useEffect(() => {
    const storage = readStorage();
    const resolved = userKey && storage.users[userKey] ? storage.users[userKey] : storage.global;
    setThemeIdState(resolved || DEFAULT_THEME_ID);
  }, [userKey]);

  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  useEffect(() => {
    applyThemeVars(theme);
  }, [theme]);

  /** Cumulative time on each theme (retention proxy) — flush on theme change, tab hide, unload, and periodic chunk. */
  useEffect(() => {
    const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

    const creditElapsed = (theme) => {
      const t = theme;
      const elapsed = now() - activeSince.current;
      if (t && elapsed > 50) addActiveMs(t, elapsed);
      activeSince.current = now();
    };

    const prev = activeSegmentTheme.current;
    creditElapsed(prev);
    activeSegmentTheme.current = themeId;

    const onHide = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        creditElapsed(activeSegmentTheme.current);
      }
    };
    const onUnload = () => {
      creditElapsed(activeSegmentTheme.current);
    };

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onUnload);

    const tick = window.setInterval(() => {
      const cur = activeSegmentTheme.current;
      const elapsed = now() - activeSince.current;
      if (cur && elapsed >= 120000) {
        addActiveMs(cur, elapsed);
        activeSince.current = now();
      }
    }, 120000);

    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onUnload);
      window.clearInterval(tick);
      creditElapsed(activeSegmentTheme.current);
    };
  }, [themeId]);

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

  const immersion = theme.immersion;

  return (
    <ThemeStudioContext.Provider value={{ themeId, theme, immersion, setThemeId }}>
      {children}
    </ThemeStudioContext.Provider>
  );
}

export function useThemeStudio() {
  return useContext(ThemeStudioContext);
}
