"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const COMMANDS = [
  { id: "hot-leads", label: "Show hot leads", href: "/admin/chats?segment=hot", response: "Opening hot leads queue from inbox." },
  { id: "drop", label: "Why conversions dropped?", href: "/admin/analytics?focus=conversion", response: "Likely due to slower follow-up cadence in high-intent threads." },
  { id: "campaign", label: "Create campaign", href: "/admin/automation?preset=campaign", response: "Routing to automation with a campaign preset." },
  { id: "pending", label: "Show pending followups", href: "/admin/pipeline?filter=pending", response: "Opening pending follow-up opportunities in pipeline." },
  { id: "summary", label: "Summarize today performance", href: "/admin/analytics?focus=today", response: "Today looks stable: lead flow up, conversion slightly softer vs last week." },
];

export function GlobalAssistant() {
  const [open, setOpen] = useState(false);
  const [lastReply, setLastReply] = useState("Ask me anything about leads, conversion, and execution.");
  const router = useRouter();
  const commands = useMemo(() => COMMANDS, []);

  function runCommand(item) {
    setLastReply(item.response);
    router.push(item.href);
    setOpen(false);
  }

  return (
    <div className="fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 w-[min(92vw,360px)] rounded-2xl border border-white/[0.08] bg-[#0b1019]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur"
          >
            <p className="text-sm font-semibold tracking-tight text-white">StratXcel AI Assistant</p>
            <p className="mt-1 text-[12px] text-slate-400">{lastReply}</p>
            <div className="mt-3 space-y-2">
              {commands.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => runCommand(item)}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-left text-[12px] font-medium text-slate-200 transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-white/[0.06]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-sky-400/35 bg-gradient-to-r from-[#1e3a8a] to-[#0ea5e9] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_16px_48px_rgba(14,165,233,0.35)] transition-[transform,filter] duration-150 hover:-translate-y-0.5 hover:brightness-110"
      >
        Ask StratXcel AI
      </button>
    </div>
  );
}

