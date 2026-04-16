const KEY = "stratxcel-ai-action-queue";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(rows) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 120)));
  } catch {
    /* ignore */
  }
}

export function getActionQueue() {
  return read();
}

export function enqueueAiAction(entry) {
  const rows = read();
  rows.unshift({
    id: `q-${Date.now()}`,
    at: new Date().toISOString(),
    ...entry,
  });
  write(rows);
}

export function clearActionQueue() {
  write([]);
}
