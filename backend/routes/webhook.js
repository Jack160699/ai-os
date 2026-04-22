import express from "express";
import { detectMode } from "../utils/detectMode.js";
import { buildPrompt, detectUserLanguage, directIntentReply, routeStrategicIntent } from "../services/aiControl.js";
import {
  buildMemoryContext,
  getMemoryHistoryLimit,
  refreshLeadMemoryAfterAiTurn,
} from "../services/conversationMemory.js";
import { bumpLeadMemoryNextFollowupAfterBotReply } from "../services/revenueFollowupEngine.js";
import { analyzeAdaptiveSalesBrain } from "../services/adaptiveSalesBrain.js";
import { getAIResponse } from "../services/openai.js";
import { executeCeoCommand, isOwnerNumber } from "../services/ceoBridge.js";
import { updateQualification } from "../services/salesEngine.js";
import { sendWhatsApp } from "../services/whatsapp.js";
import { fetchRecentMessages, getLeadMemory, saveMessage, updateLead, upsertLeadMemory } from "../services/supabase.js";
import { claimWaMessageId, releaseWaMessageId } from "../utils/webhookDedupe.js";
import { assertMetaWebhookSignature } from "../utils/metaSignature.js";
import { ENV } from "../config/env.js";
import { log } from "../utils/logger.js";

const router = express.Router();

function getVerifyToken() {
  return ENV.WHATSAPP_VERIFY_TOKEN || "";
}

function extractSalesSignals(message) {
  const low = String(message || "").toLowerCase();
  const budgetMatch = low.match(/(?:₹|rs\.?|inr)?\s*(\d{2,3})\s*k\b|(?:₹|rs\.?|inr)?\s*(\d{4,6})\b/);
  const budget = budgetMatch
    ? Number((budgetMatch[1] ? Number(budgetMatch[1]) * 1000 : Number(budgetMatch[2])) || 0)
    : null;
  const service =
    /\b(app|android|ios)\b/.test(low)
      ? "app"
      : /\b(website|site|landing)\b/.test(low)
        ? "website"
        : null;
  return {
    replied: true,
    interested: /\b(need|interested|chahiye|karna|chahta)\b/.test(low),
    urgency: /\b(urgent|asap|jaldi|abhi|today)\b/.test(low),
    ready_to_buy: /\b(start|pay|proceed|book|kar do|ready to start|payment|timeline|call)\b/.test(low),
    payment_intent: /\b(payment|advance|invoice|upi|razorpay)\b/.test(low),
    budget,
    need: Boolean(service),
    timeline: /\b(today|tomorrow|week|jaldi|urgent)\b/.test(low),
    service,
  };
}

router.get("/", (req, res) => {
  const VERIFY_TOKEN = getVerifyToken();
  if (!VERIFY_TOKEN) {
    log.error("WHATSAPP_VERIFY_TOKEN is not set; cannot complete Meta webhook verification");
    return res.status(503).send("Verification token not configured");
  }

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode !== "subscribe" || token !== VERIFY_TOKEN) {
    log.warn("Webhook verification rejected", {
      mode,
      tokenMatch: token === VERIFY_TOKEN,
    });
    return res.sendStatus(403);
  }

  if (challenge === undefined || challenge === null || challenge === "") {
    log.warn("Webhook verification missing hub.challenge");
    return res.sendStatus(400);
  }

  log.info("Webhook verified (Meta challenge)");
  return res.status(200).send(String(challenge));
});

router.post("/", assertMetaWebhookSignature, async (req, res) => {
  let claimedId = null;
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messageObj = value?.messages?.[0];

    if (!messageObj) {
      log.debug("Webhook POST: no message object (status or empty)");
      return res.sendStatus(200);
    }

    const waMessageId = messageObj.id;
    if (!claimWaMessageId(waMessageId)) {
      return res.sendStatus(200);
    }
    claimedId = waMessageId || null;

    const message = messageObj.text?.body;
    const phone = messageObj.from;

    if (!message || typeof message !== "string") {
      log.debug("Webhook POST: non-text or empty body", { waMessageId, type: messageObj.type });
      return res.sendStatus(200);
    }

    log.info("Incoming WhatsApp message", {
      waMessageId,
      phone: phone ? `${String(phone).slice(0, 4)}…` : undefined,
      len: message.length,
    });

    await saveMessage(phone, message, "user");
    const owner = await isOwnerNumber(phone);
    if (owner) {
      const out = await executeCeoCommand({ command: message, phone });
      await saveMessage(phone, out.response, "bot");
      await sendWhatsApp(phone, out.response);
      return res.sendStatus(200);
    }
    if (
      /^(today stats|hot leads|revenue|pending followups|create task|assign lead|start ads)\b/i.test(
        message.trim()
      )
    ) {
      const denied = "This command channel is restricted to authorized owner numbers.";
      await saveMessage(phone, denied, "bot");
      await sendWhatsApp(phone, denied);
      return res.sendStatus(200);
    }

    const recentRows = await fetchRecentMessages(phone, getMemoryHistoryLimit());
    const leadMem = await getLeadMemory(phone);
    const adaptive = analyzeAdaptiveSalesBrain({ message, recentRows, leadMemory: leadMem });
    await upsertLeadMemory(phone, {
      buyer_type: adaptive.buyer_type,
      intent_score: adaptive.intent_score,
    });

    const signals = {
      ...extractSalesSignals(message),
      intent_score: adaptive.intent_score,
      buyer_type: adaptive.buyer_type,
    };
    await updateQualification(phone, signals);

    const mode = detectMode(message);
    const intent = routeStrategicIntent(message);
    const lang = detectUserLanguage(message);

    if (mode === "HUMAN_MODE") {
      await updateLead(phone, "human_requested");
      const ok = await sendWhatsApp(
        phone,
        "Connecting you to a strategist now. You'll get a reply shortly."
      );
      if (!ok) {
        log.error("Human handoff reply failed to send", { phone });
      }
      return res.sendStatus(200);
    }

    const direct = directIntentReply(intent, lang);
    if (direct) {
      await saveMessage(phone, direct, "bot");
      const sentDirect = await sendWhatsApp(phone, direct);
      if (!sentDirect) {
        log.error("Outbound direct reply failed to send after retries", { phone, waMessageId, intent });
      }
      await bumpLeadMemoryNextFollowupAfterBotReply(phone);
      return res.sendStatus(200);
    }

    const { promptBlock } = await buildMemoryContext(phone, { recentRows });
    const prompt = buildPrompt(mode, message, promptBlock);
    const reply = await getAIResponse(prompt);

    await saveMessage(phone, reply, "bot");
    await refreshLeadMemoryAfterAiTurn(phone);

    const sent = await sendWhatsApp(phone, reply);
    if (!sent) {
      log.error("Outbound AI reply failed to send after retries", { phone, waMessageId });
    }

    return res.sendStatus(200);
  } catch (err) {
    releaseWaMessageId(claimedId);
    log.error("Webhook unhandled error", {
      err: err?.message || String(err),
      stack: process.env.LOG_STACK === "1" ? err?.stack : undefined,
    });
    return res.sendStatus(500);
  }
});

export default router;
