export function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function formatFullTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function tempBadgeClass(t) {
  const k = String(t || "").toLowerCase();
  if (k === "hot") return "bg-rose-500/15 text-rose-200 ring-rose-400/25";
  if (k === "cold") return "bg-slate-500/15 text-slate-300 ring-slate-400/20";
  return "bg-amber-500/12 text-amber-100 ring-amber-400/20";
}
