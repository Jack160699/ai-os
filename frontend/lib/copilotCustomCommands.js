const KEY = "stratxcel-custom-commands";

export function getCustomCommands() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCustomCommands(rows) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 80)));
  } catch {
    /* ignore */
  }
}

export function addCustomCommand({ trigger, description }) {
  const rows = getCustomCommands();
  rows.unshift({ id: `cmd-${Date.now()}`, trigger: String(trigger || "").trim(), description: String(description || "").trim() });
  saveCustomCommands(rows);
}
