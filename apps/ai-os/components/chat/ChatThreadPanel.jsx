"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { QUICK_TEMPLATES } from "@/components/chat/constants";
import { formatFullTime } from "@/components/chat/format";
import { TagComposer } from "@/components/chat/TagComposer";

const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

export function ChatThreadPanel({
  selected,
  detail,
  loadingDetail,
  mobileTab,
  scrollRef,
  reply,
  setReply,
  suggestions,
  onRefreshSuggestions,
  onSend,
  sending,
  onMarkBooked,
  onExport,
  onAddTag,
  waLink,
  telLink,
}) {
  const reduce = useReducedMotion();
  const safeSuggestions = safeArray(suggestions);
  const safeTranscript = safeArray(detail?.transcript);
  const safeTags = safeArray(detail?.state?.tags);

  try {
    return (
    <section
      className={`flex min-h-0 min-w-0 flex-col rounded-2xl border border-white/[0.07] bg-[#080b11] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${
        mobileTab === "chat" ? "flex" : "hidden"
      } lg:flex`}
    >
      {!selected ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-[13px] text-slate-500">
          Select a conversation to read the thread and reply.
        </div>
      ) : (
        <>
          <header className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{detail?.state?.profile_name || "Lead"}</p>
              <p className="text-[11px] text-slate-500">+{selected}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                WhatsApp
              </a>
              <a
                href={telLink}
                className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                Call
              </a>
              <button
                type="button"
                onClick={onMarkBooked}
                className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/15"
              >
                Booked
              </button>
              <button
                type="button"
                onClick={onExport}
                className="rounded-lg border border-white/[0.1] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.06]"
              >
                Export
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {loadingDetail && !safeTranscript.length ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`h-14 rounded-2xl bg-white/[0.06] ${i % 2 ? "ml-8" : "mr-8"}`} />
                ))}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {safeArray(safeTranscript).map((m, idx) => {
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
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-lg sm:max-w-[72%] ${
                          isUser
                            ? "border border-white/[0.08] bg-white/[0.06] text-slate-100"
                            : "border border-sky-500/20 bg-gradient-to-br from-sky-500/25 to-indigo-600/20 text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m?.text || m?.body || ""}</p>
                        <p className="mt-1 text-[10px] text-slate-500">{formatFullTime(m.timestamp_utc)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          <div className="border-t border-white/[0.06] p-3 sm:p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Quick inserts</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setReply((r) => (r ? `${r}\n${tpl}` : tpl))}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-300 hover:border-white/[0.12] hover:bg-white/[0.06]"
                >
                  {tpl.slice(0, 28)}…
                </button>
              ))}
            </div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              <p className="w-full text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">AI suggestions</p>
              {safeArray(safeSuggestions).map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReply(s)}
                  className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-left text-[11px] text-violet-100 hover:bg-violet-500/15"
                >
                  {s.length > 90 ? `${s.slice(0, 90)}…` : s}
                </button>
              ))}
              <button
                type="button"
                onClick={onRefreshSuggestions}
                className="rounded-lg border border-white/[0.08] px-2 py-1 text-[11px] text-slate-400 hover:bg-white/[0.05]"
              >
                Refresh
              </button>
            </div>
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder="Write a reply… (sends via WhatsApp Cloud)"
                className="min-h-[72px] flex-1 resize-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none ring-sky-500/20 placeholder:text-slate-600 focus:border-white/[0.16] focus:ring-2"
              />
              <button
                type="button"
                disabled={sending || !reply.trim()}
                onClick={onSend}
                className="self-end rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-2 text-[12px] font-semibold text-white shadow-lg transition-[filter,opacity] hover:brightness-110 disabled:opacity-40"
              >
                {sending ? "…" : "Send"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">Tags</span>
              {safeArray(safeTags).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2 py-0.5 text-[11px] text-slate-300"
                >
                  {tag}
                </span>
              ))}
              <TagComposer onAdd={onAddTag} />
            </div>
          </div>
        </>
      )}
    </section>
  );
  } catch (e) {
    console.error("UI CRASH:", e);
    return <div>Loading...</div>;
  }
}
