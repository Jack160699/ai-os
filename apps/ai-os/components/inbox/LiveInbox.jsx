"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { POLL_MS } from "@/components/chat/constants";
import { ActiveChatPanel } from "@/components/inbox/ActiveChatPanel";
import { ConversationPane } from "@/components/inbox/ConversationPane";
import { LeadInfoDrawer } from "@/components/inbox/LeadInfoDrawer";

const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

function applyFilter(rows, filter, archivedMap, deletedMap) {
  const withState = rows.filter((r) => !deletedMap[r.phone]);
  const activeRows = withState.filter((r) => !archivedMap[r.phone]);
  if (filter === "archived") return withState.filter((r) => archivedMap[r.phone]);
  if (filter === "deleted") return rows.filter((r) => deletedMap[r.phone]);
  if (filter === "unread") return activeRows.filter((r) => (r.unread || 0) > 0);
  if (filter === "hot") return activeRows.filter((r) => String(r.temperature || "").toLowerCase() === "hot");
  if (filter === "closed")
    return activeRows.filter((r) => String(r.status || "").toLowerCase() === "closed" || (r.tags || []).includes("closed"));
  return activeRows;
}

function normalizeConversationRow(row = {}) {
  const phone = String(row.phone || row.id || "").replace(/\D/g, "");
  return {
    ...row,
    phone,
    name: row.name || row.title || phone || "Lead",
    last_message: row.last_message || row.lastMessage || row.snippet || row.text || "",
    last_time: row.last_time || row.timestamp || row.updated_at || row.created_at || "",
    unread: Number(row.unread ?? row.unread_count ?? 0) || 0,
    temperature: String(row.temperature || row.temp || "warm").toLowerCase(),
  };
}

function normalizeThreadMessage(row = {}, idx = 0) {
  const senderRaw = String(row.sender || row.role || "").toLowerCase();
  const sender = senderRaw === "user" ? "user" : "admin";
  const text = String(row?.text || row?.body || row?.message || "");
  const createdAt = row.created_at || row.timestamp_utc || row.timestamp || new Date().toISOString();
  return {
    id: row.id || `${createdAt}-${idx}`,
    sender,
    text,
    created_at: createdAt,
  };
}

function normalizeDetailPayload(payload, phone) {
  const input = payload ?? {};
  const transcript = Array.isArray(input?.transcript) ? input.transcript : [];
  const messagesFromTranscript = safeArray(transcript).map((row, idx) =>
    normalizeThreadMessage(
      {
        id: row.id,
        sender: row.sender || row.role,
        text: row.text,
        created_at: row.created_at || row.timestamp_utc,
      },
      idx,
    ),
  );

  let messages = [];
  if (messagesFromTranscript.length > 0) {
    messages = messagesFromTranscript;
  } else if (Array.isArray(input?.messages)) {
    messages = safeArray(input.messages).map((row, idx) => normalizeThreadMessage(row, idx));
  } else if (Array.isArray(input?.data)) {
    messages = safeArray(input.data).map((row, idx) => normalizeThreadMessage(row, idx));
  } else if (Array.isArray(input)) {
    messages = safeArray(input).map((row, idx) => normalizeThreadMessage(row, idx));
  }

  messages.sort((a, b) => Date.parse(String(a.created_at || "")) - Date.parse(String(b.created_at || "")));
  const normalizedTranscript = safeArray(messages).map((m) => ({
    role: m.sender === "user" ? "user" : "assistant",
    text: m.text,
    timestamp_utc: m.created_at,
  }));

  return {
    phone: String(input?.phone || phone || "").replace(/\D/g, ""),
    state: input?.state && typeof input.state === "object" ? input.state : {},
    messages,
    transcript: normalizedTranscript,
    suggestions: Array.isArray(input?.suggestions) ? input.suggestions : [],
  };
}

function playSubtlePing() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 740;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
    window.setTimeout(() => ctx.close(), 200);
  } catch {
    /* ignore */
  }
}

