"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function OsTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-0 flex-1"
    >
      {children}
    </motion.div>
  );
}
