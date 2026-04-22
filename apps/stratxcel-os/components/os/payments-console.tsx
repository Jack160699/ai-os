"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Lead, PaymentLink } from "@/lib/models";
import { createPaymentLinkAction, syncPaymentLinkById, syncPendingPaymentLinksAction } from "@/app/(os)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatMinor(link: PaymentLink) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: link.currency }).format(link.amount_minor / 100);
  } catch {
    return `${link.amount_minor / 100} ${link.currency}`;
  }
}

function pendingAgeHours(link: PaymentLink) {
  const created = new Date(link.created_at).getTime();
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.round((Date.now() - created) / (1000 * 60 * 60)));
}

export function PaymentsConsole({
  links,
  leads,
}: {
  links: PaymentLink[];
  leads: Pick<Lead, "id" | "full_name">[];
}) {
  const router = useRouter();
  const [leadId, setLeadId] = React.useState(leads[0]?.id ?? "");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("INR");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!leadId && leads[0]?.id) setLeadId(leads[0].id);
  }, [leads, leadId]);

  const refresh = () => router.refresh();

  const syncAll = async () => {
    setBusy(true);
    try {
      await syncPendingPaymentLinksAction();
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const syncOne = async (id: string) => {
    setBusy(true);
    try {
      await syncPaymentLinkById(id);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    if (!leadId) return;
    const major = Number(amount);
    if (!Number.isFinite(major) || major <= 0) return;
    setBusy(true);
    try {
      await createPaymentLinkAction({
        leadId,
        conversationId: null,
        amountMajor: major,
        currency,
        appendMessage: false,
      });
      setAmount("");
      refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Failed to create link");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-3 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Payments</h1>
          <p className="text-sm text-slate-500">Razorpay links + status sync.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void syncAll()}>
          Sync pending
        </Button>
      </div>

      <div className="os-glass space-y-3 rounded-xl p-4">
        <p className="text-sm font-medium text-foreground">Create link</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pay-lead">Lead</Label>
            <select
              id="pay-lead"
              className="admin-control h-10 w-full rounded-md bg-transparent px-3 text-sm text-foreground"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-currency">Currency</Label>
            <select
              id="pay-currency"
              className="admin-control h-10 w-full rounded-md bg-transparent px-3 text-sm text-foreground"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pay-amount">Amount (major units)</Label>
          <Input id="pay-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="25000" />
        </div>
        <Button type="button" disabled={busy || !leadId || !amount.trim()} onClick={() => void create()}>
          Create Razorpay link
        </Button>
      </div>

      <div className="space-y-2">
        {links.some((l) => l.status === "pending" && pendingAgeHours(l) > 24) ? (
          <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Payment pending alert: some links are over 24h old. Prioritize follow-up.
          </div>
        ) : null}
        {links.length === 0 ? <p className="text-sm text-slate-500">No payment links in this batch.</p> : null}
        {links.map((link) => (
          <div key={link.id} className="os-glass flex flex-col gap-2 rounded-xl p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {link.status}
                </Badge>
                {link.status === "pending" && pendingAgeHours(link) > 24 ? (
                  <Badge variant="destructive">Pending {pendingAgeHours(link)}h</Badge>
                ) : null}
                <span className="text-slate-400">{formatMinor(link)}</span>
              </div>
              <a className="mt-1 block truncate text-xs text-sky-300 underline" href={link.checkout_url} target="_blank" rel="noreferrer">
                {link.checkout_url}
              </a>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" size="sm" variant="outline" disabled={busy || !link.provider_ref} onClick={() => void syncOne(link.id)}>
                Sync status
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