export function LiveInbox() {
  const [rows, setRows] = useState([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selected, setSelected] = useState("");
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [listRetryKey, setListRetryKey] = useState(0);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileTab, setMobileTab] = useState("list");
  const [filter, setFilter] = useState("all");
  const [ownerMap, setOwnerMap] = useState({});
  const [archivedMap, setArchivedMap] = useState({});
  const [deletedMap, setDeletedMap] = useState({});
  const [compactMode, setCompactMode] = useState(false);
  const [stickToBottom, setStickToBottom] = useState(true);
  const scrollRef = useRef(null);
  const initialListDoneRef = useRef(false);
  const prevUnreadRef = useRef(0);
  const inboxReadyRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  const listQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedQ) p.set("q", debouncedQ);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [debouncedQ]);

  const fetchList = useCallback(async () => {
    if (!initialListDoneRef.current) setLoadingList(true);
    setListError("");
    try {
      const res = await fetch(`/api/admin/chats${listQuery}`, { credentials: "include", cache: "no-store" });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      console.log("API DATA:", data);
      if (!res.ok) {
        if (res.status === 401) {
          setListError("Your admin session expired. Refresh the page and sign in again.");
        } else if (data?.error === "unauthorized") {
          setListError(
            "Bot rejected the dashboard password. Set BACKEND_DASHBOARD_PASSWORD on the app host to match DASHBOARD_PASSWORD on the Flask bot.",
          );
        } else {
          setListError(`Could not load inbox (${res.status}). Check BOT_API_URL and that the bot is reachable.`);
        }
        setRows([]);
        return;
      }
      if (!Array.isArray(data.conversations)) {
        setListError("Unexpected response from inbox API.");
        setRows([]);
        return;
      }
      const conversations = data?.conversations || [];
      if (!Array.isArray(conversations)) {
        setListError("Unexpected response from inbox API.");
        setRows([]);
        return;
      }
      const conv = safeArray(conversations).map((row) => normalizeConversationRow(row)).filter((row) => row.phone);
      const totalUnread = conv.reduce((acc, r) => acc + (Number(r.unread) || 0), 0);
      if (inboxReadyRef.current && totalUnread > prevUnreadRef.current) {
        playSubtlePing();
      }
      inboxReadyRef.current = true;
      prevUnreadRef.current = totalUnread;

      if (typeof window !== "undefined" && window.localStorage?.getItem("sx_inbox_debug") === "1") {
        console.info("[inbox] refreshed threads=", conv.length, "unread_total=", totalUnread);
      }

      setRows(conv);
      setUpdatedAt(data.updated_at || "");
    } catch {
      setListError("Network error — check your connection.");
      setRows([]);
    } finally {
      setLoadingList(false);
      initialListDoneRef.current = true;
    }
  }, [listQuery, listRetryKey]);

  const fetchDetail = useCallback(async (phone) => {
    if (!phone) return setDetail(null);
    setLoadingDetail(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`/api/admin/chats/${encodeURIComponent(phone)}`, {
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      console.log("API DATA:", data);
      if (!res.ok) {
        setDetail(normalizeDetailPayload({}, phone));
        return;
      }
      setDetail(normalizeDetailPayload(data, phone));
    } catch {
      setDetail(normalizeDetailPayload({}, phone));
    } finally {
      clearTimeout(timeoutId);
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (listError) return;
    const id = setInterval(fetchList, POLL_MS);
    return () => clearInterval(id);
  }, [fetchList, listError]);

  useEffect(() => {
    if (!selected) return;
    fetchDetail(selected);
    const id = setInterval(() => fetchDetail(selected), POLL_MS);
    return () => clearInterval(id);
  }, [selected, fetchDetail]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 72;
      setStickToBottom(nearBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && (stickToBottom || !selected)) el.scrollTop = el.scrollHeight;
  }, [detail?.transcript, selected, stickToBottom]);

  const filteredRows = useMemo(() => applyFilter(safeArray(rows), filter, archivedMap, deletedMap), [rows, filter, archivedMap, deletedMap]);
  const selectedRow = useMemo(() => safeArray(rows).find((item) => item.phone === selected) || null, [rows, selected]);

  const liveEmpty = !listError && !loadingList && safeArray(rows).length === 0 && !debouncedQ && filter === "all";

  async function postAction(action, payload = {}) {
    if (!selected) return { ok: false };
    const res = await fetch(`/api/admin/chats/${encodeURIComponent(selected)}/action`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    return res.json().catch(() => ({}));
  }

  async function sendQuickTemplate(templateId) {
    if (!selected || sending) return;
    setSending(true);
    setError("");
    try {
      const data = await postAction("send_quick_reply", { template_id: templateId });
      if (!data.ok) {
        setError(data.error || data.detail || "Template send failed.");
      } else {
        await fetchDetail(selected);
        await fetchList();
      }
    } catch {
      setError("Template send failed.");
    } finally {
      setSending(false);
    }
  }

  async function addTag(tag) {
    if (!selected) return;
    const data = await postAction("add_tags", { tags: [tag] });
    if (!data.ok) setError(data.error || "Could not add tag.");
    else await fetchDetail(selected);
  }

  async function addNote(text) {
    if (!selected) return;
    const data = await postAction("add_note", { text });
    if (!data.ok) setError(data.error || "Could not save note.");
    else await fetchDetail(selected);
  }

  async function sendReply() {
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
        const nowIso = new Date().toISOString();
        setDetail((prev) => {
          if (!prev) return prev;
          const nextTranscript = Array.isArray(prev.transcript)
            ? [...prev.transcript, { role: "assistant", text, timestamp_utc: nowIso }]
            : [{ role: "assistant", text, timestamp_utc: nowIso }];
          const nextMessages = Array.isArray(prev.messages)
            ? [...prev.messages, { id: `${selected}-${nowIso}`, sender: "admin", text, created_at: nowIso }]
            : [{ id: `${selected}-${nowIso}`, sender: "admin", text, created_at: nowIso }];
          return { ...prev, transcript: nextTranscript, messages: nextMessages };
        });
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
  }

  try {
    return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 lg:gap-4">
      {error ? <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-[13px] text-rose-100">{error}</div> : null}

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
          Chat
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("intel")}
          disabled={!selected}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${mobileTab === "intel" ? "bg-white/10 text-white" : "text-slate-500"} disabled:opacity-40`}
        >
          Lead
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2">
        <p className="text-[11px] text-slate-400">Conversation workspace</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStickToBottom((v) => !v)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
              stickToBottom ? "bg-sky-500/20 text-sky-100" : "text-slate-400"
            }`}
          >
            Auto-scroll
          </button>
          <button
            type="button"
            onClick={() => setCompactMode((v) => !v)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${compactMode ? "bg-white/12 text-white" : "text-slate-400"}`}
          >
            Compact
          </button>
        </div>
      </div>

      <div className="grid min-h-[540px] flex-1 gap-3 overflow-hidden lg:min-h-[calc(100vh-260px)] lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,290px)] lg:gap-4">
        <ConversationPane
          rows={filteredRows}
          selected={selected}
          onSelect={(phone) => {
            setSelected(phone);
            setMobileTab("chat");
          }}
          q={q}
          onQueryChange={setQ}
          filter={filter}
          onFilterChange={setFilter}
          updatedAt={updatedAt}
          loadingList={loadingList}
          listError={listError}
          onRetry={() => setListRetryKey((k) => k + 1)}
          mobileTab={mobileTab}
          liveEmpty={liveEmpty}
          compactMode={compactMode}
        />
        <ActiveChatPanel
          selected={selected}
          detail={detail}
          loadingDetail={loadingDetail}
          mobileTab={mobileTab}
          scrollRef={scrollRef}
          reply={reply}
          setReply={setReply}
          onSend={sendReply}
          sending={sending}
          selectedRow={selectedRow}
          onQuickTemplate={sendQuickTemplate}
          compactMode={compactMode}
        />
        <LeadInfoDrawer
          selected={selected}
          detail={detail}
          mobileTab={mobileTab}
          owner={ownerMap[selected] || "Unassigned"}
          onOwnerChange={(value) => setOwnerMap((prev) => ({ ...prev, [selected]: value }))}
          onAddTag={addTag}
          onAddNote={addNote}
          onArchive={() => setArchivedMap((prev) => ({ ...prev, [selected]: true }))}
          onDelete={() => {
            setDeletedMap((prev) => ({ ...prev, [selected]: true }));
            setSelected("");
          }}
        />
      </div>
    </div>
  );
  } catch (e) {
    console.error("UI CRASH:", e);
    return <div>Loading...</div>;
  }
}
