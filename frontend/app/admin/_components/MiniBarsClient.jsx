"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EmptyState } from "@/app/admin/_components/EmptyState";

export function MiniBarsClient({
  title,
  points,
  emptyHint = "No data yet.",
  emptyDescription = "Once events flow in, this chart will populate automatically.",
  from = "#1e3a8a",
  to = "#45c4ff",
}) {
  const list = Array.isArray(points) ? points : [];
  const max = Math.max(1, ...list.map((d) => Number(d.count) || 0));
  const reduce = useReducedMotion();

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition-[border-color,background-color,box-shadow] duration-200 hover:border-white/[0.11] hover:bg-white/[0.035] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <p className="text-sm font-semibold tracking-tight text-white">{title}</p>
      {list.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={emptyHint} description={emptyDescription} className="py-8" />
        </div>
      ) : (
        <div className="mt-5 flex h-40 items-end gap-2 sm:gap-2.5">
          {list.map((point, i) => {
            const h = Math.max(10, ((Number(point.count) || 0) / max) * 100);
            return (
              <div key={String(point.date)} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <motion.div
                    className="w-full rounded-t-md"
                    initial={reduce ? undefined : { height: "12%", opacity: 0.55 }}
                    animate={{ height: `${h}%`, opacity: 1 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 32, delay: i * 0.03 }
                    }
                    style={{
                      background: `linear-gradient(to top, ${from}, ${to})`,
                    }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-slate-500">{point.date}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
