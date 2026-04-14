"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ASSISTANT_QUICK_PROMPTS } from "@/lib/assistantContext";

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:240ms]" />
    </span>
  );
}

export function AssistantChat({ messages, typing, onPrompt, onNavigate }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages, typing]);

  return (
    <div ref={ref} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-[11px] text-slate-400">
        Quick prompts:
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ASSISTANT_QUICK_PROMPTS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onPrompt(item)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[11px] text-slate-300 transition hover:border-white/[0.12]"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {messages.map((m) => (
        <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[86%] rounded-2xl px-3 py-2 text-[12px] ${
              m.role === "user"
                ? "border border-sky-500/25 bg-sky-500/20 text-sky-50"
                : "border border-white/[0.08] bg-white/[0.05] text-slate-100"
            }`}
          >
            <p>{m.text}</p>
            {m.href ? (
              <Link
                href={m.href}
                onClick={onNavigate}
                className="mt-1.5 inline-block text-[11px] font-medium text-sky-300 underline underline-offset-2"
              >
                Open relevant page
              </Link>
            ) : null}
          </div>
        </div>
      ))}
      {typing ? (
        <div className="flex justify-start">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-[12px] text-slate-200">
            <TypingDots />
          </div>
        </div>
      ) : null}
    </div>
  );
}

