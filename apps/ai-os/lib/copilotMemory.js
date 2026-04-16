const KEY = "stratxcel-copilot-memory";
const MAX_COMMANDS = 40;

function read() {
  if (typeof window === "undefined") return { commandChain: [], notes: "" };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { commandChain: [], notes: "" };
    return JSON.parse(raw);
  } catch {
    return { commandChain: [], notes: "" };
  }
}

function write(data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function appendCommandMemory(entry) {
  const data = read();
  const chain = Array.isArray(data.commandChain) ? data.commandChain : [];
  chain.unshift({ ...entry, at: entry.at || new Date().toISOString() });
  write({ ...data, commandChain: chain.slice(0, MAX_COMMANDS) });
}

export function getCommandChain() {
  return read().commandChain || [];
}

export function setAINotes(text) {
  const data = read();
  write({ ...data, notes: String(text || "") });
}

export function getAINotes() {
  return read().notes || "";
}
