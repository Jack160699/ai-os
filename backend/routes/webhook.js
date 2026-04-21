import express from "express";
import { detectMode } from "../utils/detectMode.js";
import { buildPrompt } from "../services/aiControl.js";
import { getAIResponse } from "../services/openai.js";
import { sendWhatsApp } from "../services/whatsapp.js";
import { saveMessage, updateLead } from "../services/supabase.js";

const router = express.Router();

router.get("/", (req, res) => {
  const VERIFY_TOKEN = "test123";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

router.post("/", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messageObj = value?.messages?.[0];

    if (!messageObj) return res.sendStatus(200);

    const message = messageObj.text?.body;
    const phone = messageObj.from;

    if (!message || typeof message !== "string") {
      return res.sendStatus(200);
    }

    console.log("Incoming:", message);

    await saveMessage(phone, message, "user");

    const mode = detectMode(message);

    if (mode === "HUMAN_MODE") {
      await updateLead(phone, "human_requested");

      await sendWhatsApp(
        phone,
        "Connecting you to a strategist now. You'll get a reply shortly."
      );

      return res.sendStatus(200);
    }

    const prompt = buildPrompt(mode, message);

    const reply = await getAIResponse(prompt);

    await saveMessage(phone, reply, "bot");

    await sendWhatsApp(phone, reply);

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Error:", err);
    res.sendStatus(500);
  }
});

export default router;
