"use client";

import { motion, useReducedMotion } from "framer-motion";

export function SurfaceCard({ children, className = "", delay = 0, hover = true }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={reduce || !hover ? undefined : { y: -1 }}
      className={`admin-card-surface rounded-2xl border border-white/[0.07] bg-white/[0.022] transition-[border-color,background-color] duration-200 ${
        hover ? "hover:border-white/[0.11] hover:bg-white/[0.032]" : ""
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
