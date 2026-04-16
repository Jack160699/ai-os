"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EmptyState } from "@/app/admin/_components/EmptyState";

/**
 * @param {{ id: string, title: string, subtitle?: string, badge?: string }[]} items
 */
export function StaggerFeed({ items, emptyTitle, emptyDescription }) {
  const reduce = useReducedMotion();
  const list = Array.isArray(items) ? items : [];

  if (list.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} className="py-9" />;
  }

  return (
    <ul className="mt-4 space-y-2" role="list">
      {list.map((it, i) => (
        <motion.li
          key={it.id}
          role="listitem"
          initial={reduce ? undefined : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.2, delay: i * 0.035, ease: [0.22, 1, 0.36, 1] }}
          whileHover={reduce ? undefined : { y: -1 }}
          whileTap={reduce ? undefined : { scale: 0.997 }}
          className="admin-feed-row cursor-default rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-sm shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] outline-none"
        >
          <span className="font-medium text-slate-100">{it.title}</span>
          {it.subtitle ? <span className="text-slate-500"> · {it.subtitle}</span> : null}
          {it.badge ? (
            <span className="ml-2 inline-flex align-middle rounded-full border border-white/[0.08] bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-slate-300">
              {it.badge}
            </span>
          ) : null}
        </motion.li>
      ))}
    </ul>
  );
}
