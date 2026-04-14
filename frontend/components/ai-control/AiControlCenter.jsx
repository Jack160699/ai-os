"use client";

import { useEffect, useMemo, useState } from "react";
import { CopilotLogs } from "@/components/copilot/CopilotLogs";
import { addCustomCommand } from "@/lib/copilotCustomCommands";
import { clearCopilotLogs, getCopilotLogs } from "@/lib/copilotLogs";
import { getActionQueue, clearActionQueue } from "@/lib/aiActionQueue";
import { canAccessAIControl } from "@/lib/copilotPermissions";
import { getCurrentRole } from "@/lib/roles";
import { getAINotes, setAINotes } from "@/lib/copilotMemory";

const MATRIX = [
  { action: "Navigate / read", viewer: "✓", agent: "✓", manager: "✓", finance: "✓", admin: "✓", owner: "✓" },
  { action: "Inbox / lead writes", viewer: "—", agent: "✓", manager: "✓", finance: "—", admin: "✓", owner: "✓" },
  { action: "Payments / billing", viewer: "—", agent: "—", manager: "—", finance: "✓", admin: "✓", owner: "✓" },
  { action: "Team invites", viewer: "—", agent: "—", manager: "✓", finance: "—", admin: "✓", owner: "✓" },
  { action: "Automation drafts", viewer: "—", agent: "—", manager: "✓", finance: "—", admin: "✓", owner: "✓" },
  { action: "Diagnostics / AI Control", viewer: "—", agent: "—", manager: "—", finance: "—", admin: "✓", owner: "✓" },
];

export function AiControlCenter() {
  const role = getCurrentRole();
  const allowed = useMemo(() => canAccessAIControl(role), [role]);
  const [trigger, setTrigger] = useState("/onboard-client");
  const [description, setDescription] = useState("Kickoff checklist + welcome sequence");
  const [memoryNotes, setMemoryNotes] = useState("");
  const [queueTick, setQueueTick] = useState(0);

  useEffect(() => {
    queueMicrotask(() => setMemoryNotes(getAINotes()));
  }, []);

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-[13px] text-rose-100">
        You need Admin permission for this action.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">System console</p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
            Mock operator console. Wire these controls to your audit service and job runner when APIs land.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[12px] font-semibold text-white hover:bg-white/[0.08]"
              onClick={() => {
                const n = getCopilotLogs().length;
                window.alert(`Snapshot: ${n} log rows (mock export)`);
              }}
            >
              Export snapshot
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[12px] font-semibold text-white hover:bg-white/[0.08]"
              onClick={() => {
                clearCopilotLogs();
                window.location.reload();
              }}
            >
              Clear logs
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">AI memory (local)</p>
          <textarea
            className="mt-3 min-h-[120px] w-full resize-none rounded-xl border border-white/[0.1] bg-black/30 p-3 text-[12px] text-white outline-none focus:border-sky-500/35"
            value={memoryNotes}
            onChange={(e) => setMemoryNotes(e.target.value)}
            onBlur={() => setAINotes(memoryNotes)}
            placeholder="Notes Copilot should remember on this device…"
          />
          <p className="mt-2 text-[11px] text-slate-600">Persists to local storage on blur.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Action queue</p>
            <p className="mt-1 text-[12px] text-slate-500">Recent Copilot executions (mock).</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[12px] font-semibold text-white hover:bg-white/[0.08]"
            onClick={() => {
              clearActionQueue();
              setQueueTick((x) => x + 1);
            }}
          >
            Clear queue
          </button>
        </div>
        <ul key={queueTick} className="mt-4 space-y-2 text-[12px] text-slate-300">
          {getActionQueue()
            .slice(0, 8)
            .map((q) => (
              <li key={q.id} className="rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2">
                <span className="font-medium text-white">{q.action}</span> · {q.module} ·{" "}
                <span className="text-slate-500">{q.status}</span>
                <p className="mt-1 truncate text-[11px] text-slate-500">{q.prompt}</p>
              </li>
            ))}
          {!getActionQueue().length ? <li className="text-slate-500">Queue is empty.</li> : null}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Custom command builder</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-[12px] text-slate-400">
            Trigger
            <input
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[12px] text-white outline-none focus:border-sky-500/35"
            />
          </label>
          <label className="block text-[12px] text-slate-400 sm:col-span-2">
            Description / prompt body
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[12px] text-white outline-none focus:border-sky-500/35"
            />
          </label>
        </div>
        <button
          type="button"
          className="mt-4 rounded-lg border border-sky-500/35 bg-sky-500/20 px-4 py-2 text-[12px] font-semibold text-sky-50 hover:bg-sky-500/30"
          onClick={() => {
            addCustomCommand({ trigger, description });
            setTrigger("/new-command");
            setDescription("");
          }}
        >
          Save command
        </button>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Permissions matrix</p>
        <div className="mt-3 overflow-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-500">
                <th className="py-2 pr-3 font-medium">Capability</th>
                <th className="px-2 py-2 font-medium">Viewer</th>
                <th className="px-2 py-2 font-medium">Agent</th>
                <th className="px-2 py-2 font-medium">Manager</th>
                <th className="px-2 py-2 font-medium">Finance</th>
                <th className="px-2 py-2 font-medium">Admin</th>
                <th className="px-2 py-2 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row) => (
                <tr key={row.action} className="border-b border-white/[0.04] text-slate-200">
                  <td className="py-2 pr-3">{row.action}</td>
                  <td className="px-2 py-2 text-center">{row.viewer}</td>
                  <td className="px-2 py-2 text-center">{row.agent}</td>
                  <td className="px-2 py-2 text-center">{row.manager}</td>
                  <td className="px-2 py-2 text-center">{row.finance}</td>
                  <td className="px-2 py-2 text-center">{row.admin}</td>
                  <td className="px-2 py-2 text-center">{row.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">AI usage analytics</p>
          <span className="text-[11px] text-slate-500">Mock totals refresh with logs poll</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {["24h runs", "Blocked", "Avg latency"].map((label, i) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-black/25 p-4">
              <p className="text-[11px] text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{[128, 9, 420][i]}</p>
              <p className="mt-1 text-[11px] text-slate-600">Placeholder until telemetry ships.</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Agent mode controls</p>
        <p className="mt-2 text-[12px] text-slate-500">
          Autopilot is **off** (mock). When wired, route approvals through Team policies.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
            Guardrails on
          </span>
          <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-200">
            Human confirm for writes
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Full AI logs</p>
        <div className="mt-4">
          <CopilotLogs />
        </div>
      </div>
    </div>
  );
}
