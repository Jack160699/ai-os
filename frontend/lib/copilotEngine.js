import { canCopilotExecute, isAdminLike, permissionDeniedMessage } from "@/lib/copilotPermissions";
import { appendCommandMemory } from "@/lib/copilotMemory";
import { appendCopilotLog } from "@/lib/copilotLogs";
import { enqueueAiAction, clearActionQueue } from "@/lib/aiActionQueue";
import { getCustomCommands } from "@/lib/copilotCustomCommands";

function now() {
  return new Date().toISOString();
}

function logLine({ user, role, prompt, action, module, status, ms }) {
  appendCopilotLog({
    user: user || "You",
    role,
    prompt,
    actionTaken: action,
    module: module || "Copilot",
    status,
    executionMs: ms ?? 0,
  });
  enqueueAiAction({ prompt, action, module, status, role });
}

/**
 * @param {string} text
 * @param {{ role: string, pathname: string, userLabel?: string, previousPath?: string }} ctx
 * @returns {{ reply: string, navigate?: string, cards?: Array<{title:string,body:string,cta?:{label:string,href?:string}}>, blocked?: boolean, actionId?: string }}
 */
export function runCopilotCommand(text, ctx) {
  const t = String(text || "").trim();
  const role = ctx.role || "admin";
  const path = ctx.pathname || "/admin";
  const prevPath = ctx.previousPath || "";
  const user = ctx.userLabel || "You";
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();

  const finish = (payload, action, module, status) => {
    const ms = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0);
    logLine({ user, role, prompt: t, action, module, status, ms });
    if (status === "Completed") appendCommandMemory({ prompt: t, action, module, at: now() });
    return payload;
  };

  const lower = t.toLowerCase();

  const slash = getCustomCommands().find((c) => lower.startsWith(String(c.trigger || "").toLowerCase()));
  if (slash) {
    return finish(
      {
        reply: `Running **${slash.trigger}** (mock).\n\n${slash.description || "No description stored."}`,
      },
      "Custom command",
      "AI Control",
      "Completed",
    );
  }

  if (/^take me to|^open\s|^go to\s/i.test(t) || lower.includes("open payments")) {
    let href = "/admin";
    if (lower.includes("payment") || lower.includes("billing")) href = "/admin/payments";
    else if (lower.includes("team")) href = "/admin/team";
    else if (lower.includes("lead")) href = "/admin/leads";
    else if (lower.includes("inbox") || lower.includes("chat")) href = "/admin/chats";
    else if (lower.includes("analytics")) href = "/admin/analytics";
    else if (lower.includes("automation")) href = "/admin/automation";
    return finish(
      { reply: `Opening **${href}** now.`, navigate: href, undoTo: prevPath && prevPath !== href ? prevPath : undefined },
      "Navigate",
      "Shell",
      "Completed",
    );
  }

  if (/diagnose system|run diagnostics|system health/i.test(t)) {
    if (!canCopilotExecute("diagnostics", role)) {
      logLine({ user, role, prompt: t, action: "Diagnostics", module: "System", status: "Blocked", ms: 1 });
      return { reply: permissionDeniedMessage("Admin"), blocked: true };
    }
    return finish(
      {
        reply: "Diagnostics complete (mock). All core services responded within SLA.",
        cards: [
          { title: "API", body: "Dashboard API reachable" },
          { title: "Webhooks", body: "No backlog detected" },
          { title: "Queues", body: "2 low-priority jobs deferred" },
        ],
      },
      "Diagnostics",
      "System",
      "Completed",
    );
  }

  if (/improve this page|improve.*page|page ux/i.test(t)) {
    if (!canCopilotExecute("layout_change", role)) {
      logLine({ user, role, prompt: t, action: "Page improve", module: path, status: "Blocked", ms: 1 });
      return { reply: permissionDeniedMessage("Manager"), blocked: true };
    }
    return finish(
      {
        reply: `**Page improvement (mock)** for \`${path}\`\n\n- Add a primary CTA above the fold\n- Tighten vertical rhythm on cards\n- Surface “last synced” on data-heavy views`,
        cards: [{ title: "Preview", body: "Layout tweaks staged locally (no server write)." }],
      },
      "Improve page",
      "UI",
      "Completed",
    );
  }

  const payMatch = t.match(/create\s+payment\s+link|payment\s+link.*(?:for\s+)?([^\d₹]+)?\s*[₹]?\s*([\d,]+)/i);
  if (payMatch || /payment link for/i.test(t)) {
    if (!canCopilotExecute("payments", role)) {
      logLine({ user, role, prompt: t, action: "Create payment link", module: "Payments", status: "Blocked", ms: 1 });
      return { reply: permissionDeniedMessage("Finance or Admin"), blocked: true };
    }
    const m = t.match(/(?:for\s+)?([A-Za-z\s]+?)\s*[₹]?\s*([\d,]+)/);
    const name = (m && m[1] ? m[1].trim() : "Customer").slice(0, 40);
    const amt = (m && m[2] ? m[2] : "2500").replace(/,/g, "");
    const link = `https://pay.stratxcel.ai/mock-${Date.now().toString(36)}`;
    return finish(
      {
        reply: `Payment link generated (mock).`,
        navigate: "/admin/payments",
        undoTo: prevPath && prevPath !== "/admin/payments" ? prevPath : undefined,
        cards: [{ title: "Link ready", body: `${name} — ₹${amt}\n${link}`, cta: { label: "Open Payments", href: "/admin/payments" } }],
      },
      "Create payment link",
      "Payments",
      "Completed",
    );
  }

  const invMatch = t.match(/invite\s+(.+?)\s+as\s+(manager|agent|admin|finance|viewer)/i);
  if (invMatch) {
    if (!canCopilotExecute("team_invite", role)) {
      logLine({ user, role, prompt: t, action: "Invite user", module: "Team", status: "Blocked", ms: 1 });
      return { reply: permissionDeniedMessage("Manager"), blocked: true };
    }
    const who = invMatch[1].trim();
    const r = invMatch[2].toLowerCase();
    return finish(
      {
        reply: `Invite prepared for **${who}** as **${r}** (mock). Confirm in Team to send email.`,
        navigate: "/admin/team",
        undoTo: prevPath && prevPath !== "/admin/team" ? prevPath : undefined,
        cards: [{ title: "Draft invite", body: `Role: ${r}\nEmail will be sent after you confirm in Team UI.` }],
      },
      "Invite member",
      "Team",
      "Completed",
    );
  }

  if (/change dashboard order|rearrange widgets|layout mode/i.test(t)) {
    if (!canCopilotExecute("layout_change", role)) {
      logLine({ user, role, prompt: t, action: "Layout change", module: "Dashboard", status: "Blocked", ms: 1 });
      return { reply: permissionDeniedMessage("Manager"), blocked: true };
    }
    return finish(
      {
        reply: "**Layout mode (mock):** KPI row → Ops block → Analytics. Apply preview?",
        cards: [{ title: "Preview order", body: "1) Overview KPIs\n2) AI Intelligence\n3) Operations\n4) Analytics" }],
      },
      "Dashboard layout",
      "Dashboard",
      "Completed",
    );
  }

  if (/add.*lead field|schema field|company size/i.test(t)) {
    if (!canCopilotExecute("manage_leads", role)) {
      logLine({ user, role, prompt: t, action: "Schema change", module: "Leads", status: "Blocked", ms: 1 });
      return { reply: permissionDeniedMessage("Agent"), blocked: true };
    }
    return finish(
      {
        reply: "Field **company size** staged on leads schema (mock). Save when backend is wired.",
        navigate: "/admin/leads",
        undoTo: prevPath && prevPath !== "/admin/leads" ? prevPath : undefined,
      },
      "Add lead field",
      "Leads",
      "Completed",
    );
  }

  if (/whatsapp.*automation|reminder automation|nurture campaign/i.test(t)) {
    if (!canCopilotExecute("automation_write", role)) {
      logLine({ user, role, prompt: t, action: "Automation draft", module: "Automation", status: "Blocked", ms: 1 });
      return { reply: permissionDeniedMessage("Manager"), blocked: true };
    }
    return finish(
      {
        reply: "New workflow **WhatsApp Reminder** drafted (mock).",
        navigate: "/admin/automation",
        undoTo: prevPath && prevPath !== "/admin/automation" ? prevPath : undefined,
        cards: [{ title: "Draft", body: "Trigger: inbound lead\nStep 1: wait 2h\nStep 2: WhatsApp reminder" }],
      },
      "Create automation",
      "Automation",
      "Completed",
    );
  }

  if (/delete user|remove user|wipe/i.test(t)) {
    if (!isAdminLike(role)) {
      logLine({ user, role, prompt: t, action: "Delete user", module: "Team", status: "Blocked", ms: 1 });
      return { reply: permissionDeniedMessage("Admin"), blocked: true };
    }
  }

  if (/delete user/i.test(t) && isAdminLike(role)) {
    return finish({ reply: "Destructive actions require explicit confirmation in Team UI (mock safeguard)." }, "Delete user", "Team", "Blocked");
  }

  if (/analyze today|today performance|summarize today/i.test(t)) {
    return finish(
      {
        reply: "**Today (mock):** pipeline inflow is steady, response SLA is green, and paid conversions ticked up slightly vs yesterday.",
        cards: [
          { title: "Signals", body: "Hot leads: +6%\nMedian first response: 11m\nDrop-offs: pricing page" },
          { title: "Watch", body: "Late-stage deals stalling >72h in Negotiation." },
        ],
      },
      "Analyze performance",
      "Dashboard",
      "Completed",
    );
  }

  if (/weak metrics|underperforming kpi/i.test(t)) {
    return finish(
      {
        reply: "Weakest KPIs right now (mock): **reply latency** on warm leads and **show-rate** on booked demos.",
        cards: [{ title: "Fix order", body: "1) Tighten SLA alerts\n2) Add calendar nudges\n3) Reinforce proof in first reply" }],
      },
      "Weak metrics",
      "Analytics",
      "Completed",
    );
  }

  if (/rank.*hottest|hottest leads|top 10 leads/i.test(t)) {
    if (!canCopilotExecute("manage_leads", role)) {
      logLine({ user, role, prompt: t, action: "Rank leads", module: "Leads", status: "Blocked", ms: 1 });
      return { reply: permissionDeniedMessage("Agent"), blocked: true };
    }
    return finish(
      {
        reply: "Ranked hottest leads (mock) by intent + recency.",
        navigate: "/admin/leads",
        undoTo: prevPath && prevPath !== "/admin/leads" ? prevPath : undefined,
        cards: [
          { title: "#1 Priya", body: "Score 94 · WhatsApp · last touch 12m ago" },
          { title: "#2 Rahul", body: "Score 91 · Form · last touch 38m ago" },
          { title: "#3 Neha", body: "Score 88 · Callback requested" },
        ],
      },
      "Rank leads",
      "Leads",
      "Completed",
    );
  }

  if (/flush action queue|clear.*queue|action queue status/i.test(t)) {
    if (!canCopilotExecute("custom_commands", role)) {
      logLine({ user, role, prompt: t, action: "Queue clear", module: "AI Control", status: "Blocked", ms: 1 });
      return { reply: permissionDeniedMessage("Admin"), blocked: true };
    }
    clearActionQueue();
    return finish(
      {
        reply: "Action queue **cleared** (mock). Fresh jobs will enqueue from new Copilot runs.",
        navigate: "/admin/ai-control",
        undoTo: prevPath && prevPath !== "/admin/ai-control" ? prevPath : undefined,
      },
      "Clear action queue",
      "AI Control",
      "Completed",
    );
  }

  // Default conversational
  return finish(
    {
      reply:
        "I can **navigate**, **draft automations**, **create mock payment links**, **prepare invites**, and **run diagnostics**—say what you want in plain language.",
    },
    "Chat",
    "Copilot",
    "Completed",
  );
}
