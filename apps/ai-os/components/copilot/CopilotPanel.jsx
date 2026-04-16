"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { CopilotActions } from "@/components/copilot/CopilotActions";
import { CopilotChat } from "@/components/copilot/CopilotChat";
import { CopilotHeader } from "@/components/copilot/CopilotHeader";
import { CopilotInput } from "@/components/copilot/CopilotInput";
import { runCopilotCommand } from "@/lib/copilotEngine";
import { getCommandChain } from "@/lib/copilotMemory";
import { getCopilotContext } from "@/lib/copilotSuggestions";
import { getCustomCommands } from "@/lib/copilotCustomCommands";
import { getCurrentRole } from "@/lib/roles";

const PREFETCH_PATHS = [
  "/admin",
  "/admin/chats",
  "/admin/leads",
  "/admin/payments",
  "/admin/team",
  "/admin/analytics",
  "/admin/automation",
  "/admin/my-ai",
  "/admin/ai-control",
];

export function CopilotPanel() {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const role = getCurrentRole();
  const dragControls = useDragControls();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [memTick, setMemTick] = useState(0);
  const [customs, setCustoms] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I am **StratXcel Copilot**. I execute platform actions (mock), respect your role, and log every run. Try a suggested action or type a command.",
      blocked: false,
    },
  ]);

  const panelVisible = open && !minimized;

  useEffect(() => {
    const q = () => setNarrow(window.innerWidth < 640);
    q();
    window.addEventListener("resize", q);
    return () => window.removeEventListener("resize", q);
  }, []);

  useEffect(() => {
    queueMicrotask(() => setCustoms(getCustomCommands()));
  }, [open, pathname]);

  useEffect(() => {
    if (!open) return;
    PREFETCH_PATHS.forEach((p) => {
      try {
        router.prefetch(p);
      } catch {
        /* ignore */
      }
    });
  }, [open, router]);

  const memoryActive = (() => {
    void memTick;
    return getCommandChain().length > 0;
  })();

  const { sectionTitle, actions: baseActions } = useMemo(() => getCopilotContext(pathname), [pathname]);

  const actions = useMemo(() => {
    const extra = (customs || []).map((c, i) => ({
      id: `custom-${c.id || i}`,
      label: c.trigger,
      prompt: c.description || c.trigger,
    }));
    return [...baseActions, ...extra].slice(0, 12);
  }, [baseActions, customs]);

  const dispatch = useCallback(
    (text) => {
      const trimmed = String(text || "").trim();
      if (!trimmed || busy) return;
      const userMsg = { id: `u-${Date.now()}`, role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setBusy(true);
      const previousPath = pathname;
      window.setTimeout(() => {
        const result = runCopilotCommand(trimmed, { role, pathname, userLabel: "You", previousPath });
        const assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: result.reply || "",
          cards: result.cards,
          blocked: result.blocked,
          retryPrompt: trimmed,
          undoTo: result.undoTo,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (result.navigate) router.push(result.navigate);
        setMemTick((x) => x + 1);
        setBusy(false);
      }, 60);
    },
    [busy, pathname, role, router],
  );

  const onUndo = useCallback(
    (href) => {
      if (href) router.push(href);
    },
    [router],
  );

  const closeAll = useCallback(() => {
    setOpen(false);
    setMinimized(false);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAll]);

  const dockClass = expanded
    ? "w-[min(560px,100vw-32px)] max-w-[min(560px,calc(100vw-32px))]"
    : "w-[min(430px,100vw-32px)] max-w-[min(430px,calc(100vw-32px))]";

  return (
    <div className="admin-assistant-root">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {panelVisible ? (
            <motion.aside
              key="copilot-dock"
              layout
              drag={narrow ? "y" : false}
              dragControls={narrow ? dragControls : undefined}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.35 }}
              onDragEnd={(_, info) => {
                if (!narrow) return;
                if (info.offset.y > 90 || info.velocity.y > 600) setOpen(false);
              }}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`copilot-dock-panel fixed bottom-6 right-6 z-[9999] flex max-h-[82vh] flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#070a10]/95 shadow-[0_32px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl max-sm:bottom-0 max-sm:right-0 max-sm:top-0 max-sm:max-h-none max-sm:h-dvh max-sm:w-full max-sm:max-w-full max-sm:rounded-none ${dockClass}`}
              style={{ willChange: "transform, opacity" }}
            >
              {narrow ? (
                <button
                  type="button"
                  aria-label="Drag to close"
                  onPointerDown={(e) => dragControls.start(e)}
                  className="flex h-9 shrink-0 cursor-grab items-center justify-center border-b border-white/[0.06] bg-white/[0.03] active:cursor-grabbing"
                >
                  <span className="h-1 w-10 rounded-full bg-white/20" />
                </button>
              ) : null}
              <CopilotHeader
                pathname={pathname}
                role={role}
                memoryActive={memoryActive}
                minimized={minimized}
                expanded={expanded}
                onMinimize={() => setMinimized(true)}
                onExpand={() => setExpanded((v) => !v)}
                onClose={closeAll}
                onSettings={() => {}}
              />
              <CopilotActions sectionTitle={sectionTitle} actions={actions} onPick={dispatch} />
              <CopilotChat messages={messages} onRetry={dispatch} onUndo={onUndo} />
              <CopilotInput onSend={dispatch} disabled={busy} />
            </motion.aside>
          ) : null}
        </AnimatePresence>

        {!panelVisible ? (
          <motion.button
            type="button"
            layout
            onClick={() => {
              if (open && minimized) setMinimized(false);
              else setOpen(true);
            }}
            className="admin-button-glow fixed bottom-6 right-6 z-[9999] rounded-full border border-sky-400/35 bg-gradient-to-r from-[#1e3a8a] to-[#0ea5e9] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_16px_48px_rgba(14,165,233,0.35)] transition-all duration-200 ease-in-out hover:brightness-110 max-sm:bottom-4 max-sm:right-4"
            style={{ willChange: "transform", pointerEvents: "auto" }}
            aria-expanded={panelVisible}
          >
            {open && minimized ? "Restore Copilot" : "StratXcel Copilot"}
          </motion.button>
        ) : null}
      </div>
    </div>
  );
}
