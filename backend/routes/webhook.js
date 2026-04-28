import express from "express";
import { detectMode } from "../utils/detectMode.js";
import {
  buildBundleRecommendationReply,
  buildIntentRoutedReply,
  buildObjectionReply,
  buildPrompt,
  detectRequestedService,
  detectUserLanguage,
  directIntentReply,
  getServicePackage,
  getIndustryBundle,
  isAgreementMessage,
  isHighIntentMessage,
  routeStrategicIntent,
} from "../services/aiControl.js";
import {
  buildMemoryContext,
  getMemoryHistoryLimit,
  refreshLeadMemoryAfterAiTurn,
} from "../services/conversationMemory.js";
import { bumpLeadMemoryNextFollowupAfterBotReply } from "../services/revenueFollowupEngine.js";
import {
  trackPhaseDAnalytics,
} from "../services/phaseDAnalytics.js";
import { analyzeAdaptiveSalesBrain } from "../services/adaptiveSalesBrain.js";
import { getAIResponse } from "../services/openai.js";
import { executeCeoCommand, isOwnerNumber } from "../services/ceoBridge.js";
import { updateQualification } from "../services/salesEngine.js";
import { sendFounderOutreach, sendWhatsApp } from "../services/whatsapp.js";
import {
  fetchRecentMessages,
  getLeadMemory,
  saveMessage,
  updateLead,
  upsertLeadMemory,
} from "../services/supabase.js";
import { handlePaymentConfirmationMessage, isPaymentConfirmationMessage, sendInstantPaymentFlow } from "../services/paymentFlow.js";
import { recordPhaseDBotTurn } from "../services/replyEngine.js";
import {
  appendMemoryTag,
  extractLeadProfilePatch,
  isReturningLead,
  parseNeedTag,
  readMemoryTag,
} from "../services/leadBrain.js";
import { claimWaMessageId, releaseWaMessageId } from "../utils/webhookDedupe.js";
import { assertMetaWebhookSignature } from "../utils/metaSignature.js";
import { ENV } from "../config/env.js";
import { log } from "../utils/logger.js";

const router = express.Router();

async function persistMessageWithLog(phone, text, sender, context = "unknown") {
  await saveMessage(phone, text, sender);
  if (sender === "user") {
    console.log("saved incoming message", { phone, sender, context });
    return;
  }
  console.log("saved outgoing message", { phone, sender, context });
}

function wantsExplicitCall(message) {
  return /\b(book|schedule)\s+(a\s+)?call\b|\bcall me\b|\bzoom\b|\bgoogle meet\b|\bvoice call\b/i.test(
    String(message || "")
  );
}


function getVerifyToken() {
  return ENV.WHATSAPP_VERIFY_TOKEN || "";
}

function extractInboundUserText(messageObj) {
  const t = messageObj?.text?.body;
  if (typeof t === "string" && t.trim()) return t.trim();
  const interactiveId = messageObj?.interactive?.button_reply?.id || messageObj?.interactive?.list_reply?.id;
  if (interactiveId) return String(interactiveId).trim();
  return "";
}

