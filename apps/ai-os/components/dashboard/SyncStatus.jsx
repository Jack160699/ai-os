"use client";

import { useEffect, useMemo, useState } from "react";

function labelFromMinutes(mins) {
  if (mins <= 0) return "just now";
  if (mins === 1) return "1 min ago";
  return `${mins} mins ago`;
}

export function SyncStatus({ syncedAt }) {
  const base = useMemo(() => {
    const ts = Date.parse(String(syncedAt || ""));
    return new Date(Number.isFinite(ts) ? ts : 0);
  }, [syncedAt]);
  const [now, setNow] = useState(base.getTime());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.max(0, Math.floor((now - base.getTime()) / 60000));
  return (
    <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
      Live · Last synced {labelFromMinutes(mins)}
    </p>
  );
}

