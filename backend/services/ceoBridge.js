import { ENV } from "../config/env.js";
import {
  dueFollowups,
  fetchRevenueMetrics,
  insertLeadEvent,
  listCeoCommandLogs,
  logCeoCommand,
  readCeoSettings,
  saveCeoSettings,
  updateLead,
} from "./supabase.js";
import {
  buildFounderWelcomeMessage,
  isFounderGreeting,
  buildMorningBriefOperatorMessage,
  renderOperatorCeoMessage,
  runFounderDecisionEngineV2,
} from "./operatorAi.js";
import {
  buildDraftsConfirmNoMessage,
  buildDraftsConfirmYesMessage,
  buildDraftsPreviewMessage,
  buildDraftsSendAllGateMessage,
  clearOwnerExecutionDrafts,
} from "./salesExecutionEngine.js";
import { recordFounderCommand } from "./founderOperatorMemory.js";

function normPhone(v) {
  return String(v || "").replace(/\D/g, "");
}

function envOwnerNumbers() {
  return String(ENV.OWNER_WHATSAPP_NUMBERS || "")
    .split(",")
    .map(normPhone)
    .filter(Boolean);
}

function envPermissions() {
  const raw = String(ENV.CEO_COMMAND_PERMISSIONS || "");
  if (!raw.trim()) {
    return [
      "today stats",
      "hot leads",
      "revenue",
      "pending followups",
      "create task",
      "assign lead",
      "start ads",
      "weekly optimization report",
      "morning brief",
      "drafts send all",
      "drafts yes",
      "drafts no",
      "drafts preview",
    ];
  }
  return raw.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
}

async function effectiveSettings() {
  const db = await readCeoSettings();
  return {
    owners: db.owner_numbers?.length ? db.owner_numbers : envOwnerNumbers(),
    permissions: db.permissions?.length
      ? db.permissions.map((x) => String(x).trim().toLowerCase())
      : envPermissions(),
  };
}

export async function getCeoBridgeSettings() {
  const settings = await effectiveSettings();
  const history = await listCeoCommandLogs(50);
  return { ...settings, history };
}

export async function updateCeoBridgeSettings(input = {}) {
  const owners = Array.isArray(input.owner_numbers)
    ? input.owner_numbers.map(normPhone).filter(Boolean)
    : envOwnerNumbers();
  const permissions = Array.isArray(input.permissions)
    ? input.permissions.map((v) => String(v).trim().toLowerCase()).filter(Boolean)
    : envPermissions();
  await saveCeoSettings({ owner_numbers: owners, permissions });
  return { ok: true, owner_numbers: owners, permissions };
}

export async function isOwnerNumber(phone) {
  const p = normPhone(phone);
  if (!p) return false;
  const settings = await effectiveSettings();
  return settings.owners.some((n) => p.endsWith(n) || n.endsWith(p));
}

