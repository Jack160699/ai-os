"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";

export function SurfaceCard({ children, className = "", delay = 0, hover = true, href }) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const actionable = Boolean(href);
  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={reduce || !hover ? undefined : { y: -2 }}
      className={`admin-card-surface rounded-2xl border border-white/[0.07] bg-white/[0.022] transition-[border-color,background-color] duration-200 ${
        hover ? "hover:border-white/[0.11] hover:bg-white/[0.032]" : ""
      } ${actionable ? "cursor-pointer" : ""} ${className}`}
      role={actionable ? "button" : undefined}
      tabIndex={actionable ? 0 : undefined}
      onClick={actionable ? () => router.push(href) : undefined}
      onKeyDown={
        actionable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(href);
              }
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}
