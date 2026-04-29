"use client";

import { useEffect, useMemo, useState } from "react";

export function AchievementToast({ items = [] }) {
  const queue = useMemo(() => items.filter(Boolean), [items]);
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    if (!queue.length) return;
    setIndex(0);
  }, [queue]);

  useEffect(() => {
    if (index < 0 || index >= queue.length) return;
    const id = setTimeout(() => setIndex((prev) => prev + 1), 2800);
    return () => clearTimeout(id);
  }, [index, queue.length]);

  if (index < 0 || index >= queue.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[70] max-w-xs rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs text-[var(--v2-text)] shadow-xl">
      <p className="font-medium">Achievement unlocked</p>
      <p className="mt-0.5 text-[var(--v2-muted)]">{queue[index]}</p>
    </div>
  );
}
