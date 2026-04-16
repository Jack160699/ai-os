"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AdminTemplate({ children }) {
  const pathname = usePathname() ?? "";
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? undefined : { opacity: 0, y: 8, scale: 0.995, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={reduce ? { duration: 0 } : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
