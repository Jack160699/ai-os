const KEY = "stratxcel-copilot-logs";
const MAX = 500;

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
    window.localStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function appendCopilotLog(entry) {
  const rows = read();
  rows.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: new Date().toISOString(),
    ...entry,
  });
  write(rows);
}

export function getCopilotLogs() {
  return read();
}

export function clearCopilotLogs() {
  write([]);
}
