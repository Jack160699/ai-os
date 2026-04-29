/**
 * Anonymous, device-local theme usage metrics (localStorage only).
 * No user ids, no network — internal product sense only.
 */

export const THEME_ANALYTICS_KEY = "v2_theme_analytics";
const VERSION = 1;
const MAX_SWITCHES = 120;

function emptyDoc() {
  return {
    v: VERSION,
    selectionCount: {},
    activeMs: {},
    switchCount: 0,
    switches: [],
    pageHits: {},
    updatedAt: Date.now(),
  };
}

function readDoc() {
  if (typeof window === "undefined") return emptyDoc();
  try {
    const raw = window.localStorage.getItem(THEME_ANALYTICS_KEY);
    if (!raw) return emptyDoc();
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object" || o.v !== VERSION) return emptyDoc();
    return {
      ...emptyDoc(),
      ...o,
      selectionCount: typeof o.selectionCount === "object" && o.selectionCount ? o.selectionCount : {},
      activeMs: typeof o.activeMs === "object" && o.activeMs ? o.activeMs : {},
      switches: Array.isArray(o.switches) ? o.switches : [],
      pageHits: typeof o.pageHits === "object" && o.pageHits ? o.pageHits : {},
    };
  } catch {
    return emptyDoc();
  }
}

function persist(doc) {
  if (typeof window === "undefined") return;
  doc.updatedAt = Date.now();
  try {
    window.localStorage.setItem(THEME_ANALYTICS_KEY, JSON.stringify(doc));
  } catch {
    // quota / private mode — ignore
  }
}

function topEntry(counts) {
  let bestId = null;
  let best = -1;
  for (const [id, n] of Object.entries(counts || {})) {
    const v = Number(n) || 0;
    if (v > best) {
      best = v;
      bestId = id;
    }
  }
  return bestId !== null ? { id: bestId, value: best } : { id: null, value: 0 };
}

export function normalizePath(pathname) {
  if (!pathname || typeof pathname !== "string") return "";
  const p = pathname.split("?")[0].trim();
  return p || "/";
}

/** User picked a theme in Theme Studio (destination). */
export function recordThemeSelected(themeId) {
  if (!themeId) return;
  const d = readDoc();
  d.selectionCount[themeId] = (d.selectionCount[themeId] || 0) + 1;
  persist(d);
}

/** User switched from one theme to another (frequency). */
export function recordThemeSwitch(fromThemeId, toThemeId) {
  if (!toThemeId || fromThemeId === toThemeId) return;
  const d = readDoc();
  d.switchCount += 1;
  d.switches.push({ at: Date.now(), from: fromThemeId, to: toThemeId });
  if (d.switches.length > MAX_SWITCHES) d.switches = d.switches.slice(-MAX_SWITCHES);
  persist(d);
}

export function addActiveMs(themeId, ms) {
  if (!themeId || !ms || ms < 1) return;
  const d = readDoc();
  d.activeMs[themeId] = (d.activeMs[themeId] || 0) + Math.round(ms);
  persist(d);
}

export function recordPageView(themeId, pathname) {
  const path = normalizePath(pathname);
  if (!themeId || !path) return;
  const d = readDoc();
  if (!d.pageHits[themeId]) d.pageHits[themeId] = {};
  d.pageHits[themeId][path] = (d.pageHits[themeId][path] || 0) + 1;
  persist(d);
}

const MS_DAY = 86400000;

export function getAnalyticsSummary() {
  const d = readDoc();
  const selected = topEntry(d.selectionCount);
  const retained = topEntry(d.activeMs);
  const now = Date.now();
  const switches30d = d.switches.filter((s) => s && typeof s.at === "number" && now - s.at < 30 * MS_DAY).length;
  const topPagesByTheme = {};
  for (const tid of Object.keys(d.pageHits)) {
    const paths = d.pageHits[tid];
    topPagesByTheme[tid] = Object.entries(paths)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([path, count]) => ({ path, count }));
  }
  return {
    mostSelectedThemeId: selected.id,
    mostSelectedCount: selected.value,
    mostRetainedThemeId: retained.id,
    mostRetainedMinutes: retained.value ? Math.round(retained.value / 60000) : 0,
    totalThemeSwitches: d.switchCount,
    themeSwitchesLast30d: switches30d,
    topPagesByTheme,
  };
}
