"use client";

import { useCallback, useEffect, useState } from "react";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/v2/notifications", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
    setUnread(Number(data?.unread || 0));
  }, []);

  useEffect(() => {
    const first = setTimeout(() => refresh(), 0);
    const id = setInterval(refresh, 12000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh]);

  async function markAllRead() {
    await fetch("/api/v2/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    await refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl border border-black/10 bg-black/3 px-3 py-2 text-xs font-medium text-[var(--v2-muted)] transition hover:bg-black/6 dark:border-white/15 dark:bg-white/5"
      >
        Notifications {unread > 0 ? `(${unread})` : ""}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-black/10 bg-[var(--v2-surface)] p-2 shadow-xl dark:border-white/15">
          <div className="mb-2 flex items-center justify-between px-2 py-1">
            <p className="text-xs font-semibold">Recent updates</p>
            <button type="button" onClick={markAllRead} className="text-[11px] text-[#60a5fa]">
              Mark all read
            </button>
          </div>
          <div className="max-h-80 space-y-1 overflow-auto">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-lg border border-black/8 p-2 text-xs dark:border-white/10">
                <p className="font-medium">{item.title}</p>
                {item.body ? <p className="mt-1 text-[var(--v2-muted)]">{item.body}</p> : null}
              </div>
            ))}
            {notifications.length === 0 ? (
              <p className="rounded-lg border border-dashed border-black/15 p-3 text-xs text-[var(--v2-muted)] dark:border-white/15">
                No notifications yet.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
