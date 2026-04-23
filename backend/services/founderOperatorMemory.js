/**
 * Lightweight in-memory founder context (per process). Not persisted across PM2 restarts.
 */

function normPhone(v) {
  return String(v || "").replace(/\D/g, "");
}

const store = new Map();
const MAX_CMD = 12;

function bucket() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function recordFounderCommand(phone, intent, meta = {}) {
  const k = normPhone(phone);
  if (!k || !intent) return;
  const now = Date.now();
  const cur = store.get(k) || {
    lastCommands: [],
    commandCounts: {},
    lastHotCount: null,
    lastMorningBriefAt: null,
    revenueThisWeek: 0,
    weekKey: "",
  };

  cur.lastCommands.unshift(String(intent));
  cur.lastCommands = cur.lastCommands.slice(0, MAX_CMD);
  cur.commandCounts[intent] = (cur.commandCounts[intent] || 0) + 1;

  const wk = bucket();
  if (cur.weekKey !== wk) {
    cur.weekKey = wk;
    cur.revenueThisWeek = 0;
  }
  if (intent === "revenue") cur.revenueThisWeek += 1;
  if (intent === "morning brief") cur.lastMorningBriefAt = now;
  if (meta.hotCount != null) cur.lastHotCount = Number(meta.hotCount) || 0;

  cur.lastAt = now;
  store.set(k, cur);
}

export function getFounderPersonalizationLines(phone, ctx = {}) {
  const k = normPhone(phone);
  const cur = store.get(k);
  if (!cur) return [];

  const lines = [];
  const last = cur.lastCommands[1];

  if (ctx.kind === "morning_brief") {
    const hot = Number(ctx.hotCountToday ?? cur.lastHotCount ?? 0);
    if (hot >= 2) {
      lines.push(`${hot} hot leads still open — worth clearing before you dive into anything else.`);
    } else if (hot === 1) {
      lines.push("One hot lead's still open — a short nudge before noon usually lands.");
    }
    if (cur.revenueThisWeek >= 2) {
      lines.push("You've checked revenue twice this week — want today's quick read?");
    }
    if (last && last !== "morning brief" && cur.lastCommands[0] === "morning brief") {
      // no-op
    }
  }

  if (ctx.kind === "operator" && last === "revenue" && cur.commandCounts.revenue >= 2) {
    lines.push("Revenue again — keeping it tight.");
  }

  return lines.slice(0, 2);
}
