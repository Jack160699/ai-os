"use client";

import { motion, useReducedMotion } from "framer-motion";

export function SurfaceCard({ children, className = "", delay = 0, hover = true }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1], delay }}
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.022] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${
        hover ? "transition-[border-color,background-color,box-shadow] duration-200 hover:border-white/[0.11] hover:bg-white/[0.035] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]" : ""
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
