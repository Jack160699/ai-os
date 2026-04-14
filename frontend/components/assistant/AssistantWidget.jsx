"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AssistantChat } from "@/components/assistant/AssistantChat";
import { AssistantInput } from "@/components/assistant/AssistantInput";
import { buildAssistantReply, getAssistantPageLabel } from "@/lib/assistantContext";

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: "init", role: "assistant", text: "Hi, I am StratXcel AI. Ask for insights, actions, or route me to the right panel." },
  ]);
  const pathname = usePathname() || "/admin";
  const pageLabel = getAssistantPageLabel(pathname);
  const shellRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!shellRef.current) return;
      if (!shellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function send(textOverride) {
    const text = String(textOverride ?? value).trim();
    if (!text) return;
    const userMessage = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setValue("");
    setTyping(true);
    window.setTimeout(() => {
      const reply = buildAssistantReply(text, pathname);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", text: reply.text, href: reply.href }]);
      setTyping(false);
    }, 520);
  }

  return (
    <div className="fixed bottom-6 right-6 z-[120] max-sm:bottom-4 max-sm:right-4" ref={shellRef}>
      <AnimatePresence>
        {open ? (
          <motion.section
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="admin-assistant-widget mb-3 flex h-[520px] w-[360px] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0b1019]/90 shadow-[0_28px_90px_rgba(0,0,0,0.5)] backdrop-blur md:max-w-[360px] max-sm:fixed max-sm:inset-2 max-sm:mb-0 max-sm:h-auto"
          >
            <header className="border-b border-white/[0.08] px-3.5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">StratXcel AI Assistant</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Helping with {pageLabel}
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-300 hover:bg-white/[0.07]">
                  Close
                </button>
              </div>
            </header>
            <AssistantChat messages={messages} typing={typing} onPrompt={send} onNavigate={() => setOpen(false)} />
            <AssistantInput value={value} onChange={setValue} onSend={() => send()} disabled={typing || !value.trim()} />
          </motion.section>
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

