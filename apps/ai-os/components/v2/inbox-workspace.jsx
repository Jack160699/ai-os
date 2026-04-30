"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProMode } from "@/components/v2/pro-mode";
import { useThemeStudio } from "@/components/v2/theme-provider";

export function InboxWorkspace() {
  const { proMode } = useProMode();
  const { immersion } = useThemeStudio();
  const ib = immersion.inbox;
  const [rows, setRows] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
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
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [eventStage, setEventStage] = useState("follow_up");
  const messageEndRef = useRef(null);
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
  const formatTime = (value) => {
    const date = new Date(String(value || ""));
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const loadConversations = useCallback(async (search = "") => {
    setLoading(true);
    const qp = search ? `?q=${encodeURIComponent(search)}` : "";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`/api/v2/inbox/conversations${qp}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json().catch(() => ({}));
      console.log("API DATA:", data);
      if (!res.ok) {
        setError(data?.error || "Could not load conversations");
        setLoading(false);
        return;
      }
      const nextRows = Array.isArray(data?.conversations) ? data.conversations : [];
      const currentUnread = nextRows.reduce((acc, row) => acc + Number(row?.unread || 0), 0);
      if (prevUnreadRef.current > 0 && currentUnread > prevUnreadRef.current) {
        setTimeout(() => setToast(ib.newToast), 0);
      }
      prevUnreadRef.current = currentUnread;
      setRows((nextRows || []).map((row) => ({ ...(row || {}), last_message: row?.last_message || "" })));
      setError("");
    } catch {
      setError("Inbox request timed out. Retry sync.");
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [ib.newToast]);

  const loadDetail = useCallback(async (phone) => {
    if (!phone) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`/api/v2/inbox/${encodeURIComponent(phone)}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json().catch(() => ({}));
      console.log("API DATA:", data);
      if (!res.ok) {
        setError(data?.error || "Could not load thread");
        return;
      }
      setDetail(data && typeof data === "object" ? data : {});
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
      if (!res) return null;
      const data = await res.json().catch(() => ({}));
      console.log("TEAM API:", data);
      const team = data?.team || [];
      if (res.ok) {
        setTeamUsers((team || []).filter((user) => user?.is_active));
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
    }, 5000);
    return () => clearInterval(id);
  }, [query, selected, loadConversations, loadDetail]);

  useEffect(() => {
    if (!selected && rows.length > 0) {
      setSelected(rows[0].phone);
    }
  }, [rows, selected]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [detail?.messages?.length, selected]);

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
      if ((event.key === "ArrowDown" || event.key === "ArrowUp") && rows.length > 0) {
        const current = rows.findIndex((row) => row.phone === selected);
        if (current >= 0) {
          const next = event.key === "ArrowDown"
            ? Math.min(rows.length - 1, current + 1)
            : Math.max(0, current - 1);
          setSelected(rows[next].phone);
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

  async function generateSuggestion() {
    if (!selected) return;
    setSuggesting(true);
    try {
      const res = await fetch(`/api/v2/inbox/${encodeURIComponent(selected)}/suggest`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not generate suggestion");
        return;
      }
      const next = String(data?.suggestion || data?.text || data?.reply || "").trim();
      setSuggestion(next);
      if (next) setReply(next);
    } finally {
      setSuggesting(false);
    }
  }

  async function sendPaymentLink() {
    if (!selected) return;
    const customerName = selectedRow?.name || "Customer";
    const response = await fetch("/api/v2/payments/create-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 499,
        name: customerName,
        phone: selected,
        description: "Consultation",
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok) {
      setError(payload?.error || "Could not generate payment link");
      return;
    }
    const link = String(payload.payment_link || payload.short_url || "");
    if (!link) {
      setError("Payment link generation failed");
      return;
    }
    setReply(`Payment link: ${link}`);
    setToast("Payment link ready");
  }

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const tags = Array.isArray(row?.tags) ? row.tags.map((v) => String(v).toLowerCase()) : [];
      if (activeFilter === "unread") return Number(row?.unread || 0) > 0;
      if (activeFilter === "assigned") return Boolean(row?.assigned_user_id);
      if (activeFilter === "payments") return tags.some((tagValue) => tagValue.includes("payment"));
      if (activeFilter === "hot") return tags.some((tagValue) => tagValue.includes("hot"));
      return true;
    });
  }, [rows, activeFilter]);

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "assigned", label: "Assigned" },
    { id: "payments", label: "Payments" },
    { id: "hot", label: "Hot Leads" },
  ];

  const customerDetails = useMemo(
    () => ({
      name: selectedRow?.name || "Customer",
      phone: selected || "-",
      assigned: selectedRow?.assigned_to || "Unassigned",
      unread: Number(selectedRow?.unread || 0),
      lastSeen: formatTime(selectedRow?.last_time),
    }),
    [selectedRow, selected],
  );

  try {
    return (
    <div className="grid min-h-[calc(100vh-220px)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
      <div className="flex gap-2 lg:hidden">
        {["list", "chat", "actions"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`rounded-lg px-3 py-1.5 text-xs ${mobileTab === tab ? "border border-[var(--v2-focus)] bg-[var(--v2-elevated)] text-[var(--v2-text)]" : "border border-transparent bg-black/5 text-[var(--v2-muted)] dark:bg-white/10"}`}
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
          placeholder={ib.searchPlaceholder}
            className="mb-3 w-full rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-sm text-[var(--v2-text)] outline-none transition focus:border-[var(--v2-focus)]"
        />
        <div className="mb-3 flex flex-wrap gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                activeFilter === tab.id
                  ? "border-[var(--v2-focus)] bg-[var(--v2-elevated)] text-[var(--v2-text)]"
                  : "border-[var(--v2-border)] text-[var(--v2-muted)] hover:border-[var(--v2-focus)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="space-y-2">
            <p className="text-[11px] text-[var(--v2-muted)]">{ib.loadConversations}</p>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-black/5 dark:bg-white/10" />
            ))}
          </div>
        ) : null}
        {!loading && filteredRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-[var(--v2-muted)] dark:border-white/15">
            {ib.emptyList}
          </div>
        ) : null}
        <div className="space-y-2">
          {filteredRows.map((row) => (
            <button
              key={row.phone}
              type="button"
              onClick={() => setSelected(row.phone)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selected === row.phone
                  ? "border-[var(--v2-focus)] bg-[color-mix(in_oklab,var(--v2-accent)_10%,var(--v2-elevated))]"
                  : "border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <p className="text-sm font-semibold">{row.name || row.phone}</p>
              <p className="mt-1 line-clamp-1 text-xs text-[var(--v2-muted)]">{row.last_message || ib.noMessagePreview}</p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-[var(--v2-muted)]">{row.assigned_to || "Unassigned"}</span>
                <span className="rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-2 py-0.5">Unread {row.unread || 0}</span>
              </div>
              <p className="mt-1 text-[10px] text-[var(--v2-muted)]">Last seen {formatTime(row.last_time)}</p>
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
        {!selected ? <p className="text-sm text-[var(--v2-muted)]">{ib.selectThread}</p> : null}
        {selected ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{selectedRow?.name || selected}</h2>
              <button
                type="button"
                onClick={() => setMobileTab("list")}
                className="rounded-lg border border-[var(--v2-border)] px-2 py-1 text-[11px] text-[var(--v2-muted)] lg:hidden"
              >
                Back
              </button>
            </div>
            <button
              type="button"
              onClick={() => loadDetail(selected)}
              className="mt-2 rounded-lg border border-[var(--v2-border)] px-2 py-1 text-[11px] text-[var(--v2-muted)]"
            >
              {ib.loadOlder}
            </button>
            <div className="mt-4 space-y-2">
              {(detail?.messages || []).map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[82%] rounded-xl px-3 py-2 text-sm ${
                    message.sender === "user"
                      ? "rounded-bl-md border border-white/10 bg-white/[0.03] text-[var(--v2-text)]"
                      : "ml-auto rounded-br-md border border-[var(--v2-border)] bg-[var(--v2-elevated)] text-[var(--v2-text)]"
                  }`}
                >
                  <p>{message?.text || message?.body || ""}</p>
                  <p className="mt-1 text-[10px] opacity-75">{formatTime(message.created_at)} {message.sender === "admin" ? "· sent" : ""}</p>
                </div>
              ))}
              {(detail?.messages || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-black/15 px-3 py-2 text-xs text-[var(--v2-muted)] dark:border-white/15">
                  {ib.emptyThread}
                </div>
              ) : null}
            </div>
            <div ref={messageEndRef} />
            <div className="sticky bottom-0 mt-4 flex gap-2 rounded-xl border border-white/10 bg-[#0b1220] p-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={ib.replyPlaceholder}
                className="flex-1 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-sm text-[var(--v2-text)] outline-none transition focus:border-[var(--v2-focus)]"
              />
              <button
                onClick={sendReply}
                disabled={!selected || saving}
                className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-sm text-[var(--v2-text)] transition hover:border-[var(--v2-focus)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? ib.sending : ib.send}
              </button>
              <button
                type="button"
                onClick={sendPaymentLink}
                disabled={!selected}
                className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-sm text-[var(--v2-muted)] disabled:opacity-60"
              >
                {ib.pay}
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
        <h3 className="text-sm font-semibold">{ib.customerDetails}</h3>
        <div className="mt-2 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] p-3 text-xs text-[var(--v2-muted)]">
          <p className="font-medium text-[var(--v2-text)]">{customerDetails.name}</p>
          <p className="mt-1">{customerDetails.phone}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <p>Assigned: {customerDetails.assigned}</p>
            <p>Unread: {customerDetails.unread}</p>
            <p className="col-span-2">Last seen: {customerDetails.lastSeen}</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold">{ib.assignment}</h3>
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

        <h3 className="mt-5 text-sm font-semibold">{ib.tags}</h3>
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
            placeholder={ib.tagPlaceholder}
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

        <h3 className="mt-5 text-sm font-semibold">{ib.internalNotes}</h3>
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
            placeholder={ib.notePlaceholder}
            className="h-20 w-full rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]"
          />
          <button
            onClick={addNote}
            disabled={!selected || saving}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? ib.savingNote : ib.saveNote}
          </button>
        </div>
        {error ? <p className="mt-3 text-xs text-rose-500">{error}</p> : null}
        <h3 className="mt-5 text-sm font-semibold">{ib.aiSuggested}</h3>
        <button
          type="button"
          onClick={generateSuggestion}
          disabled={!selected || suggesting}
          className="mt-2 w-full rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)] disabled:opacity-60"
        >
          {suggesting ? ib.generating : ib.generateSuggestion}
        </button>
        {suggestion ? <p className="mt-2 text-xs text-[var(--v2-muted)]">{suggestion}</p> : null}
        {suggestion ? (
          <button
            type="button"
            onClick={() => setReply(suggestion)}
            className="mt-2 w-full rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]"
          >
            {ib.useSuggestion}
          </button>
        ) : null}

        <h3 className="mt-5 text-sm font-semibold">{ib.eventTakeover}</h3>
        <select
          value={eventStage}
          onChange={(e) => setEventStage(e.target.value)}
          className="mt-2 w-full rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-text)]"
        >
          <option value="attending">Attending</option>
          <option value="interested">Interested</option>
          <option value="follow_up">Follow-up</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setTag(eventStage);
            setToast(`Stage set: ${formatTag(eventStage)}`);
          }}
          className="mt-2 w-full rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)]"
        >
          Apply Stage
        </button>

        <h3 className="mt-5 text-sm font-semibold">Payment Action</h3>
        <button
          type="button"
          onClick={sendPaymentLink}
          disabled={!selected}
          className="mt-2 w-full rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs text-[var(--v2-muted)] disabled:opacity-60"
        >
          Generate Payment Link
        </button>
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
  } catch (e) {
    console.error(e);
    return <div>Something went wrong</div>;
  }
}
