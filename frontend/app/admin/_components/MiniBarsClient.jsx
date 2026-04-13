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
    <div className="admin-card-surface rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5 transition-[border-color,background-color] duration-200 hover:border-white/[0.11] hover:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold tracking-tight text-white">{title}</p>
        <span className="hidden text-[11px] font-medium text-slate-500 sm:inline">Volume</span>
      </div>
      {list.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={emptyHint} description={emptyDescription} className="py-8" />
        </div>
      ) : (
        <div className="relative mt-5 overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent px-1.5 pb-1 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(255,255,255,0.055) 23px)",
            }}
            aria-hidden
          />
          <div className="relative flex h-44 items-end gap-2 sm:gap-2.5">
            {list.map((point, i) => {
              const h = Math.max(12, ((Number(point.count) || 0) / max) * 100);
              return (
                <div key={String(point.date)} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <motion.div
                      className="relative w-full overflow-hidden rounded-t-[7px] shadow-[0_12px_32px_rgba(0,0,0,0.42)]"
                      initial={reduce ? undefined : { height: "14%", opacity: 0.55 }}
                      animate={{ height: `${h}%`, opacity: 1 }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 430, damping: 33, delay: i * 0.028 }
                      }
                      whileHover={
                        reduce
                          ? undefined
                          : {
                              y: -3,
                              boxShadow: "0 16px 44px rgba(0,0,0,0.5), 0 0 28px rgba(56,189,248,0.12)",
                              transition: { type: "spring", stiffness: 520, damping: 26 },
                            }
                      }
                      style={{
                        background: `linear-gradient(to top, ${from} 0%, ${to} 68%, rgba(255,255,255,0.2) 100%)`,
                      }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent opacity-80"
                        aria-hidden
                      />
                    </motion.div>
                  </div>
                  <span className="text-[11px] tabular-nums text-slate-500">{point.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
