"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCopilotLogs } from "@/lib/copilotLogs";

const PAGE = 45;

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function CopilotLogs({ pollMs = 2000 }) {
  const [rows, setRows] = useState([]);
  const [visible, setVisible] = useState(PAGE);
  const scrollerRef = useRef(null);

  const refresh = useCallback(() => {
    setRows(getCopilotLogs());
  }, []);

  useEffect(() => {
    queueMicrotask(() => refresh());
    const id = window.setInterval(() => queueMicrotask(() => refresh()), pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refresh]);

  const slice = useMemo(() => rows.slice(0, visible), [rows, visible]);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) setVisible((v) => Math.min(v + PAGE, rows.length));
  }, [rows.length]);

  return (
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      className="max-h-[min(520px,60vh)] overflow-auto rounded-xl border border-white/[0.08] bg-black/20"
    >
      <table className="w-full min-w-[720px] border-collapse text-left text-[11px]">
        <thead className="sticky top-0 z-[1] bg-[#0a0d14]/95 backdrop-blur-md">
          <tr className="border-b border-white/[0.08] text-slate-500">
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">User</th>
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium">Prompt</th>
            <th className="px-3 py-2 font-medium">Action</th>
            <th className="px-3 py-2 font-medium">Module</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Ms</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((r) => (
            <tr
              key={r.id}
              className="border-b border-white/[0.04] text-slate-300"
              style={{ contentVisibility: "auto" }}
            >
              <td className="whitespace-nowrap px-3 py-2 text-slate-500">{formatTime(r.time)}</td>
              <td className="px-3 py-2">{r.user}</td>
              <td className="px-3 py-2 capitalize">{r.role}</td>
              <td className="max-w-[200px] truncate px-3 py-2 text-slate-400" title={r.prompt}>
                {r.prompt}
              </td>
              <td className="px-3 py-2">{r.actionTaken}</td>
              <td className="px-3 py-2 text-slate-500">{r.module}</td>
              <td className="px-3 py-2">
                <span
                  className={
                    r.status === "Blocked"
                      ? "rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-rose-200"
                      : "rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-emerald-200"
                  }
                >
                  {r.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-500">{r.executionMs ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!slice.length ? <p className="p-6 text-center text-[12px] text-slate-500">No AI activity logged yet.</p> : null}
    </div>
  );
}
