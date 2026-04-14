"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-2 sm:p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-white/[0.04]"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-xs text-slate-400">{open ? "Hide" : "Show"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-6 p-3 sm:space-y-7">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

