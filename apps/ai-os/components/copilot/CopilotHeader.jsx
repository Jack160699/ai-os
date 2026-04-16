"use client";

import Link from "next/link";
import { roleLabel } from "@/lib/copilotPermissions";
import { getAssistantPageLabel } from "@/lib/assistantContext";

export function CopilotHeader({
  pathname,
  role,
  memoryActive,
  minimized,
  expanded,
  onMinimize,
  onExpand,
  onClose,
  onSettings,
}) {
  const page = getAssistantPageLabel(pathname);
  return (
    <header className="flex shrink-0 flex-col gap-2 border-b border-white/[0.08] bg-[#0a0d14]/90 px-3.5 py-3 backdrop-blur-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-tight text-white">StratXcel Copilot</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-400">
            Helping with <span className="text-sky-300">{page}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            <span>
              Role: <span className="font-medium text-slate-300">{roleLabel(role)}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
            {memoryActive ? (
              <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 font-medium text-sky-200">Memory active</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            title="Minimize"
            onClick={onMinimize}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-slate-300 transition hover:bg-white/[0.08]"
          >
            <span className="sr-only">Minimize</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 12h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            title={expanded ? "Contract" : "Expand"}
            onClick={onExpand}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-slate-300 transition hover:bg-white/[0.08]"
          >
            <span className="sr-only">Expand</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 3H5v4M15 3h4v4M9 21H5v-4M15 21h4v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <Link
            href="/admin/my-ai"
            title="My AI Workspace"
            onClick={onSettings}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-slate-300 transition hover:bg-white/[0.08]"
          >
            <span className="sr-only">Settings</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.54V21a2 2 0 01-4 0v-.09a1.7 1.7 0 00-1-1.54 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.54-1H3a2 2 0 010-4h.09a1.7 1.7 0 001.54-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 012.83-2.83l.06.06a1.7 1.7 0 001.87-.34 1.7 1.7 0 001-1.54V3a2 2 0 014 0v.09a1.7 1.7 0 001 1.54 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 012.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87 1.7 1.7 0 001.54 1H21a2 2 0 010 4h-.09a1.7 1.7 0 00-1.54 1z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          </Link>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-slate-300 transition hover:bg-rose-500/15 hover:text-rose-200"
          >
            <span className="sr-only">Close</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
