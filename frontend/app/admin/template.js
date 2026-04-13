"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AdminTemplate({ children }) {
  const pathname = usePathname() ?? "";
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? undefined : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
