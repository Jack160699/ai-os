"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const POLL_MS = 5000;

const QUICK_TEMPLATES = [
  "Thanks for your patience — I'm on it.",
  "Quick question: what's the best number to reach you?",
  "Would a 15-min call this week help lock the next step?",
  "I've shared this with our team and will follow up shortly.",
];

function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function formatFullTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function tempBadge(t) {
  const k = String(t || "").toLowerCase();
  if (k === "hot") return "bg-rose-500/15 text-rose-200 ring-rose-400/25";
  if (k === "cold") return "bg-slate-500/15 text-slate-300 ring-slate-400/20";
  return "bg-amber-500/12 text-amber-100 ring-amber-400/20";
}

export function ChatsInbox() {
  const reduce = useReducedMotion();
  const [rows, setRows] = useState([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [temperature, setTemperature] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState("");
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileTab, setMobileTab] = useState("list");
  const scrollRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 220);
    return () => clearTimeout(t);
  }, [q]);

  const listQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedQ) p.set("q", debouncedQ);
    if (temperature !== "all") p.set("temperature", temperature);
    if (unreadOnly) p.set("unread_only", "1");
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [debouncedQ, temperature, unreadOnly]);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/chats${listQuery}`, { credentials: "include", cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) setError("Session expired — refresh and sign in again.");
        else setError("Could not load inbox.");
        setRows([]);
        return;
      }
      setError("");
      const data = await res.json();
      setRows(Array.isArray(data.conversations) ? data.conversations : []);
      setUpdatedAt(data.updated_at || "");
    } catch {
      setError("Network error loading inbox.");
    } finally {
      setLoadingList(false);
    }
  }, [listQuery]);

  const fetchDetail = useCallback(async (phone) => {
    if (!phone) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/chats/${encodeURIComponent(phone)}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setDetail(null);
        return;
      }
      const data = await res.json();
      setDetail(data);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const markRead = useCallback(async (phone) => {
    if (!phone) return;
    try {
      await fetch(`/api/admin/chats/${encodeURIComponent(phone)}/read`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const id = setInterval(fetchList, POLL_MS);
    return () => clearInterval(id);
  }, [fetchList]);

  useEffect(() => {
    if (!selected) return;
    fetchDetail(selected);
    markRead(selected);
    const id = setInterval(() => fetchDetail(selected), POLL_MS);
    return () => clearInterval(id);
  }, [selected, fetchDetail, markRead]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [detail?.transcript, selected]);

  const selectConv = (phone) => {
    setSelected(phone);
    setMobileTab("chat");
  };

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/chats/${encodeURIComponent(selected)}/reply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "Send failed.");
      } else {
        setReply("");
        setError("");
        await fetchDetail(selected);
        await fetchList();
      }
    } catch {
      setError("Send failed.");
    } finally {
      setSending(false);
    }
  };

  const runAction = async (action, payload) => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/admin/chats/${encodeURIComponent(selected)}/action`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      if (res.ok) {
        await fetchDetail(selected);
        await fetchList();
      }
    } catch {
      /* ignore */
    }
  };

  const refreshSuggestions = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/admin/chats/${encodeURIComponent(selected)}/suggest`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.suggestions)) setSuggestions(data.suggestions);
    } catch {
      /* ignore */
    }
  };

  const exportTranscript = () => {
    if (!detail?.phone) return;
    const blob = new Blob([JSON.stringify(detail, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${detail.phone}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const waLink = selected ? `https://wa.me/${selected.replace(/\D/g, "")}` : "";
  const telLink = selected ? `tel:+${selected.replace(/\D/g, "")}` : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 lg:gap-4">
      {error ? (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-[13px] text-rose-100">{error}</div>
      ) : null}

      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("list")}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${mobileTab === "list" ? "bg-white/10 text-white" : "text-slate-500"}`}
        >
          Inbox
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          disabled={!selected}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${mobileTab === "chat" ? "bg-white/10 text-white" : "text-slate-500"} disabled:opacity-40`}
        >
          Thread
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("intel")}
          disabled={!selected}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${mobileTab === "intel" ? "bg-white/10 text-white" : "text-slate-500"} disabled:opacity-40`}
        >
          Intel
        </button>
      </div>

      <div className="grid min-h-[560px] flex-1 gap-3 lg:min-h-[calc(100vh-240px)] lg:grid-cols-[minmax(0,300px)_1fr_minmax(0,280px)] lg:gap-4">
        {/* Left list */}
        <aside
          className={`flex min-h-0 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${
            mobileTab === "list" ? "flex" : "hidden"
          } lg:flex`}
        >
          <div className="border-b border-white/[0.06] p-3 sm:p-4">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, phone, message…"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-3 pr-3 text-[13px] text-white outline-none ring-sky-500/20 placeholder:text-slate-600 focus:border-white/[0.14] focus:ring-2"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["all", "hot", "warm", "cold"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemperature(t)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
                    temperature === t ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUnreadOnly((v) => !v)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                  unreadOnly ? "bg-sky-500/20 text-sky-100" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Unread
              </button>
            </div>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">
              {updatedAt ? `Updated ${formatFullTime(updatedAt)}` : "Live"}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loadingList && rows.length === 0 ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.06]" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="px-3 py-10 text-center text-[13px] text-slate-500">No conversations yet. Inbound WhatsApp will land here.</div>
            ) : (
              <ul className="space-y-1">
                {rows.map((c) => {
                  const active = selected === c.phone;
                  return (
                    <li key={c.phone}>
                      <button
                        type="button"
                        onClick={() => selectConv(c.phone)}
                        className={`flex w-full flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow] ${
                          active
                            ? "border-sky-400/35 bg-sky-500/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                            : "border-transparent bg-transparent hover:border-white/[0.08] hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold text-white">{c.name}</span>
                          <span className="shrink-0 text-[11px] text-slate-500">{formatTime(c.last_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${tempBadge(c.temperature)}`}>
                            {c.temperature}
                          </span>
                          {c.unread > 0 ? (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
                              {c.unread > 9 ? "9+" : c.unread}
                            </span>
                          ) : null}
                        </div>
                        <p className="line-clamp-2 text-[12px] leading-snug text-slate-500">{c.last_message}</p>
                        <p className="text-[11px] text-slate-600">+{c.phone}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Center thread */}
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
                    onClick={() => runAction("mark_booked")}
                    className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/15"
                  >
                    Booked
                  </button>
                  <button
                    type="button"
                    onClick={exportTranscript}
                    className="rounded-lg border border-white/[0.1] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.06]"
                  >
                    Export
                  </button>
                </div>
              </header>

              <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {loadingDetail && !detail?.transcript?.length ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`h-14 rounded-2xl bg-white/[0.06] ${i % 2 ? "ml-8" : "mr-8"}`} />
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
                            className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-lg sm:max-w-[72%] ${
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
                  {suggestions.map((s, i) => (
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
                    onClick={refreshSuggestions}
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
                    onClick={sendReply}
                    className="self-end rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-2 text-[12px] font-semibold text-white shadow-lg transition-[filter,opacity] hover:brightness-110 disabled:opacity-40"
                  >
                    {sending ? "…" : "Send"}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">Tags</span>
                  {(detail?.state?.tags || []).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2 py-0.5 text-[11px] text-slate-300">
                      {tag}
                    </span>
                  ))}
                  <TagComposer
                    onAdd={(tag) => {
                      runAction("add_tags", { tags: [tag] });
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </section>

        {/* Right intel */}
        <aside
          className={`flex min-h-0 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${
            mobileTab === "intel" ? "flex" : "hidden"
          } lg:flex`}
        >
          {!selected ? (
            <p className="text-[13px] text-slate-500">Select a thread for lead intel.</p>
          ) : loadingDetail && !detail ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.06]" />
              ))}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Summary</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-200">{detail?.intelligence?.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">Sentiment</p>
                  <p className="mt-1 text-sm font-semibold text-white">{detail?.intelligence?.sentiment?.label}</p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">Intent</p>
                  <p className="mt-1 text-sm font-semibold text-white">{detail?.intelligence?.intent_score}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Next best action</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-sky-100/90">{detail?.intelligence?.recommended_next_action}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[12px] text-slate-400">
                <p>
                  <span className="text-slate-500">Step:</span> {detail?.state?.step || "—"}
                </p>
                <p className="mt-1">
                  <span className="text-slate-500">Business:</span> {detail?.state?.business_type || "—"}
                </p>
                <p className="mt-1">
                  <span className="text-slate-500">Urgency:</span> {detail?.state?.urgency || "—"}
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function TagComposer({ onAdd }) {
  const [v, setV] = useState("");
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const t = v.trim();
        if (!t) return;
        onAdd(t);
        setV("");
      }}
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Add tag"
        className="w-24 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[11px] text-white outline-none focus:border-white/[0.18]"
      />
      <button type="submit" className="rounded-lg border border-white/[0.1] px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.06]">
        +
      </button>
    </form>
  );
}
