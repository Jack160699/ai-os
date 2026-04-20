"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formatFullTime } from "@/components/chat/format";
import { QUICK_REPLIES, WHATSAPP_QUICK_TEMPLATES } from "@/components/inbox/constants";

export function ActiveChatPanel({
  selected,
  detail,
  loadingDetail,
  mobileTab,
  scrollRef,
  reply,
  setReply,
  onSend,
  sending,
  selectedRow,
  onQuickTemplate,
  compactMode = false,
}) {
  const reduce = useReducedMotion();
  const growthScore = selectedRow?.growth_score ?? detail?.state?.growth_score;
  const growthLabel = selectedRow?.growth_label ?? detail?.state?.growth_label;
  const lastActive = selectedRow?.last_time || detail?.state?.last_reply_time || "";

  return (
    <section
      className={`flex min-h-0 min-w-0 flex-col rounded-2xl border border-white/[0.07] bg-[#080b11] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${
        mobileTab === "chat" ? "flex" : "hidden"
      } lg:flex`}
    >
      {!selected ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-[13px] text-slate-500">
          Pick a conversation from the inbox to start replying.
        </div>
      ) : (
        <>
          <header className="border-b border-white/[0.06] px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{selectedRow?.name || detail?.state?.profile_name || "Lead"}</p>
                <p className="text-[11px] text-slate-500">+{selected}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 sm:flex sm:items-center">
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1">
                  Growth: {growthScore != null ? `${growthScore} · ${growthLabel || ""}` : "—"}
                </span>
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1">
                  Last active: {lastActive ? formatFullTime(lastActive) : "--"}
                </span>
              </div>
            </div>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {loadingDetail && !detail?.transcript?.length ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`admin-skeleton h-14 rounded-2xl ${i % 2 ? "ml-8" : "mr-8"}`} />
                ))}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {(detail?.transcript || []).map((m, idx) => {
                  const isUser = String(m.role).toLowerCase() === "user";
                  return (
                    <motion.div
                      key={`${m.timestamp_utc}-${idx}`}
                      initial={reduce ? undefined : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl ${compactMode ? "px-2.5 py-2 text-[12px]" : "px-3.5 py-2.5 text-[13px]"} leading-relaxed shadow-lg sm:max-w-[72%] ${
                          isUser
                            ? "border border-white/[0.08] bg-white/[0.06] text-slate-100"
                            : "border border-sky-500/20 bg-gradient-to-br from-sky-500/25 to-indigo-600/20 text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p className="mt-1 text-[10px] text-slate-500">{formatFullTime(m.timestamp_utc)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          <div className="border-t border-white/[0.06] p-3 sm:p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Quick replies (draft)</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReply(item.text)}
                  className="admin-control rounded-lg px-2.5 py-1 text-[11px] text-slate-300"
                >
                  {item.label}
                </button>
              ))}
            </div>
            {onQuickTemplate ? (
              <>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">WhatsApp templates (send now)</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {WHATSAPP_QUICK_TEMPLATES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onQuickTemplate(item.id)}
                      className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/18"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    onSend();
                  }
                }}
                rows={2}
                placeholder="Type reply... (Ctrl/Cmd + Enter to send)"
                className="admin-control min-h-[72px] flex-1 resize-none rounded-xl px-3 py-2 text-[13px] text-white outline-none ring-sky-500/20 placeholder:text-slate-600"
              />
              <button
                type="button"
                disabled={sending || !reply.trim()}
                onClick={onSend}
                className="self-end rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-2 text-[12px] font-semibold text-white shadow-lg transition-[filter,opacity] hover:brightness-110 disabled:opacity-40"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

