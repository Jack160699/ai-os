"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProMode } from "@/components/v2/pro-mode";

export function InboxWorkspace() {
  const { proMode } = useProMode();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState("");
  const [detail, setDetail] = useState(null);
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [mobileTab, setMobileTab] = useState("list");
  const [retryKey, setRetryKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const prevUnreadRef = useRef(0);
  const searchRef = useRef(null);
  const sendReplyRef = useRef(() => {});

  const selectedRow = useMemo(() => rows.find((row) => row.phone === selected) || null, [rows, selected]);
  const formatTag = (value) =>
    String(value || "")
      .replace(/[\[\]]/g, "")
      .replace(/^[a-z]+:/i, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const loadConversations = useCallback(async (search = "") => {
    setLoading(true);
    const qp = search ? `?q=${encodeURIComponent(search)}` : "";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`/api/v2/inbox/conversations${qp}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not load conversations");
        setLoading(false);
        return;
      }
      const nextRows = Array.isArray(data?.conversations) ? data.conversations : [];
      const currentUnread = nextRows.reduce((acc, row) => acc + Number(row?.unread || 0), 0);
      if (prevUnreadRef.current > 0 && currentUnread > prevUnreadRef.current) {
        setTimeout(() => setToast("New inbox message"), 0);
      }
      prevUnreadRef.current = currentUnread;
      setRows(nextRows);
      setError("");
    } catch {
      setError("Inbox request timed out. Retry sync.");
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (phone) => {
    if (!phone) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`/api/v2/inbox/${encodeURIComponent(phone)}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not load thread");
        return;
      }
      setDetail(data);
      setError("");
    } catch {
      setError("Thread request timed out. Retry sync.");
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  async function loadTeamUsers() {
    try {
      const res = await fetch("/api/v2/team", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTeamUsers((data?.users || []).filter((user) => user.is_active));
      }
    } catch {
      // Keep inbox usable even if team API is temporarily unavailable.
      setTeamUsers([]);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => {
      loadConversations();
      loadTeamUsers();
    }, 0);
    return () => clearTimeout(id);
  }, [retryKey, loadConversations]);

  useEffect(() => {
    if (selected) {
      const id = setTimeout(() => loadDetail(selected), 0);
      return () => clearTimeout(id);
    }
  }, [selected, loadDetail]);

  useEffect(() => {
    const id = setInterval(() => {
      loadConversations(query);
      if (selected) loadDetail(selected);
    }, 10000);
    return () => clearInterval(id);
  }, [query, selected, loadConversations, loadDetail]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  const sendReply = useCallback(async () => {
    const text = reply.trim();
    if (!text || !selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v2/inbox/${encodeURIComponent(selected)}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.message || data?.error || "Could not send reply");
        return;
      }
      setDetail((prev) => {
        if (!prev) return prev;
        const optimistic = {
          id: `tmp-${Date.now()}`,
          sender: "admin",
          text,
          created_at: new Date().toISOString(),
        };
        return { ...prev, messages: [...(prev.messages || []), optimistic] };
      });
      setReply("");
      setToast("Reply sent");
      await loadDetail(selected);
      await loadConversations(query);
    } finally {
      setSaving(false);
    }
  }, [reply, selected, loadDetail, loadConversations, query]);

  useEffect(() => {
    sendReplyRef.current = sendReply;
  }, [sendReply]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        const tag = String(event.target?.tagName || "").toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          event.preventDefault();
          searchRef.current?.focus();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        const tag = String(event.target?.tagName || "").toLowerCase();
        if (tag === "textarea" || tag === "input") {
          sendReplyRef.current();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function addTag() {
    const value = tag.trim().toLowerCase();
    if (!value || !selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v2/inbox/${encodeURIComponent(selected)}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || data?.error || "Could not add tag");
        return;
      }
      setDetail((prev) => ({ ...prev, tags: Array.from(new Set([...(prev?.tags || []), value])) }));
      setTag("");
      setToast("Tag added");
      await loadConversations(query);
      await loadDetail(selected);
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    const value = note.trim();
    if (!value || !selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v2/inbox/${encodeURIComponent(selected)}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || data?.error || "Could not save note");
        return;
      }
      setDetail((prev) => ({
        ...prev,
        notes: [{ id: `tmp-${Date.now()}`, note: value, created_at: new Date().toISOString() }, ...(prev?.notes || [])],
      }));
      setNote("");
      setToast("Note saved");
      await loadDetail(selected);
    } finally {
      setSaving(false);
    }
  }

  async function assignUser(value) {
    if (!selected) return;
    const user = teamUsers.find((row) => row.id === value);
    setSaving(true);
    try {
      const res = await fetch(`/api/v2/inbox/${encodeURIComponent(selected)}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_user_id: user?.id || null,
          assigned_name: user?.full_name || "Unassigned",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || data?.error || "Could not assign chat");
        return;
      }
      setRows((prev) =>
        prev.map((row) =>
          row.phone === selected ? { ...row, assigned_to: user?.full_name || "Unassigned", assigned_user_id: user?.id || null } : row,
        ),
      );
      setToast("Conversation assigned");
      await loadConversations(query);
      await loadDetail(selected);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-220px)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
      <div className="flex gap-2 lg:hidden">
        {["list", "chat", "actions"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`rounded-lg px-3 py-1.5 text-xs ${mobileTab === tab ? "bg-[#2563eb] text-white" : "bg-black/5 text-[var(--v2-muted)] dark:bg-white/10"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <section
        className={`rounded-2xl border border-white/10 bg-[#0f131a] p-3 shadow-[0_8px_30px_rgba(0,0,0,0.22)] ${
          mobileTab !== "list" ? "hidden lg:block" : ""
        }`}
      >
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadConversations(e.currentTarget.value);
          }}
          placeholder="Search by phone or text"
            className="mb-3 w-full rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-sm text-[var(--v2-text)] outline-none transition focus:border-[var(--v2-focus)]"
        />
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-black/5 dark:bg-white/10" />
            ))}
          </div>
        ) : null}
        {!loading && rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-[var(--v2-muted)] dark:border-white/15">
            No messages yet
          </div>
        ) : null}
        <div className="space-y-2">
          {rows.map((row) => (
            <button
              key={row.phone}
              type="button"
              onClick={() => setSelected(row.phone)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selected === row.phone
                  ? "border-[#3b82f6]/40 bg-[#3b82f6]/12"
                  : "border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <p className="text-sm font-semibold">{row.name || row.phone}</p>
              <p className="mt-1 line-clamp-1 text-xs text-[var(--v2-muted)]">{row.last_message || "No message"}</p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-[var(--v2-muted)]">{row.assigned_to || "Unassigned"}</span>
                <span className="rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-2 py-0.5">Unread {row.unread || 0}</span>
              </div>
              {proMode ? (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#94a3b8]">
                  <span className="rounded-md border border-white/10 px-1.5 py-0.5">SLA 12m</span>
                  <span className="rounded-md border border-white/10 px-1.5 py-0.5">Priority A</span>
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`rounded-2xl border border-white/10 bg-[#0f131a] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.22)] ${
          mobileTab !== "chat" ? "hidden lg:block" : ""
        }`}
      >
        {!selected ? <p className="text-sm text-[var(--v2-muted)]">Select a conversation</p> : null}
        {selected ? (
          <>
            <h2 className="text-base font-semibold">{selectedRow?.name || selected}</h2>
            <div className="mt-4 space-y-2">
              {(detail?.messages || []).map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[82%] rounded-xl px-3 py-2 text-sm ${
                    message.sender === "user"
                      ? "border border-white/10 bg-white/[0.03] text-[var(--v2-text)]"
                      : "ml-auto border border-[#3b82f6]/35 bg-[#3b82f6]/18 text-white"
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {(detail?.messages || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-black/15 px-3 py-2 text-xs text-[var(--v2-muted)] dark:border-white/15">
                  No messages yet
                </div>
              ) : null}
            </div>
            <div className="sticky bottom-0 mt-4 flex gap-2 rounded-xl border border-white/10 bg-[#0b1220] p-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type reply..."
                className="flex-1 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-sm text-[var(--v2-text)] outline-none transition focus:border-[var(--v2-focus)]"
              />
              <button
                onClick={sendReply}
                disabled={!selected || saving}
                className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-sm text-[var(--v2-text)] transition hover:border-[var(--v2-focus)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        ) : null}
      </motion.section>

      <section
        className={`rounded-2xl border border-white/10 bg-[#0f131a] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.22)] ${
          mobileTab !== "actions" ? "hidden lg:block" : ""
        }`}
      >
        <h3 className="text-sm font-semibold">Assignment</h3>
        <select
          value={detail?.assignment?.assigned_user_id || selectedRow?.assigned_user_id || ""}
          onChange={(e) => assignUser(e.target.value)}
          disabled={!selected || saving}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
        >
          <option value="">Unassigned</option>
          {teamUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}
            </option>
          ))}
        </select>

        <h3 className="mt-5 text-sm font-semibold">Tags</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {(detail?.tags || []).map((row) => (
            <span key={row} className="rounded-full border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-2.5 py-1 text-[11px] text-[var(--v2-muted)]">
              {formatTag(row)}
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="add tag"
            className="flex-1 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]"
          />
          <button
            onClick={addTag}
            disabled={!selected || saving}
            className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add
          </button>
        </div>

        <h3 className="mt-5 text-sm font-semibold">Internal Notes</h3>
        <div className="mt-2 space-y-2">
          {(detail?.notes || []).map((row) => (
            <div key={row.id} className="rounded-lg border border-black/8 bg-black/3 px-2 py-1 text-xs dark:border-white/10 dark:bg-white/5">
              {row.note}
            </div>
          ))}
        </div>
        <div className="mt-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add note..."
            className="h-20 w-full rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]"
          />
          <button
            onClick={addNote}
            disabled={!selected || saving}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Note"}
          </button>
        </div>
        {error ? <p className="mt-3 text-xs text-rose-500">{error}</p> : null}
        <button
          type="button"
          onClick={() => setRetryKey((v) => v + 1)}
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs"
        >
          Retry Sync
        </button>
      </section>
      {toast ? (
        <div className="fixed bottom-4 right-4 z-40 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
