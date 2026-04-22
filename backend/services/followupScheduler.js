import { dueFollowups, insertLeadEvent, saveMessage, upsertSalesOpportunity } from "./supabase.js";
import { sendWhatsApp } from "./whatsapp.js";
import { log } from "../utils/logger.js";

function followupText(service) {
  const svc = service ? ` for ${service}` : "";
  return `Quick follow-up${svc} 👋\nWant me to share next steps + pricing now?`;
}

export async function runFollowupSweep(limit = 20) {
  const due = await dueFollowups(limit);
  let sent = 0;
  for (const row of due) {
    const phone = String(row?.phone || "");
    if (!phone) continue;
    const msg = followupText(row?.service);
    const ok = await sendWhatsApp(phone, msg);
    if (!ok) continue;
    sent += 1;
    const now = new Date().toISOString();
    await saveMessage(phone, msg, "bot");
    await insertLeadEvent({
      phone,
      event_type: "followup_sent",
      event_value: row?.stage || "unknown",
      payload: { source: "scheduler" },
      created_at: now,
    });
    await upsertSalesOpportunity({
      phone,
      stage: row?.stage || "contacted",
      qualification_state: row?.qualification_state || "engaged",
      service: row?.service || null,
      budget: row?.budget || null,
      urgency: Boolean(row?.urgency),
      next_followup_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      updated_at: now,
    });
  }
  return { ok: true, due: due.length, sent };
}

let timer = null;
export function startFollowupScheduler() {
  if (process.env.FOLLOWUP_SCHEDULER_ENABLED !== "1") return;
  if (timer) return;
  const mins = Math.max(5, Number.parseInt(process.env.FOLLOWUP_SCHEDULER_INTERVAL_MIN || "15", 10) || 15);
  const interval = mins * 60 * 1000;
  timer = setInterval(() => {
    runFollowupSweep().catch((err) => {
      log.warn("followup_scheduler_tick_failed", { err: err?.message || String(err) });
    });
  }, interval);
  log.info("followup_scheduler_started", { every_minutes: mins });
}
