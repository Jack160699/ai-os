import express from "express";
import { createPaymentLink } from "../../payments/razorpay.js";
import { verifyRazorpaySignature, parsePaymentEvent } from "../../services/paymentsWebhook.js";
import {
  createClientFromLead,
  createProjectForClient,
  fetchPaymentLinks,
  fetchRevenueMetrics,
  markPaymentLinkPaidByProviderId,
  saveMessage,
  savePaymentEvent,
  savePaymentLink,
  setProposalAccepted,
  updateLead,
} from "../../services/supabase.js";
import { log } from "../../utils/logger.js";
import { ENV } from "../../config/env.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ ok: true, domain: "payments" });
});

router.get("/dashboard", async (req, res) => {
  const links = await fetchPaymentLinks(Number(req.query.limit || 200));
  const revenue = await fetchRevenueMetrics();
  const now = Date.now();
  const pendingAlerts = links
    .filter((l) => String(l.status || "") === "created" || String(l.status || "") === "pending")
    .map((l) => {
      const ageMs = now - new Date(l.created_at || now).getTime();
      return {
        id: l.id,
        phone: l.phone,
        amount_paise: l.amount_paise,
        age_hours: Math.round(ageMs / (60 * 60 * 1000)),
        urgent: ageMs > 24 * 60 * 60 * 1000,
      };
    });
  return res.status(200).json({ ok: true, links, revenue, pending_alerts: pendingAlerts });
});

router.post("/create-link", async (req, res) => {
  try {
    const { amount, name, phone, description, email, proposal_id } = req.body || {};
    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({ ok: false, error: "amount is required" });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ ok: false, error: "name is required" });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ ok: false, error: "phone is required" });
    }
    const out = await createPaymentLink({ amount, name, phone, description, email });
    await savePaymentLink({
      phone,
      proposal_id: proposal_id || null,
      provider: "razorpay",
      provider_link_id: out.id,
      short_url: out.short_url,
      amount_paise: out.amount_paise,
      status: "created",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return res.status(200).json({
      ok: true,
      payment_link: out.short_url,
      short_url: out.short_url,
      id: out.id,
      amount_paise: out.amount_paise,
    });
  } catch (err) {
    log.error("payments.create-link failed", { err: err?.message || String(err) });
    return res.status(500).json({ ok: false, error: err?.message || "internal error" });
  }
});

router.post("/webhook/razorpay", async (req, res) => {
  const secret = ENV.RAZORPAY_WEBHOOK_SECRET;
  const signature =
    req.get("x-razorpay-signature") || req.get("X-Razorpay-Signature") || "";
  const rawBody = Buffer.isBuffer(req.rawBody)
    ? req.rawBody.toString("utf8")
    : JSON.stringify(req.body || {});

  if (!secret) {
    return res.status(503).json({ ok: false, error: "webhook not configured" });
  }
  if (!verifyRazorpaySignature(rawBody, signature, secret)) {
    return res.status(400).json({ ok: false, error: "invalid signature" });
  }

  const data = req.body || {};
  const parsed = parsePaymentEvent(data);
  const successEvents = new Set(["payment_link.paid", "payment.captured"]);
  if (!successEvents.has(parsed.event)) {
    return res.status(200).json({ ok: true, ignored: true, event: parsed.event });
  }

  if (parsed.phone) {
    await updateLead(parsed.phone, "payment:captured");
    await saveMessage(
      parsed.phone,
      `payment_event=${parsed.event} amount=${parsed.amount_rupees ?? "na"}`,
      "system"
    );
  }
  if (parsed.payment_link_id) {
    const mark = await markPaymentLinkPaidByProviderId(
      parsed.payment_link_id,
      parsed.payment_id,
      new Date().toISOString()
    );
    const paymentLinkRow = mark?.payment_link || null;
    if (paymentLinkRow?.proposal_id) {
      await setProposalAccepted(paymentLinkRow.proposal_id, new Date().toISOString());
    }
    const client = await createClientFromLead({
      phone: parsed.phone,
      name: paymentLinkRow?.name || null,
      source: "payment_webhook",
    });
    await createProjectForClient({
      clientId: client?.client?.id || null,
      phone: parsed.phone,
      projectType: "website",
    });
  }
  await savePaymentEvent(parsed);

  log.info("payments.webhook.processed", parsed);
  return res.status(200).json({ ok: true, received: true, event: parsed.event });
});

export default router;
