"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ADMIN_THEME_DARK, ADMIN_THEME_KEY, ADMIN_THEME_LIGHT, normalizeTheme } from "@/lib/theme";

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.5v2.3M12 19.2v2.3M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.8 19.2l1.6-1.6M17.6 6.4l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 14.2a8 8 0 11-10.2-10A7 7 0 0020 14.2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return ADMIN_THEME_DARK;
    return normalizeTheme(window.localStorage.getItem(ADMIN_THEME_KEY) || document.documentElement.dataset.adminTheme);
  });

  useEffect(() => {
    document.documentElement.dataset.adminTheme = theme;
  }, [theme]);

  const isLight = theme === ADMIN_THEME_LIGHT;

  function toggleTheme() {
    const next = isLight ? ADMIN_THEME_DARK : ADMIN_THEME_LIGHT;
    setTheme(next);
    document.documentElement.dataset.adminTheme = next;
    window.localStorage.setItem(ADMIN_THEME_KEY, next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-[82px] items-center rounded-full border border-white/[0.1] bg-white/[0.04] px-1.5 text-[11px] font-semibold text-slate-200 transition-[border-color,background-color,color,box-shadow] duration-200 hover:border-white/[0.2] hover:bg-white/[0.08]"
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Light mode" : "Dark mode"}
    >
      <motion.span
        animate={{ x: isLight ? 38 : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="absolute left-1.5 top-1.5 h-6 w-10 rounded-full bg-gradient-to-r from-sky-500/90 to-indigo-500/90 shadow-[0_6px_20px_rgba(37,99,235,0.45)]"
      />
      <span className="relative z-10 flex w-full items-center justify-between px-1">
        <span className={`flex items-center gap-1 ${isLight ? "text-slate-400" : "text-white"}`}>
          <MoonIcon />
          <span>D</span>
        </span>
        <span className={`flex items-center gap-1 ${isLight ? "text-white" : "text-slate-400"}`}>
          <SunIcon />
          <span>L</span>
        </span>
      </span>
    </button>
  );
}

