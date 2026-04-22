import crypto from "crypto";
import { log } from "./logger.js";

/**
 * When WHATSAPP_APP_SECRET is set, require valid X-Hub-Signature-256 (Meta).
 * Requires express.json({ verify }) so req.rawBody is set (see server.js).
 */
export function assertMetaWebhookSignature(req, res, next) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    return next();
  }

  const sigHeader = req.get("x-hub-signature-256");
  const raw = req.rawBody;

  if (!Buffer.isBuffer(raw) || raw.length === 0) {
    log.warn("Signature check skipped: raw body missing");
    return res.sendStatus(400);
  }

  if (!sigHeader || !sigHeader.startsWith("sha256=")) {
    log.warn("Missing or invalid X-Hub-Signature-256");
    return res.sendStatus(403);
  }

  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(sigHeader, "utf8");
  const b = Buffer.from(expected, "utf8");

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    log.warn("Meta webhook signature mismatch");
    return res.sendStatus(403);
  }

  return next();
}
