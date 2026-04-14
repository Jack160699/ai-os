"use client";

import { formatFullTime, formatTime } from "@/components/chat/format";
import { INBOX_FILTERS } from "@/components/inbox/constants";

function statusFromRow(row) {
  if ((row?.unread || 0) > 0) return "waiting";
  const ts = row?.last_time ? new Date(row.last_time).getTime() : 0;
  if (ts && Date.now() - ts < 15 * 60 * 1000) return "online";
  return "replied";
}

function statusClass(status) {
  if (status === "online") return "bg-emerald-400";
  if (status === "waiting") return "bg-amber-400";
  return "bg-slate-500";
}

export function ConversationPane({
  rows,
  selected,
  onSelect,
  q,
  onQueryChange,
  filter,
  onFilterChange,
  updatedAt,
  loadingList,
  listError,
  onRetry,
  mobileTab,
}) {
  return (
    <aside
      className={`flex min-h-0 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${
        mobileTab === "list" ? "flex" : "hidden"
      } lg:flex`}
    >
      <div className="border-b border-white/[0.06] p-3 sm:p-4">
        <input
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search phone or lead..."
          className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-3 pr-3 text-[13px] text-white outline-none ring-sky-500/20 placeholder:text-slate-600 focus:border-white/[0.14] focus:ring-2"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {INBOX_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange(item.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                filter === item.id ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">
          {updatedAt ? `Updated ${formatFullTime(updatedAt)}` : "Live"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {listError ? (
          <div className="mx-2 my-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-5 text-center">
            <p className="text-[13px] leading-relaxed text-rose-100">{listError}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-lg border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-white/[0.1]"
            >
              Retry
            </button>
          </div>
        ) : loadingList && rows.length === 0 ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="admin-skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-2xl text-slate-400">
              ···
            </div>
            <p className="mt-5 text-sm font-semibold tracking-tight text-slate-200">No matching chats</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {rows.map((c) => {
              const active = selected === c.phone;
              const status = statusFromRow(c);
              return (
                <li key={c.phone}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.phone)}
                    className={`flex w-full cursor-pointer flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow,transform] duration-150 ${
                      active
                        ? "border-sky-400/35 bg-sky-500/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                        : "border-transparent bg-transparent hover:-translate-y-0.5 hover:border-white/[0.08] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-white">{c.name || "Lead"}</span>
                      <span className="shrink-0 text-[11px] text-slate-500">{formatTime(c.last_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400">
                        <span className={`h-1.5 w-1.5 rounded-full ${statusClass(status)}`} />
                        {status}
                      </span>
                      {(c.unread || 0) > 0 ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
                          {c.unread > 9 ? "9+" : c.unread}
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-[12px] leading-snug text-slate-500">{c.last_message}</p>
                    <p className="text-[11px] text-slate-600">+{c.phone}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