function detectIntent(commandRaw) {
  const cmd = String(commandRaw || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
  if (!cmd) return "unknown";
  if (cmd.includes("morning brief") || /^morning\s+brief\b/.test(cmd)) return "morning brief";
  if (/^drafts\s+yes\b/i.test(cmd) || cmd === "yes send drafts") return "drafts yes";
  if (/^drafts\s+no\b/i.test(cmd) || cmd === "no send drafts") return "drafts no";
  if (cmd.includes("drafts send all") || /\bsend all drafts\b/.test(cmd)) return "drafts send all";
  if (/^drafts\s+preview\b/i.test(cmd)) return "drafts preview";
  if (cmd.includes("weekly optimization report") || (cmd.includes("weekly") && cmd.includes("optimization"))) {
    return "weekly optimization report";
  }
  if (cmd.includes("today")) return "today stats";
  if (cmd.includes("hot")) return "hot leads";
  if (cmd.includes("revenue")) return "revenue";
  if (cmd.includes("follow")) return "pending followups";
  if (cmd.includes("create task") || cmd.startsWith("task ")) return "create task";
  if (cmd.includes("assign lead") || cmd.includes("assign")) return "assign lead";
  if (cmd.includes("start ads") || cmd.includes("ads start")) return "start ads";
  return "unknown";
}

function extractPhone(text) {
  const m = String(text || "").match(/(\+?\d[\d\s-]{7,}\d)/);
  return m ? normPhone(m[1]) : "";
}

function extractAssignee(text) {
  const m = String(text || "").match(/to\s+([a-z0-9@._-]+)/i);
  return m ? String(m[1]).trim() : "";
}

function formatList(items, empty = "None") {
  if (!items.length) return empty;
  return items.map((x) => `- ${x}`).join("\n");
}

function waFormatRevenue(rev) {
  return [
    "Revenue snapshot",
    `Paid links: ${rev.paid_links}`,
    `Paid deals: ${rev.paid_count}`,
    `Collected abhi tak: ₹${Number(rev.paid_amount_rupees || 0).toLocaleString("en-IN")}`,
  ].join("\n");
}

function waFormatFollowups(rows) {
  return [
    "Pending follow-ups",
    formatList(
      rows.map((r) => `${r.phone || "na"} · ${r.stage || "stage"} · ${r.next_followup_at || "now"}`),
      "Abhi pending follow-up nahi hai."
    ),
  ].join("\n");
}

function normalizeFounderSource(source) {
  return source === "interactive" ? "interactive" : "typed";
}

export async function executeCeoCommand({ command, phone, source }) {
  const raw = String(command || "").trim();
  const intent = detectIntent(raw);
  const reqSource = normalizeFounderSource(source);
  const settings = await effectiveSettings();
  const allowed = settings.permissions.includes(intent);
  let response = "";
  let interactive = null;
  let status = "unknown";
  let payload = {};

  if (intent === "unknown") {
    if (isFounderGreeting(raw)) {
      const out = buildFounderWelcomeMessage();
      response = out.text;
      interactive = out.interactive || null;
      payload = out.payload || {};
      status = "ok";
    } else {
      const out = await runFounderDecisionEngineV2({ ownerPhone: phone, message: raw, source: reqSource });
      response = out.text;
      interactive = out.interactive || null;
      payload = out.payload || {};
      status = payload?.natural_kind === "unclear" ? "clarify" : "ok";
    }
  } else if (!allowed) {
    response = `Permission denied for command: ${intent}`;
    interactive = null;
    status = "denied";
  } else if (intent === "morning brief") {
    const morning = await buildMorningBriefOperatorMessage(phone);
    response = morning.text;
    interactive = morning.interactive;
    payload = { operator: true, kind: "morning_brief", morning_hot_count: morning.morningHotCount };
    status = "ok";
  } else if (intent === "drafts preview") {
    const op = buildDraftsPreviewMessage(phone);
    response = op.text;
    interactive = null;
    payload = { operator: true, drafts_preview: true, execution_suggestions: op.suggestions };
    status = "ok";
  } else if (intent === "drafts send all") {
    const op = buildDraftsSendAllGateMessage(phone);
    response = op.text;
    interactive = null;
    payload = { operator: true, drafts_send_all: true, execution_suggestions: op.suggestions };
    status = "ok";
  } else if (intent === "drafts yes") {
    const op = buildDraftsConfirmYesMessage(phone);
    response = op.text;
    interactive = null;
    payload = { operator: true, drafts_confirmed: true, execution_suggestions: op.suggestions };
    status = "ok";
  } else if (intent === "drafts no") {
    clearOwnerExecutionDrafts(phone);
    response = buildDraftsConfirmNoMessage().text;
    interactive = null;
    payload = { operator: true, drafts_cancelled: true };
    status = "ok";
  } else if (intent === "today stats") {
    const op = await renderOperatorCeoMessage(intent, phone);
    response = op.text;
    interactive = op.interactive || null;
    payload = { operator: true, ...op.payload };
    status = "ok";
  } else if (intent === "hot leads") {
    const op = await renderOperatorCeoMessage(intent, phone);
    response = op.text;
    interactive = op.interactive || null;
    payload = { operator: true, ...op.payload };
    status = "ok";
  } else if (intent === "revenue") {
    const rev = await fetchRevenueMetrics();
    response = waFormatRevenue(rev);
    interactive = null;
    payload = rev;
    status = "ok";
  } else if (intent === "pending followups") {
    const rows = await dueFollowups(20);
    response = waFormatFollowups(rows);
    interactive = null;
    payload = { pending_followups: rows };
    status = "ok";
  } else if (intent === "create task") {
    const targetPhone = extractPhone(raw);
    const summary = raw.replace(/create task/i, "").trim() || "manual task";
    await insertLeadEvent({
      phone: targetPhone || normPhone(phone) || "system",
      event_type: "ceo_task_created",
      event_value: summary,
      payload: { command: raw },
      created_at: new Date().toISOString(),
    });
    response = `Task created ✅\nTask: ${summary}\nLead: ${targetPhone || "general queue"}`;
    interactive = null;
    payload = { task: summary, phone: targetPhone || null };
    status = "ok";
  } else if (intent === "assign lead") {
    const targetPhone = extractPhone(raw);
    const assignee = extractAssignee(raw);
    if (!targetPhone || !assignee) {
      response = "Usage: assign lead <phone> to <owner>";
      interactive = null;
      status = "invalid";
    } else {
      await updateLead(targetPhone, `assigned:${assignee}`);
      await insertLeadEvent({
        phone: targetPhone,
        event_type: "ceo_assign_lead",
        event_value: assignee,
        payload: { command: raw },
        created_at: new Date().toISOString(),
      });
      response = `Lead assigned ✅\nLead: ${targetPhone}\nOwner: ${assignee}`;
      interactive = null;
      payload = { phone: targetPhone, owner: assignee };
      status = "ok";
    }
  } else if (intent === "start ads") {
    await insertLeadEvent({
      phone: normPhone(phone) || "system",
      event_type: "ceo_start_ads",
      event_value: raw,
      payload: { command: raw },
      created_at: new Date().toISOString(),
    });
    response = "Ads kickoff queued ✅\nMedia team notified.\nCheck dashboard in 15 mins.";
    interactive = null;
    payload = { queued: true };
    status = "ok";
  } else if (intent === "weekly optimization report") {
    const op = await renderOperatorCeoMessage(intent, phone);
    response = op.text;
    interactive = op.interactive || null;
    payload = { operator: true, ...op.payload, kind: "phase_d_weekly_report" };
    status = "ok";
  }

  if ((status === "ok" || status === "clarify") && normPhone(phone)) {
    let hotCount = null;
    if (intent === "morning brief") hotCount = payload.morning_hot_count ?? null;
    else if (Array.isArray(payload.hot_leads)) hotCount = payload.hot_leads.length;
    const memoryIntent = intent === "unknown" ? `natural:${payload.natural_kind || "clarify"}` : intent;
    recordFounderCommand(phone, memoryIntent, { hotCount });
  }

  const auditPayload = {
    ...payload,
    founder_command_meta: {
      command: raw,
      source: reqSource,
      ownerPhone: normPhone(phone) || null,
      ts: new Date().toISOString(),
    },
  };

  // Best-effort analytics/audit event (non-blocking semantics preserved).
  try {
    await insertLeadEvent({
      phone: normPhone(phone) || "system",
      event_type: "ceo_command_request",
      event_value: intent,
      payload: {
        command: raw,
        source: reqSource,
        status,
        owner_phone: normPhone(phone) || null,
      },
      created_at: new Date().toISOString(),
    });
    if (auditPayload?.business_brain_v1?.decision?.action) {
      await insertLeadEvent({
        phone: normPhone(phone) || "system",
        event_type: "founder_brain_suggestion",
        event_value: String(auditPayload.business_brain_v1.decision.action).slice(0, 180),
        payload: {
          intent,
          source: reqSource,
          suggested_action: auditPayload.business_brain_v1.decision.action,
          reasoning: auditPayload.business_brain_v1.decision.reasoning,
          confidence: auditPayload.business_brain_v1.decision.confidence,
          founder_response: raw.slice(0, 220),
        },
        created_at: new Date().toISOString(),
      });
    }
  } catch {
    // Keep CEO command flow resilient if analytics insert fails.
  }

  await logCeoCommand({
    command: raw,
    intent,
    status,
    source_phone: normPhone(phone) || null,
    response_text: response,
    payload: auditPayload,
    created_at: new Date().toISOString(),
  });

  return { ok: status === "ok", intent, status, response, payload: auditPayload, interactive, source: reqSource };
}
