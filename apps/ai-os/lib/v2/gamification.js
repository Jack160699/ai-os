"use client";

function toNumberLike(value) {
  const n = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function deriveGamification({ metrics = [], streak = 1, role = "support" }) {
  const byLabel = Object.fromEntries(metrics.map((m) => [String(m.label || "").toLowerCase(), toNumberLike(m.value)]));
  const chats = byLabel["chats today"] || 0;
  const pending = byLabel["pending tasks"] || 0;
  const due = byLabel["payments due"] || 0;
  const activeTeam = byLabel["active team members"] || 0;

  const roleMultiplier =
    role === "manager" ? 1.2 :
    role === "finance" ? 1.15 :
    role === "super_admin" ? 1.3 :
    1;

  const xp = Math.round((chats * 8 + Math.max(0, 5 - pending) * 14 + Math.max(0, 4 - due) * 18 + streak * 10 + activeTeam * 2) * roleMultiplier);
  const level = Math.max(1, Math.floor(xp / 120) + 1);
  const levelBase = (level - 1) * 120;
  const progress = Math.min(100, Math.round(((xp - levelBase) / 120) * 100));

  const badges = [];
  if (chats >= 10) badges.push("Fast Responder");
  if (pending === 0) badges.push("Zero Pending");
  if (due >= 5) badges.push("Collections Focus");
  if (streak >= 7) badges.push("Consistency");
  if (activeTeam >= 5) badges.push("Team Driver");
  if (badges.length === 0) badges.push("Top Performer");

  return { xp, level, progress, badges: badges.slice(0, 3) };
}

export function deriveAchievements({ metrics = [], streak = 1 }) {
  const byLabel = Object.fromEntries(metrics.map((m) => [String(m.label || "").toLowerCase(), toNumberLike(m.value)]));
  const chats = byLabel["chats today"] || 0;
  const pending = byLabel["pending tasks"] || 0;
  const due = byLabel["payments due"] || 0;

  const list = [];
  if (due > 0) list.push("First payment signal tracked");
  if (chats >= 10) list.push("10 chats cleared");
  if (pending === 0) list.push("Zero pending tasks");
  if (streak >= 7) list.push("Weekly streak unlocked");

  return list.slice(0, 4);
}
