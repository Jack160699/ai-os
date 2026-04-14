const KEYS = {
  savedPrompts: "stratxcel-my-ai-saved-prompts",
  favorites: "stratxcel-my-ai-favorites",
  automations: "stratxcel-my-ai-automations",
};

function safeParse(raw, fallback) {
  try {
    const v = JSON.parse(raw || "");
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function getSavedPrompts() {
  if (typeof window === "undefined") return [];
  const arr = safeParse(window.localStorage.getItem(KEYS.savedPrompts), []);
  return Array.isArray(arr) ? arr : [];
}

export function addSavedPrompt(text) {
  if (typeof window === "undefined") return;
  const rows = getSavedPrompts();
  rows.unshift({ id: `sp-${Date.now()}`, text: String(text || "").trim(), at: new Date().toISOString() });
  window.localStorage.setItem(KEYS.savedPrompts, JSON.stringify(rows.slice(0, 80)));
}

export function removeSavedPrompt(id) {
  if (typeof window === "undefined") return;
  const rows = getSavedPrompts().filter((r) => r.id !== id);
  window.localStorage.setItem(KEYS.savedPrompts, JSON.stringify(rows));
}

export function getFavoriteWorkflows() {
  if (typeof window === "undefined") return [];
  const arr = safeParse(window.localStorage.getItem(KEYS.favorites), []);
  return Array.isArray(arr) ? arr : [];
}

export function toggleFavoriteWorkflow(name) {
  if (typeof window === "undefined") return;
  const n = String(name || "").trim();
  if (!n) return;
  const rows = getFavoriteWorkflows();
  const exists = rows.find((r) => r.name === n);
  if (exists) {
    window.localStorage.setItem(KEYS.favorites, JSON.stringify(rows.filter((r) => r.name !== n)));
  } else {
    rows.unshift({ id: `fv-${Date.now()}`, name: n, at: new Date().toISOString() });
    window.localStorage.setItem(KEYS.favorites, JSON.stringify(rows.slice(0, 40)));
  }
}

export function getPersonalAutomations() {
  if (typeof window === "undefined") return [];
  const arr = safeParse(window.localStorage.getItem(KEYS.automations), []);
  return Array.isArray(arr) ? arr : [];
}

export function addPersonalAutomation({ title, steps }) {
  if (typeof window === "undefined") return;
  const rows = getPersonalAutomations();
  rows.unshift({
    id: `pa-${Date.now()}`,
    title: String(title || "Untitled").trim(),
    steps: String(steps || "").trim(),
    at: new Date().toISOString(),
  });
  window.localStorage.setItem(KEYS.automations, JSON.stringify(rows.slice(0, 40)));
}
