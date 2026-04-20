"use client";

import * as React from "react";
import { ArrowLeft, Archive, MoreVertical, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ConversationListItem, Message, ProposalTemplate, Temperature } from "@/lib/models";
import {
  archiveConversation,
  appendOutboundMessage,
  createPaymentLinkAction,
  deleteConversation,
  sendProposalTemplateAction,
  setLeadTemperature,
} from "@/app/(os)/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function tempBadge(t: Temperature) {
  if (t === "hot") return <Badge variant="hot">Hot</Badge>;
  if (t === "warm") return <Badge variant="warm">Warm</Badge>;
  return <Badge variant="cold">Cold</Badge>;
}

export function InboxView({
  resetBatchId,
  conversations: initial,
  templates,
}: {
  resetBatchId: string;
  conversations: ConversationListItem[];
  templates: ProposalTemplate[];
}) {
  const [convos, setConvos] = React.useState(initial);
  const [selectedId, setSelectedId] = React.useState<string | null>(initial[0]?.id ?? null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = React.useState(false);
  const [autoScroll, setAutoScroll] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [tempFilter, setTempFilter] = React.useState<Temperature | "all">("all");
  const [composer, setComposer] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [mobile, setMobile] = React.useState<"list" | "thread">("list");
  const [leadOpen, setLeadOpen] = React.useState(false);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiText, setAiText] = React.useState<string | null>(null);
  const [aiTempSuggestion, setAiTempSuggestion] = React.useState<Temperature | null>(null);
  const [proposalOpen, setProposalOpen] = React.useState(false);
  const [proposalTemplateId, setProposalTemplateId] = React.useState<string>(templates[0]?.id ?? "");
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState<string>("");
  const [paymentCurrency, setPaymentCurrency] = React.useState<string>("INR");
  const [paymentAppend, setPaymentAppend] = React.useState(true);
  const [paymentBusy, setPaymentBusy] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setConvos(initial);
  }, [initial]);

  React.useEffect(() => {
    if (!proposalTemplateId && templates[0]?.id) {
      setProposalTemplateId(templates[0].id);
    }
  }, [templates, proposalTemplateId]);

  const selected = convos.find((c) => c.id === selectedId) ?? null;

  const loadMessages = React.useCallback(
    async (conversationId: string) => {
      setLoadingMsgs(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("reset_batch_id", resetBatchId)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        setMessages((data ?? []) as Message[]);
      } catch {
        setMessages([]);
      } finally {
        setLoadingMsgs(false);
      }
    },
    [resetBatchId],
  );

  React.useEffect(() => {
    if (!selectedId) return;
    void loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  React.useEffect(() => {
    if (!selectedId || !autoScroll) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, selectedId, autoScroll]);

  React.useEffect(() => {
    if (!selectedId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${selectedId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedId]);

  const filtered = convos.filter((c) => {
    if (c.archived) return false;
    if (tempFilter !== "all" && c.lead.temperature !== tempFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.lead.full_name.toLowerCase().includes(q) ||
      (c.lead.phone ?? "").toLowerCase().includes(q) ||
      (c.last_preview ?? "").toLowerCase().includes(q)
    );
  });

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setMobile("thread");
  };

  const onSend = async () => {
    if (!selectedId || !composer.trim()) return;
    setSending(true);
    try {
      await appendOutboundMessage(selectedId, composer.trim());
      setComposer("");
      await loadMessages(selectedId);
    } finally {
      setSending(false);
    }
  };

  const onArchive = async (id: string) => {
    await archiveConversation(id, true);
    setConvos((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setMessages([]);
      setMobile("list");
    }
  };

  const onDelete = async (id: string) => {
    await deleteConversation(id);
    setConvos((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setMessages([]);
      setMobile("list");
    }
  };

  const applyTemperature = async (leadId: string, t: Temperature) => {
    await setLeadTemperature(leadId, t);
    setConvos((prev) => prev.map((c) => (c.lead_id === leadId ? { ...c, lead: { ...c.lead, temperature: t } } : c)));
  };

  const runAi = async (mode: "summarize" | "suggest_reply" | "hot_detection") => {
    if (!selectedId) return;
    setAiLoading(true);
    setAiText(null);
    setAiTempSuggestion(null);
    try {
      const res = await fetch("/api/ai/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, mode }),
      });
      const data = (await res.json()) as { text?: string; temperature?: Temperature | null; error?: string };
      if (!res.ok) {
        setAiText(data.error ?? "AI request failed");
        return;
      }
      setAiText(data.text ?? "");
      if (mode === "hot_detection" && data.temperature) {
        setAiTempSuggestion(data.temperature);
      }
    } catch {
      setAiText("Network error");
    } finally {
      setAiLoading(false);
    }
  };

  const sendProposal = async () => {
    if (!selectedId || !proposalTemplateId) return;
    await sendProposalTemplateAction(proposalTemplateId, selectedId);
    setProposalOpen(false);
    await loadMessages(selectedId);
  };

  const createPayment = async () => {
    if (!selected?.lead_id) return;
    const major = Number(paymentAmount);
    if (!Number.isFinite(major) || major <= 0) return;
    setPaymentBusy(true);
    try {
      await createPaymentLinkAction({
        leadId: selected.lead_id,
        conversationId: selectedId,
        amountMajor: major,
        currency: paymentCurrency,
        appendMessage: paymentAppend,
      });
      setPaymentOpen(false);
      setPaymentAmount("");
      if (selectedId) await loadMessages(selectedId);
    } catch (e) {
      setAiText(e instanceof Error ? e.message : "Payment link failed");
    } finally {
      setPaymentBusy(false);
    }
  };

  const suggested = selected
    ? [
        "Thanks for the details — I’ll send the payment link now.",
        "Quick check: does the proposal timeline work if we start Monday?",
        "Happy to jump on a 10-min call to lock scope. What’s a good slot?",
      ]
    : [];

  return (
    <div className="flex h-[calc(100dvh-3.5rem-4.5rem-env(safe-area-inset-bottom))] min-h-0 flex-col md:h-[calc(100dvh-3.5rem)]">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 border-b border-white/[0.06] md:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,260px)] md:gap-px md:bg-white/[0.04]">
        <section
          className={cn(
            "flex min-h-0 flex-col border-white/[0.06] bg-background md:border-r",
            mobile === "thread" && "hidden md:flex",
          )}
        >
          <div className="flex items-center gap-2 border-b border-white/[0.06] p-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="h-9 pl-8" />
            </div>
          </div>
          <div className="flex gap-1 border-b border-white/[0.06] p-2">
            {(["all", "hot", "warm", "cold"] as const).map((k) => (
              <Button
                key={k}
                type="button"
                size="sm"
                variant={tempFilter === k ? "secondary" : "ghost"}
                className="h-8 flex-1 px-2 text-xs capitalize"
                onClick={() => setTempFilter(k)}
              >
                {k}
              </Button>
            ))}
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col p-1">
              {filtered.map((c) => {
                const active = c.id === selectedId;
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-start gap-2 rounded-lg px-2 py-2 transition-colors",
                      active ? "bg-white/10" : "hover:bg-white/5",
                    )}
                  >
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => selectConversation(c.id)}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{c.lead.full_name}</p>
                        {tempBadge(c.lead.temperature)}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{c.last_preview ?? "No messages yet"}</p>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 shrink-0 text-slate-400" aria-label="Chat actions">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onArchive(c.id)}>
                          <Archive className="size-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-300 focus:text-rose-200" onClick={() => onDelete(c.id)}>
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
              {filtered.length === 0 ? <p className="px-3 py-6 text-center text-sm text-slate-500">No conversations</p> : null}
            </div>
          </ScrollArea>
        </section>

        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-col bg-background",
            mobile === "list" && "hidden md:flex",
          )}
        >
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-2 py-2 md:px-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Back to conversations"
              onClick={() => setMobile("list")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{selected?.lead.full_name ?? "Inbox"}</p>
              <p className="truncate text-xs text-slate-500">{selected?.lead.phone ?? ""}</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="hidden text-xs md:inline-flex" onClick={() => setAutoScroll((v) => !v)}>
              Auto-scroll: {autoScroll ? "On" : "Off"}
            </Button>
            <Button type="button" variant="secondary" size="sm" className="text-xs md:hidden" onClick={() => setLeadOpen(true)}>
              Lead
            </Button>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 px-3 py-3">
              {loadingMsgs ? <p className="text-sm text-slate-500">Loading…</p> : null}
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.direction === "out" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      m.direction === "out" ? "bg-sky-600/90 text-white" : "bg-white/5 text-slate-100",
                    )}
                  >
                    {m.body}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-white/[0.06] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI assistant</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={!selectedId || aiLoading} onClick={() => void runAi("summarize")}>
                Summarize
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!selectedId || aiLoading} onClick={() => void runAi("suggest_reply")}>
                Suggest reply
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!selectedId || aiLoading} onClick={() => void runAi("hot_detection")}>
                Hot check
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={!selectedId || !templates.length} onClick={() => setProposalOpen(true)}>
                Proposal
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={!selectedId} onClick={() => setPaymentOpen(true)}>
                Payment link
              </Button>
            </div>
            {aiText ? (
              <div className="mt-2 space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-xs leading-relaxed text-slate-200">
                <p className="whitespace-pre-wrap">{aiText}</p>
                {aiTempSuggestion && selected ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void applyTemperature(selected.lead.id, aiTempSuggestion).then(() => setAiTempSuggestion(null))}
                  >
                    Apply {aiTempSuggestion} to lead
                  </Button>
                ) : null}
              </div>
            ) : null}

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Suggested replies</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggested.map((s) => (
                <Button key={s} type="button" variant="outline" size="sm" className="h-auto max-w-full whitespace-normal text-left text-xs" onClick={() => setComposer(s)}>
                  {s}
                </Button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={!selectedId || sending} onClick={() => setPaymentOpen(true)}>
                Create payment link
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!selectedId || sending}
                onClick={() => selectedId && void appendOutboundMessage(selectedId, "Following up — still interested in moving forward?").then(() => loadMessages(selectedId))}
              >
                Follow up
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!selectedId || sending}
                onClick={() => selectedId && void appendOutboundMessage(selectedId, "Great — I’ll mark this as closed won on our side. Welcome aboard.").then(() => loadMessages(selectedId))}
              >
                Close deal
              </Button>
            </div>
            <div className="mt-3 flex gap-2">
              <Input value={composer} onChange={(e) => setComposer(e.target.value)} placeholder="Write a message…" className="h-10" />
              <Button type="button" disabled={!selectedId || sending || !composer.trim()} onClick={() => void onSend()}>
                Send
              </Button>
            </div>
            <Button type="button" variant="ghost" size="sm" className="mt-2 text-xs text-slate-400 md:hidden" onClick={() => setAutoScroll((v) => !v)}>
              Auto-scroll: {autoScroll ? "On" : "Off"}
            </Button>
          </div>
        </section>

        <aside className="hidden min-h-0 flex-col border-l border-white/[0.06] bg-background md:flex">
          {selected ? (
            <>
              <div className="border-b border-white/[0.06] p-4">
                <p className="text-sm font-semibold text-foreground">{selected.lead.full_name}</p>
                <p className="mt-1 text-xs text-slate-500">{selected.lead.phone ?? "—"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tempBadge(selected.lead.temperature)}
                  <Badge variant="secondary">AI {selected.lead.ai_score}</Badge>
                </div>
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-3 p-4 text-sm text-slate-300">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</p>
                    <p className="mt-1">{selected.lead.source ?? "—"}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(["hot", "warm", "cold"] as const).map((t) => (
                        <Button key={t} type="button" size="sm" variant={selected.lead.temperature === t ? "default" : "outline"} className="h-8 capitalize" onClick={() => void applyTemperature(selected.lead.id, t)}>
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-slate-500">Select a conversation</div>
          )}
        </aside>
      </div>

      <Sheet open={proposalOpen} onOpenChange={setProposalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Send proposal</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3 text-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Template</p>
              <select
                className="admin-control h-10 w-full rounded-md bg-transparent px-3 text-sm text-foreground"
                value={proposalTemplateId}
                onChange={(e) => setProposalTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" disabled={!selectedId || !proposalTemplateId} onClick={() => void sendProposal()}>
              Send in thread
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={paymentOpen} onOpenChange={setPaymentOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Payment link</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3 text-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount (major units)</p>
              <Input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} inputMode="decimal" placeholder="e.g. 25000" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</p>
              <select
                className="admin-control h-10 w-full rounded-md bg-transparent px-3 text-sm text-foreground"
                value={paymentCurrency}
                onChange={(e) => setPaymentCurrency(e.target.value)}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={paymentAppend} onChange={(e) => setPaymentAppend(e.target.checked)} />
              Append checkout link to this thread
            </label>
            <Button type="button" disabled={paymentBusy || !selectedId || !paymentAmount.trim()} onClick={() => void createPayment()}>
              Create Razorpay link
            </Button>
            <p className="text-xs text-slate-500">Status syncs from Razorpay (webhook + Payments page).</p>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={leadOpen} onOpenChange={setLeadOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Lead</SheetTitle>
          </SheetHeader>
          {selected ? (
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p className="text-base font-semibold text-foreground">{selected.lead.full_name}</p>
              <p className="text-xs text-slate-500">{selected.lead.phone ?? "—"}</p>
              <div className="flex flex-wrap gap-2">
                {tempBadge(selected.lead.temperature)}
                <Badge variant="secondary">AI {selected.lead.ai_score}</Badge>
              </div>
              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</p>
              <p>{selected.lead.source ?? "—"}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <div className="flex flex-wrap gap-2">
                {(["hot", "warm", "cold"] as const).map((t) => (
                  <Button key={t} type="button" size="sm" variant={selected.lead.temperature === t ? "default" : "outline"} className="h-8 capitalize" onClick={() => void applyTemperature(selected.lead.id, t)}>
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
