"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";

function formatInline(text) {
  const line = String(text);
  const out = [];
  let rest = line;
  let i = 0;
  while (rest.length && i < 80) {
    i += 1;
    const bold = rest.match(/\*\*(.+?)\*\*/);
    const code = rest.match(/`([^`]+)`/);
    if (bold && (!code || bold.index <= code.index)) {
      if (bold.index > 0) out.push({ t: "text", v: rest.slice(0, bold.index) });
      out.push({ t: "bold", v: bold[1] });
      rest = rest.slice(bold.index + bold[0].length);
    } else if (code) {
      if (code.index > 0) out.push({ t: "text", v: rest.slice(0, code.index) });
      out.push({ t: "code", v: code[1] });
      rest = rest.slice(code.index + code[0].length);
    } else {
      out.push({ t: "text", v: rest });
      break;
    }
  }
  return out.map((p, j) => {
    if (p.t === "bold") return <strong key={j} className="font-semibold text-white">{p.v}</strong>;
    if (p.t === "code") return <code key={j} className="rounded bg-white/[0.1] px-1 py-0.5 font-mono text-[11px]">{p.v}</code>;
    return <span key={j}>{p.v}</span>;
  });
}

const MessageBubble = memo(function MessageBubble({ message, onRetry, onUndo }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      style={{ willChange: "transform, opacity" }}
    >
      <div
        className={`max-w-[92%] rounded-2xl border px-3 py-2.5 text-[12px] leading-relaxed ${
          isUser
            ? "border-sky-500/30 bg-sky-500/15 text-sky-50"
            : "border-white/[0.08] bg-white/[0.05] text-slate-100"
        }`}
      >
        <div className="space-y-1">
          {String(message.content || "")
            .split("\n")
            .map((ln, idx) => (
              <p key={idx} className="whitespace-pre-wrap break-words">
                {formatInline(ln)}
              </p>
            ))}
        </div>
        {message.cards?.length ? (
          <div className="mt-2 space-y-2">
            {message.cards.map((c, idx) => (
              <div key={idx} className="rounded-xl border border-white/[0.08] bg-black/20 p-2.5">
                <p className="text-[11px] font-semibold text-white">{c.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-[11px] text-slate-400">{c.body}</p>
                {c.cta?.href ? (
                  <Link href={c.cta.href} className="mt-2 inline-block text-[11px] font-medium text-sky-300 underline">
                    {c.cta.label}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {!isUser && message.showActions ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText?.(message.content || "")}
              className="rounded-lg border border-white/[0.1] px-2 py-0.5 text-[10px] text-slate-400 hover:bg-white/[0.06]"
            >
              Copy
            </button>
            {message.retryPrompt && message.showRetry ? (
              <button
                type="button"
                onClick={() => onRetry?.(message.retryPrompt)}
                className="rounded-lg border border-white/[0.1] px-2 py-0.5 text-[10px] text-slate-400 hover:bg-white/[0.06]"
              >
                Retry
              </button>
            ) : null}
            {message.undoTo ? (
              <button
                type="button"
                onClick={() => onUndo?.(message.undoTo)}
                className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-100 hover:bg-amber-500/15"
              >
                Undo
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
});

export const CopilotChat = memo(function CopilotChat({ messages, onRetry, onUndo }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  const rows = useMemo(() => messages, [messages]);

  return (
    <div ref={ref} className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3 py-3">
      {rows.map((m) => (
        <MessageBubble
          key={m.id}
          message={{
            ...m,
            showActions: m.role === "assistant",
            showRetry: !m.blocked,
            retryPrompt: m.retryPrompt,
            undoTo: m.undoTo,
          }}
          onRetry={onRetry}
          onUndo={onUndo}
        />
      ))}
    </div>
  );
});
