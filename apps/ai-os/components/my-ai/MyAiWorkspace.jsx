"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getCommandChain, getAINotes, setAINotes } from "@/lib/copilotMemory";
import { getCopilotLogs } from "@/lib/copilotLogs";
import {
  addPersonalAutomation,
  addSavedPrompt,
  getFavoriteWorkflows,
  getPersonalAutomations,
  getSavedPrompts,
  removeSavedPrompt,
  toggleFavoriteWorkflow,
} from "@/lib/myAiWorkspace";

function Card({ title, hint, children }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      {hint ? <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function MyAiWorkspace() {
  const [tick, setTick] = useState(0);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [autoTitle, setAutoTitle] = useState("Morning follow-up");
  const [autoSteps, setAutoSteps] = useState("WhatsApp nudge → call → mark qualified");
  const [notes, setNotes] = useState("");

  const refresh = useCallback(() => setTick((x) => x + 1), []);

  useEffect(() => {
    queueMicrotask(() => setNotes(getAINotes()));
  }, []);

  void tick;
  const chain = getCommandChain();
  const logs = getCopilotLogs().filter((l) => String(l.user || "").toLowerCase() === "you");
  const saved = getSavedPrompts();
  const favorites = getFavoriteWorkflows();
  const automations = getPersonalAutomations();

  const runs = chain.length;
  const productivity = {
    runs,
    streak: Math.min(runs, 12),
    focus: runs > 6 ? "Operator mode" : "Exploration mode",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-slate-400">
          Personal cockpit for prompts, history, and automations. Data stays on this device until APIs connect.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-xl border border-sky-500/35 bg-sky-500/15 px-4 py-2 text-[12px] font-semibold text-sky-100 hover:bg-sky-500/25"
        >
          Jump to dashboard
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Productivity summary" hint="Lightweight signals from your recent Copilot chain.">
          <div className="space-y-2 text-[12px] text-slate-300">
            <p>
              Mode: <span className="font-semibold text-white">{productivity.focus}</span>
            </p>
            <p>
              Recent commands: <span className="font-semibold text-white">{productivity.runs}</span>
            </p>
            <p>
              Momentum score: <span className="font-semibold text-white">{productivity.streak}/12</span> (mock)
            </p>
          </div>
        </Card>
        <Card title="Notes to AI" hint="Synced with Copilot memory store.">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              setAINotes(notes);
              refresh();
            }}
            className="min-h-[120px] w-full resize-none rounded-xl border border-white/[0.1] bg-black/30 p-3 text-[12px] text-white outline-none focus:border-sky-500/35"
            placeholder="Tell Copilot how you like outputs, tone, and guardrails…"
          />
        </Card>
        <Card title="Saved prompts" hint="Pin reusable instructions.">
          <div className="flex gap-2">
            <input
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              className="flex-1 rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[12px] text-white outline-none focus:border-sky-500/35"
              placeholder="Save a prompt…"
            />
            <button
              type="button"
              className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-[12px] font-semibold text-white hover:bg-white/[0.09]"
              onClick={() => {
                if (!draftPrompt.trim()) return;
                addSavedPrompt(draftPrompt);
                setDraftPrompt("");
                refresh();
              }}
            >
              Save
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-[12px] text-slate-300">
            {saved.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2">
                <span className="min-w-0 flex-1">{s.text}</span>
                <button type="button" className="text-[11px] text-rose-300 hover:underline" onClick={() => { removeSavedPrompt(s.id); refresh(); }}>
                  Remove
                </button>
              </li>
            ))}
            {!saved.length ? <li className="text-slate-500">No saved prompts yet.</li> : null}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Recent commands" hint="Command chain memory shared with Copilot.">
          <ul className="space-y-2 text-[12px] text-slate-300">
            {chain.slice(0, 8).map((c, idx) => (
              <li key={`${c.at}-${idx}`} className="rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2">
                <p className="font-medium text-white">{c.action}</p>
                <p className="text-[11px] text-slate-500">{c.module}</p>
                <p className="mt-1 text-[11px] text-slate-400">{c.prompt}</p>
              </li>
            ))}
            {!chain.length ? <li className="text-slate-500">Run a Copilot command to populate this list.</li> : null}
          </ul>
        </Card>
        <Card title="My AI history" hint="Filtered Copilot logs for this profile (mock: local only).">
          <ul className="space-y-2 text-[12px] text-slate-300">
            {logs.slice(0, 8).map((l) => (
              <li key={l.id} className="rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white">{l.actionTaken}</p>
                  <span className="text-[10px] text-slate-500">{l.status}</span>
                </div>
                <p className="mt-1 truncate text-[11px] text-slate-400">{l.prompt}</p>
              </li>
            ))}
            {!logs.length ? <li className="text-slate-500">No personal log rows yet.</li> : null}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Favorite workflows" hint="Tag high leverage flows you reuse.">
          <div className="flex flex-wrap gap-2">
            {["Hot lead blitz", "Payment rescue", "Weekly exec brief"].map((name) => {
              const active = favorites.some((f) => f.name === name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    toggleFavoriteWorkflow(name);
                    refresh();
                  }}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                    active
                      ? "border-sky-400/40 bg-sky-500/20 text-sky-50"
                      : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-white/[0.14]"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <ul className="mt-3 space-y-2 text-[12px] text-slate-300">
            {favorites.map((f) => (
              <li key={f.id} className="rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2">
                {f.name}
              </li>
            ))}
            {!favorites.length ? <li className="text-slate-500">Tap a workflow pill to favorite it.</li> : null}
          </ul>
        </Card>
        <Card title="Personal automations" hint="Lightweight drafts until backend workflows arrive.">
          <div className="grid gap-2">
            <input
              value={autoTitle}
              onChange={(e) => setAutoTitle(e.target.value)}
              className="rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[12px] text-white outline-none focus:border-sky-500/35"
              placeholder="Title"
            />
            <textarea
              value={autoSteps}
              onChange={(e) => setAutoSteps(e.target.value)}
              className="min-h-[90px] resize-none rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[12px] text-white outline-none focus:border-sky-500/35"
              placeholder="Steps"
            />
            <button
              type="button"
              className="rounded-xl border border-sky-500/35 bg-sky-500/15 px-3 py-2 text-[12px] font-semibold text-sky-50 hover:bg-sky-500/25"
              onClick={() => {
                addPersonalAutomation({ title: autoTitle, steps: autoSteps });
                refresh();
              }}
            >
              Save automation draft
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-[12px] text-slate-300">
            {automations.map((a) => (
              <li key={a.id} className="rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2">
                <p className="font-semibold text-white">{a.title}</p>
                <p className="text-[11px] text-slate-400">{a.steps}</p>
              </li>
            ))}
            {!automations.length ? <li className="text-slate-500">No personal automations yet.</li> : null}
          </ul>
        </Card>
      </div>

      <Card title="Frequently used commands" hint="Derived from your Copilot memory chain.">
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(chain.map((c) => c.action))).slice(0, 10).map((a) => (
            <span key={a} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] text-slate-200">
              {a}
            </span>
          ))}
          {!chain.length ? <span className="text-slate-500">No signals yet.</span> : null}
        </div>
      </Card>
    </div>
  );
}
