const levelOrder = { error: 0, warn: 1, info: 2, debug: 3 };

function currentLevel() {
  const l = (process.env.LOG_LEVEL || "info").toLowerCase();
  return levelOrder[l] !== undefined ? levelOrder[l] : levelOrder.info;
}

function emit(level, msg, meta = {}) {
  if (levelOrder[level] > currentLevel()) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    service: "whatsapp-ai-system",
    ...meta,
  };
  const out = JSON.stringify(line);
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export const log = {
  error: (msg, meta) => emit("error", msg, meta),
  warn: (msg, meta) => emit("warn", msg, meta),
  info: (msg, meta) => emit("info", msg, meta),
  debug: (msg, meta) => emit("debug", msg, meta),
};
