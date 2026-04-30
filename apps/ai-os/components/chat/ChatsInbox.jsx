"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { POLL_MS } from "@/components/chat/constants";
import { ChatConversationList } from "@/components/chat/ChatConversationList";
import { ChatIntelSidebar } from "@/components/chat/ChatIntelSidebar";
import { ChatThreadPanel } from "@/components/chat/ChatThreadPanel";

export function ChatsInbox() {
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
  const [listError, setListError] = useState("");
  const [listRetryKey, setListRetryKey] = useState(0);
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
    setLoadingList(true);
    setListError("");
    try {
      const res = await fetch(`/api/admin/chats${listQuery}`, { credentials: "include", cache: "no-store" });
      let resData = {};
      try {
        resData = await res.json();
      } catch {
        resData = {};
      }
      console.log("FINAL API DATA:", resData);
      const conversations = resData?.conversations || [];
      if (!res.ok) {
        if (res.status === 401) {
          setListError("Your admin session expired. Refresh the page and sign in again.");
        } else if (resData?.error === "unauthorized") {
          setListError("Bot rejected the dashboard password. Set BACKEND_DASHBOARD_PASSWORD on Vercel to match DASHBOARD_PASSWORD on the bot host.");
        } else {
          setListError(`Could not load inbox (${res.status}). Check BOT_API_URL / bot deployment.`);
        }
        setRows([]);
        return;
      }
      if (!Array.isArray(conversations)) {
        console.log("Invalid conversations:", conversations);
        setListError("Unexpected response from inbox API.");
        setRows([]);
        return;
      }
      setRows((conversations || []).map((row) => ({ ...(row || {}), last_message: row?.last_message || "" })));
      setUpdatedAt(resData?.updated_at || "");
    } catch {
      setListError("Network error — check your connection or try again.");
      setRows([]);
    } finally {
      setLoadingList(false);
    }
  }, [listQuery, listRetryKey]);

  const retryList = useCallback(() => {
    setListRetryKey((k) => k + 1);
  }, []);

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
      const data = await res.json().catch(() => ({}));
      console.log("API DATA:", data);
      setDetail(data && typeof data === "object" ? data : {});
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
    if (listError) return;
    const id = setInterval(fetchList, POLL_MS);
    return () => clearInterval(id);
  }, [fetchList, listError]);

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

  try {
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
        <ChatConversationList
          rows={rows}
          selected={selected}
          onSelect={selectConv}
          q={q}
          onQueryChange={setQ}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          unreadOnly={unreadOnly}
          onUnreadOnlyToggle={() => setUnreadOnly((v) => !v)}
          updatedAt={updatedAt}
          loadingList={loadingList}
          listError={listError}
          onRetry={retryList}
          mobileTab={mobileTab}
        />

        <ChatThreadPanel
          selected={selected}
          detail={detail}
          loadingDetail={loadingDetail}
          mobileTab={mobileTab}
          scrollRef={scrollRef}
          reply={reply}
          setReply={setReply}
          suggestions={suggestions}
          onRefreshSuggestions={refreshSuggestions}
          onSend={sendReply}
          sending={sending}
          onMarkBooked={() => runAction("mark_booked")}
          onExport={exportTranscript}
          onAddTag={(tag) => runAction("add_tags", { tags: [tag] })}
          waLink={waLink}
          telLink={telLink}
        />

        <ChatIntelSidebar
          selected={selected}
          detail={detail}
          loadingDetail={loadingDetail}
          mobileTab={mobileTab}
        />
      </div>
    </div>
  );
  } catch (e) {
    console.error(e);
    return <div>Something went wrong</div>;
  }
}
