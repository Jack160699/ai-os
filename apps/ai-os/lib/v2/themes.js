export const DEFAULT_THEME_ID = "professional";
export const THEME_STORAGE_KEY = "v2_theme_preference";

export const V2_THEMES = {
  professional: {
    id: "professional",
    name: "Professional",
    subtitle: "Vercel-inspired clarity",
    preview: ["#000000", "#111111", "#ffffff"],
    vars: {
      "--v2-bg": "#000000",
      "--v2-panel": "#0a0a0a",
      "--v2-elevated": "#111111",
      "--v2-border": "#1a1a1a",
      "--v2-text": "#ffffff",
      "--v2-muted": "#8a8a8a",
      "--v2-focus": "#2f2f2f",
      "--v2-accent": "#ffffff",
      "--v2-font-main": "Inter, Geist, ui-sans-serif, system-ui, sans-serif",
    },
    copy: {
      quickAdd: "Create Report",
      status: "System Stable",
      title: "Professional",
    },
  },
  genz: {
    id: "genz",
    name: "Gen Z",
    subtitle: "Trendy and energetic",
    preview: ["#050505", "#8b5cf6", "#22d3ee"],
    vars: {
      "--v2-bg": "#030303",
      "--v2-panel": "#101019",
      "--v2-elevated": "#151527",
      "--v2-border": "#2b2b44",
      "--v2-text": "#f8fafc",
      "--v2-muted": "#9ca3af",
      "--v2-focus": "#8b5cf6",
      "--v2-accent": "#22d3ee",
      "--v2-font-main": "'Space Grotesk', Inter, ui-sans-serif, system-ui, sans-serif",
    },
    copy: {
      quickAdd: "Let's Go",
      status: "Big Moves Today",
      title: "Gen Z",
    },
  },
  girly: {
    id: "girly",
    name: "Girly",
    subtitle: "Elegant soft premium",
    preview: ["#120d14", "#f9a8d4", "#f5f3ff"],
    vars: {
      "--v2-bg": "#0d0a11",
      "--v2-panel": "#1b1220",
      "--v2-elevated": "#271831",
      "--v2-border": "#3c2648",
      "--v2-text": "#fdf2f8",
      "--v2-muted": "#d8b4d6",
      "--v2-focus": "#f9a8d4",
      "--v2-accent": "#f9a8d4",
      "--v2-font-main": "Poppins, Nunito, Inter, ui-sans-serif, system-ui, sans-serif",
    },
    copy: {
      quickAdd: "Hey bestie",
      status: "Payments Slaying",
      title: "Girly",
    },
  },
  aesthetic: {
    id: "aesthetic",
    name: "Aesthetic",
    subtitle: "Calm creator mood",
    preview: ["#1f1a16", "#d6c4a8", "#f8f4ec"],
    vars: {
      "--v2-bg": "#171310",
      "--v2-panel": "#221c17",
      "--v2-elevated": "#2c241e",
      "--v2-border": "#3a3028",
      "--v2-text": "#f8f4ec",
      "--v2-muted": "#c0b1a0",
      "--v2-focus": "#d6c4a8",
      "--v2-accent": "#d6c4a8",
      "--v2-font-main": "'DM Sans', Inter, ui-sans-serif, system-ui, sans-serif",
    },
    copy: {
      quickAdd: "Flow State",
      status: "Quiet Productivity",
      title: "Aesthetic",
    },
  },
  executive: {
    id: "executive",
    name: "Executive",
    subtitle: "Boardroom confidence",
    preview: ["#060606", "#a08a5a", "#f7f0dc"],
    vars: {
      "--v2-bg": "#060606",
      "--v2-panel": "#111111",
      "--v2-elevated": "#171717",
      "--v2-border": "#2b2618",
      "--v2-text": "#f7f0dc",
      "--v2-muted": "#b7a57f",
      "--v2-focus": "#a08a5a",
      "--v2-accent": "#a08a5a",
      "--v2-font-main": "'IBM Plex Sans', 'Inter Tight', Inter, ui-sans-serif, system-ui, sans-serif",
    },
    copy: {
      quickAdd: "Revenue Overview",
      status: "Operational Signals",
      title: "Executive",
    },
  },
  hacker: {
    id: "hacker",
    name: "Hacker",
    subtitle: "Terminal operations",
    preview: ["#020202", "#22c55e", "#d1fae5"],
    vars: {
      "--v2-bg": "#020202",
      "--v2-panel": "#09110a",
      "--v2-elevated": "#0d180f",
      "--v2-border": "#1f3a26",
      "--v2-text": "#d1fae5",
      "--v2-muted": "#86efac",
      "--v2-focus": "#22c55e",
      "--v2-accent": "#22c55e",
      "--v2-font-main": "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    copy: {
      quickAdd: "Deploy Ready",
      status: "System Online",
      title: "Hacker",
    },
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    subtitle: "Notion-like cleanliness",
    preview: ["#ffffff", "#f5f5f5", "#111111"],
    vars: {
      "--v2-bg": "#ffffff",
      "--v2-panel": "#fafafa",
      "--v2-elevated": "#f5f5f5",
      "--v2-border": "#e5e5e5",
      "--v2-text": "#111111",
      "--v2-muted": "#666666",
      "--v2-focus": "#cfcfcf",
      "--v2-accent": "#111111",
      "--v2-font-main": "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    copy: {
      quickAdd: "Dashboard",
      status: "Clean Focus",
      title: "Minimal",
    },
  },
};

export function listThemes() {
  return Object.values(V2_THEMES);
}

export function getThemeById(themeId) {
  return V2_THEMES[themeId] || V2_THEMES[DEFAULT_THEME_ID];
}
