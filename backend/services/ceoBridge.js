import { ENV } from "../config/env.js";
import {
  dueFollowups,
  fetchFunnelMetrics,
  fetchLeads,
  fetchRevenueMetrics,
  insertLeadEvent,
  listCeoCommandLogs,
  logCeoCommand,
  readCeoSettings,
  saveCeoSettings,
  updateLead,
} from "./supabase.js";
import { getDashboardCore } from "./dashboardMetrics.js";
import { buildWeeklyOptimizationReportForFounder } from "./phaseDOptimizer.js";

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
  const cmd = String(commandRaw || "").trim().toLowerCase();
  if (!cmd) return "unknown";
  if (cmd.includes("today")) return "today stats";
  if (cmd.includes("hot")) return "hot leads";
  if (cmd.includes("revenue")) return "revenue";
  if (cmd.includes("follow")) return "pending followups";
  if (cmd.includes("create task") || cmd.startsWith("task ")) return "create task";
  if (cmd.includes("assign lead") || cmd.includes("assign")) return "assign lead";
  if (cmd.includes("start ads") || cmd.includes("ads start")) return "start ads";
  if (cmd.includes("weekly optimization report") || (cmd.includes("weekly") && cmd.includes("optimization"))) {
    return "weekly optimization report";
  }
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

function waFormatToday(stats) {
  return [
    "Today's Stats",
    `Total leads: ${stats.total_leads}`,
    `Qualified: ${stats.qualified}`,
    `Won: ${stats.won}`,
    `Conversion: ${stats.conversion_rate_pct}%`,
  ].join("\n");
}

function waFormatHot(leads) {
  return [
    "Hot Leads",
    formatList(
      leads.map((l) => `${l.name || "Lead"} (${l.phone || "na"}) score ${l.score || 0}`),
      "No hot leads right now."
    ),
  ].join("\n");
}

function waFormatRevenue(rev) {
  return [
    "Revenue Summary",
    `Paid links: ${rev.paid_links}`,
    `Paid count: ${rev.paid_count}`,
    `Collected: ₹${Number(rev.paid_amount_rupees || 0).toLocaleString("en-IN")}`,
  ].join("\n");
}

function waFormatFollowups(rows) {
  return [
    "Pending Followups",
    formatList(
      rows.map((r) => `${r.phone || "na"} · ${r.stage || "stage"} · ${r.next_followup_at || "now"}`),
      "No pending followups."
    ),
  ].join("\n");
}

export async function executeCeoCommand({ command, phone }) {
  const raw = String(command || "").trim();
  const intent = detectIntent(raw);
  const settings = await effectiveSettings();
  const allowed = settings.permissions.includes(intent);
  let response =
    "Unknown command. Try: today stats, hot leads, revenue, pending followups, create task, assign lead, start ads, weekly optimization report.";
  let status = "unknown";
  let payload = {};

  if (intent === "unknown") {
    const dashboard = await getDashboardCore();
    payload = { funnel: dashboard.funnel, revenue: dashboard.revenue };
  } else if (!allowed) {
    response = `Permission denied for command: ${intent}`;
    status = "denied";
  } else if (intent === "today stats") {
    const dashboard = await getDashboardCore();
    const today = {
      total_leads: dashboard.funnel.total_leads,
      qualified: dashboard.funnel.qualified_leads,
      won: dashboard.funnel.won_leads,
      conversion_rate_pct: dashboard.funnel.conversion_rate_pct,
    };
    response = waFormatToday(today);
    payload = today;
    status = "ok";
  } else if (intent === "hot leads") {
    const leads = await fetchLeads(50);
    const hot = leads
      .filter((l) => String(l.temperature || "").toLowerCase() === "hot")
      .sort((a, b) => Number(b.ai_score || 0) - Number(a.ai_score || 0))
      .slice(0, 10)
      .map((l) => ({ phone: l.phone, name: l.name || l.full_name || "Lead", score: l.ai_score || 0 }));
    response = waFormatHot(hot);
    payload = { hot_leads: hot };
    status = "ok";
  } else if (intent === "revenue") {
    const rev = await fetchRevenueMetrics();
    response = waFormatRevenue(rev);
    payload = rev;
    status = "ok";
  } else if (intent === "pending followups") {
    const rows = await dueFollowups(20);
    response = waFormatFollowups(rows);
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
    payload = { task: summary, phone: targetPhone || null };
    status = "ok";
  } else if (intent === "assign lead") {
    const targetPhone = extractPhone(raw);
    const assignee = extractAssignee(raw);
    if (!targetPhone || !assignee) {
      response = "Usage: assign lead <phone> to <owner>";
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
    payload = { queued: true };
    status = "ok";
  } else if (intent === "weekly optimization report") {
    response = await buildWeeklyOptimizationReportForFounder();
    payload = { kind: "phase_d_weekly_report" };
    status = "ok";
  }

  await logCeoCommand({
    command: raw,
    intent,
    status,
    source_phone: normPhone(phone) || null,
    response_text: response,
    payload,
    created_at: new Date().toISOString(),
  });

  return { ok: status === "ok", intent, status, response, payload };
}
