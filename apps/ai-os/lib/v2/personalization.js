"use client";

const PROFILE_KEY = "v2_personal_profile";
const WIDGETS_KEY = "v2_personal_widgets";
const NOTES_KEY = "v2_personal_notes";
const STREAK_KEY = "v2_personal_streak";

const ALL_WIDGETS = [
  "my_tasks",
  "my_revenue",
  "my_leads",
  "pending_chats",
  "calendar",
  "recent_clients",
  "team_rank",
  "daily_goals",
];

export const STATUS_OPTIONS = [
  { id: "focused", label: "Focused", emoji: "🧠" },
  { id: "busy", label: "Busy", emoji: "📞" },
  { id: "available", label: "Available", emoji: "✅" },
  { id: "deep_work", label: "Deep Work", emoji: "⚡" },
  { id: "low_energy", label: "Low Energy", emoji: "☕" },
  { id: "on_calls", label: "On Calls", emoji: "☎️" },
];

function keyFor(base, userKey) {
  return `${base}:${String(userKey || "anonymous")}`;
}

function readJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function defaultWidgetsForRole(role) {
  const r = String(role || "").toLowerCase();
  if (r === "manager") return ["team_rank", "pending_chats", "my_revenue", "daily_goals", "calendar"];
  if (r === "finance") return ["my_revenue", "recent_clients", "daily_goals", "calendar"];
  if (r === "support") return ["pending_chats", "my_tasks", "daily_goals", "recent_clients"];
  return ["my_leads", "pending_chats", "my_revenue", "my_tasks", "daily_goals", "calendar"];
}

export function loadWidgets(userKey, role) {
  const saved = readJSON(keyFor(WIDGETS_KEY, userKey), null);
  if (!saved || !Array.isArray(saved.order)) {
    return { order: defaultWidgetsForRole(role), enabled: defaultWidgetsForRole(role) };
  }
  const order = saved.order.filter((id) => ALL_WIDGETS.includes(id));
  const enabled = (saved.enabled || []).filter((id) => ALL_WIDGETS.includes(id));
  return {
    order: order.length ? order : defaultWidgetsForRole(role),
    enabled: enabled.length ? enabled : defaultWidgetsForRole(role),
  };
}

export function saveWidgets(userKey, widgets) {
  writeJSON(keyFor(WIDGETS_KEY, userKey), widgets);
}

export function loadPrivateNotes(userKey) {
  return readJSON(keyFor(NOTES_KEY, userKey), "");
}

export function savePrivateNotes(userKey, value) {
  writeJSON(keyFor(NOTES_KEY, userKey), String(value || ""));
}

export function loadProfile(userKey, defaults) {
  const saved = readJSON(keyFor(PROFILE_KEY, userKey), {});
  const initialName = String(defaults?.name || "User");
  return {
    fullName: saved.fullName || initialName,
    avatar: saved.avatar || initialName.slice(0, 1).toUpperCase(),
    tagline: saved.tagline || "Focused Today",
    statusId: saved.statusId || "focused",
  };
}

export function saveProfile(userKey, profile) {
  writeJSON(keyFor(PROFILE_KEY, userKey), profile);
}

export function trackDailyStreak(userKey) {
  const key = keyFor(STREAK_KEY, userKey);
  const current = readJSON(key, { lastDay: null, streak: 0 });
  const today = todayKey();
  if (current.lastDay === today) return current.streak || 1;

  let streak = 1;
  if (current.lastDay) {
    const prev = new Date(current.lastDay);
    const now = new Date(today);
    const diff = Math.round((now - prev) / 86400000);
    streak = diff === 1 ? (current.streak || 0) + 1 : 1;
  }
  writeJSON(key, { lastDay: today, streak });
  return streak;
}

export function getRoleHomeConfig(role) {
  const r = String(role || "").toLowerCase();
  if (r === "manager") {
    return {
      line2: "Team performance, escalations, and revenue are in your control.",
      spotlight: ["Team Performance", "Escalations", "Revenue Summary"],
    };
  }
  if (r === "finance") {
    return {
      line2: "Collections pipeline and pending settlements are your priority lane.",
      spotlight: ["Collections", "Pending Settlements", "Payout Signals"],
    };
  }
  if (r === "support") {
    return {
      line2: "Inbox, SLA coverage, and open issues drive today.",
      spotlight: ["Pending Chats", "Response SLA", "Open Issues"],
    };
  }
  return {
    line2: "Leads, chats, follow-ups, and collections need execution.",
    spotlight: ["Hot Leads", "Pending Chats", "Follow-up Tasks"],
  };
}

export function allWidgetIds() {
  return ALL_WIDGETS.slice();
}