function detectInboundFounderSource(messageObj) {
  if (messageObj?.type === "interactive") {
    if (messageObj?.interactive?.button_reply?.id || messageObj?.interactive?.list_reply?.id) {
      return "interactive";
    }
  }
  return "typed";
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

    const message = extractInboundUserText(messageObj);
    const founderSource = detectInboundFounderSource(messageObj);
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

    await persistMessageWithLog(phone, message, "user", "webhook_incoming");
    const owner = await isOwnerNumber(phone);
    if (owner) {
      const out = await executeCeoCommand({ command: message, phone, source: founderSource });
      await persistMessageWithLog(phone, out.response, "bot", "ceo_command");
      await sendFounderOutreach(phone, { text: out.response, interactive: out.interactive });
      return res.sendStatus(200);
    }
    if (
      /^(today stats|hot leads|revenue|pending followups|create task|assign lead|start ads|weekly optimization report|morning brief|drafts\b)/i.test(
        message.trim()
      )
    ) {
      const denied = "This command channel is restricted to authorized owner numbers.";
      await persistMessageWithLog(phone, denied, "bot", "ceo_denied");
      await sendWhatsApp(phone, denied);
      return res.sendStatus(200);
    }

    const leadMem = await getLeadMemory(phone);
    if (isPaymentConfirmationMessage(message)) {
      const paymentReply = await handlePaymentConfirmationMessage(phone);
      if (paymentReply?.text) {
        if (paymentReply.paid) {
          await updateLead(phone, "payment:captured");
          const nowIso = new Date().toISOString();
          const reminderAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
          const nextSummary = [String(leadMem?.last_summary || "").trim(), "[onboarding_pending:1]"]
            .filter(Boolean)
            .join(" ")
            .trim();
          await upsertLeadMemory(phone, {
            stage: "closed_won",
            next_followup_at: reminderAt,
            last_contacted_at: nowIso,
            last_summary: nextSummary || null,
          });
          const owners = String(ENV.OWNER_WHATSAPP_NUMBERS || "")
            .split(",")
            .map((n) => String(n || "").replace(/\D/g, ""))
            .filter(Boolean);
          for (const ownerPhone of owners) {
            await sendWhatsApp(
              ownerPhone,
              `Payment confirmed for ${phone}.\nStatus: paid\nAction: onboarding started.`
            );
          }
        }
        await persistMessageWithLog(phone, paymentReply.text, "bot", "payment_confirmation");
        const sentPay = await sendWhatsApp(phone, paymentReply.text);
        if (!sentPay) {
          log.error("Outbound payment confirmation reply failed to send after retries", { phone, waMessageId });
        }
        return res.sendStatus(200);
      }
    }

    const recentRows = await fetchRecentMessages(phone, getMemoryHistoryLimit());
    const adaptive = analyzeAdaptiveSalesBrain({ message, recentRows, leadMemory: leadMem });
    const profilePatch = extractLeadProfilePatch(message, leadMem || {});
    const needTag = parseNeedTag(message);
    const objectionTag = adaptive.objection_type || "";
    const memorySeed = String(leadMem?.last_summary || "");
    let taggedSummary = memorySeed;
    if (needTag) taggedSummary = appendMemoryTag(taggedSummary, "need", needTag);
    if (objectionTag) taggedSummary = appendMemoryTag(taggedSummary, "objection", objectionTag);
    await upsertLeadMemory(phone, {
      buyer_type: adaptive.buyer_type,
      intent_score: adaptive.intent_score,
      stage: adaptive.hot_lead ? "qualified" : leadMem?.stage || "engaged",
      ...profilePatch,
      last_summary: taggedSummary || leadMem?.last_summary || null,
    });

    const lang = detectUserLanguage(message);
    const userTurnCount = recentRows.filter((r) => String(r?.sender || "").toLowerCase() === "user").length;
    const sig0 = extractSalesSignals(message);
    const niche =
      leadMem?.business_type || leadMem?.service_interest || sig0.service || null;

    await trackPhaseDAnalytics({
      phone,
      event_type: "inbound_message",
      meta: {
        buyer_type: adaptive.buyer_type,
        intent_score: adaptive.intent_score,
        niche,
        language: lang,
      },
    });
    if (sig0.payment_intent) {
      await trackPhaseDAnalytics({
        phone,
        event_type: "payment_intent",
        meta: {
          buyer_type: adaptive.buyer_type,
          intent_score: adaptive.intent_score,
          niche,
          language: lang,
        },
      });
    }

    const signals = {
      ...sig0,
      intent_score: adaptive.intent_score,
      buyer_type: adaptive.buyer_type,
      language: lang,
    };
    await updateQualification(phone, signals);

    const mode = detectMode(message);
    const intent = routeStrategicIntent(message);
    const isPaidLead = String(leadMem?.stage || "").toLowerCase() === "closed_won";

    if (isPaidLead) {
      const summary = String(leadMem?.last_summary || "");
      const testimonialRequested = /\[testimonial_requested:1\]/.test(summary);
      const positive = /\b(great|awesome|nice|good|working|love|perfect|thanks|thank you)\b/i.test(String(message || ""));
      if (positive && !testimonialRequested) {
        const testimonialReply =
          "Great to hear that. If you're open, share a 1-2 line testimonial on your experience so far — it helps us a lot.";
        const nextSummary = [summary.trim(), "[testimonial_requested:1]"].filter(Boolean).join(" ").trim();
        await upsertLeadMemory(phone, { last_summary: nextSummary || null, last_contacted_at: new Date().toISOString() });
        await persistMessageWithLog(phone, testimonialReply, "bot", "testimonial_request");
        await sendWhatsApp(phone, testimonialReply);
        return res.sendStatus(200);
      }
      const paidSupportReply =
        "You're on the VIP client track. Share any update or blocker, and I'll move setup/support forward on priority.";
      await persistMessageWithLog(phone, paidSupportReply, "bot", "paid_support");
      await sendWhatsApp(phone, paidSupportReply);
      return res.sendStatus(200);
    }

    if (mode === "HUMAN_MODE") {
      await trackPhaseDAnalytics({
        phone,
        event_type: "call_requested",
        meta: {
          buyer_type: adaptive.buyer_type,
          intent_score: adaptive.intent_score,
          niche,
          language: lang,
          extra: { kind: "human_handoff" },
        },
      });
      await updateLead(phone, "human_requested");
      await persistMessageWithLog(phone, "Connecting you to a strategist now. You'll get a reply shortly.", "bot", "human_handoff");
      const ok = await sendWhatsApp(
        phone,
        "Connecting you to a strategist now. You'll get a reply shortly."
      );
      if (!ok) {
        log.error("Human handoff reply failed to send", { phone });
      }
      return res.sendStatus(200);
    }

    if (wantsExplicitCall(message)) {
      await trackPhaseDAnalytics({
        phone,
        event_type: "call_requested",
        meta: {
          buyer_type: adaptive.buyer_type,
          intent_score: adaptive.intent_score,
          niche,
          language: lang,
          extra: { kind: "sales_call" },
        },
      });
    }

    const highIntent = isHighIntentMessage(message) || Boolean(adaptive.hot_lead);
    const agreesToBuy = isAgreementMessage(message) || Boolean(adaptive.buying_intent);
    const hasPaymentIntent = Boolean(sig0.payment_intent);
    const isSalesContext = mode === "SALES_MODE" || intent === "pricing" || intent === "interested";
    const effectiveLeadMem = { ...(leadMem || {}), ...profilePatch, last_summary: taggedSummary || leadMem?.last_summary || "" };
    const previousNeed = readMemoryTag(effectiveLeadMem.last_summary, "need");
    const serviceKey = detectRequestedService(message, String(effectiveLeadMem?.service_interest || ""));
    const bundle = getIndustryBundle({ industry: adaptive.industry || "general", requestedService: serviceKey });
    const servicePkg = getServicePackage(bundle.primaryService || serviceKey);

    // Highest-priority close path: payment intent / explicit buy intent / hot buyer.
    if (hasPaymentIntent || highIntent || agreesToBuy) {
      const closeReply = await sendInstantPaymentFlow({
        phone,
        leadMem,
        lang,
        servicePkg,
        serviceKey: bundle.primaryService || serviceKey,
      });
      await persistMessageWithLog(phone, closeReply, "bot", "close_mode");
      const sentClose = await sendWhatsApp(phone, closeReply);
      if (!sentClose) {
        log.error("Outbound close-mode reply failed to send after retries", { phone, waMessageId, intent });
      }
      await recordPhaseDBotTurn({
        phone,
        replyText: closeReply,
        source: "whatsapp_close_mode",
        adaptive,
        niche: serviceKey,
        lang,
        userTurnCount,
      });
      await bumpLeadMemoryNextFollowupAfterBotReply(phone);
      return res.sendStatus(200);
    }

    const bundleReply = buildBundleRecommendationReply({
      language: lang,
      industry: adaptive.industry || "general",
      requestedService: serviceKey,
      previousNeed,
      returningClient: isReturningLead(effectiveLeadMem),
    });
    if (bundleReply && isSalesContext) {
      await persistMessageWithLog(phone, bundleReply, "bot", "bundle_recommendation");
      const sentBundle = await sendWhatsApp(phone, bundleReply);
      if (!sentBundle) {
        log.error("Outbound bundle recommendation failed to send after retries", { phone, waMessageId, intent });
      }
      await recordPhaseDBotTurn({
        phone,
        replyText: bundleReply,
        source: "whatsapp_bundle_recommendation",
        adaptive,
        niche: bundle.primaryService || serviceKey,
        lang,
        userTurnCount,
      });
      await bumpLeadMemoryNextFollowupAfterBotReply(phone);
      return res.sendStatus(200);
    }

    const objectionReply = buildObjectionReply({
      language: lang,
      objectionType: adaptive.objection_type || null,
      industry: adaptive.industry || "general",
      serviceKey: bundle.primaryService || serviceKey,
    });
    if (objectionReply) {
      await persistMessageWithLog(phone, objectionReply, "bot", "objection_router");
      const sentObj = await sendWhatsApp(phone, objectionReply);
      if (!sentObj) {
        log.error("Outbound objection reply failed to send after retries", { phone, waMessageId, intent });
      }
      await recordPhaseDBotTurn({
        phone,
        replyText: objectionReply,
        source: "whatsapp_objection_router",
        adaptive,
        niche: serviceKey,
        lang,
        userTurnCount,
      });
      await bumpLeadMemoryNextFollowupAfterBotReply(phone);
      return res.sendStatus(200);
    }

    const intentRoutedReply = buildIntentRoutedReply({
      language: lang,
      intentBand: adaptive.intent_band || "cold",
      industry: adaptive.industry || "general",
      serviceKey: bundle.primaryService || serviceKey,
      previousNeed,
    });
    if (intentRoutedReply && (isSalesContext || intent !== "general")) {
      await persistMessageWithLog(phone, intentRoutedReply, "bot", "intent_router");
      const sentRouted = await sendWhatsApp(phone, intentRoutedReply);
      if (!sentRouted) {
        log.error("Outbound intent-routed reply failed to send after retries", { phone, waMessageId, intent });
      }
      await recordPhaseDBotTurn({
        phone,
        replyText: intentRoutedReply,
        source: "whatsapp_intent_band_router",
        adaptive,
        niche: serviceKey,
        lang,
        userTurnCount,
      });
      await bumpLeadMemoryNextFollowupAfterBotReply(phone);
      return res.sendStatus(200);
    }

    const direct = directIntentReply(intent, lang);
    if (direct) {
      await persistMessageWithLog(phone, direct, "bot", "direct_intent");
      const sentDirect = await sendWhatsApp(phone, direct);
      if (!sentDirect) {
        log.error("Outbound direct reply failed to send after retries", { phone, waMessageId, intent });
      }
      await recordPhaseDBotTurn({
        phone,
        replyText: direct,
        source: "whatsapp_direct_intent",
        adaptive,
        niche,
        lang,
        userTurnCount,
      });
      await bumpLeadMemoryNextFollowupAfterBotReply(phone);
      return res.sendStatus(200);
    }

    const { promptBlock } = await buildMemoryContext(phone, { recentRows });
    const prompt = buildPrompt(mode, message, promptBlock, {
      closeMode: false,
      serviceKey,
      packageName: servicePkg.packageName,
      packagePrice: servicePkg.priceInr,
      packageTimeline: servicePkg.timeline,
    });
    const reply = await getAIResponse(prompt);

    await persistMessageWithLog(phone, reply, "bot", "ai_reply");
    await refreshLeadMemoryAfterAiTurn(phone);
    await recordPhaseDBotTurn({
      phone,
      replyText: reply,
      source: "whatsapp_ai",
      adaptive,
      niche,
      lang,
      userTurnCount,
    });

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
