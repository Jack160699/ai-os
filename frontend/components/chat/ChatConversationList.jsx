"use client";

import { formatFullTime, formatTime, tempBadgeClass } from "@/components/chat/format";

function InboxEmpty() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-2xl text-slate-400">
        ···
      </div>
      <p className="mt-5 text-sm font-semibold tracking-tight text-slate-200">Inbox is quiet</p>
      <p className="mt-2 max-w-[240px] text-[13px] leading-relaxed text-slate-500">
        When WhatsApp messages arrive, threads appear here automatically. Nothing is stored in the browser—only on
        your bot.
      </p>
    </div>
  );
}

export function ChatConversationList({
  rows,
  selected,
  onSelect,
  q,
  onQueryChange,
  temperature,
  onTemperatureChange,
  unreadOnly,
  onUnreadOnlyToggle,
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
        <div className="relative">
          <input
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search name, phone, message…"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-3 pr-3 text-[13px] text-white outline-none ring-sky-500/20 placeholder:text-slate-600 focus:border-white/[0.14] focus:ring-2"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["all", "hot", "warm", "cold"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTemperatureChange(t)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
                temperature === t ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onUnreadOnlyToggle()}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
              unreadOnly ? "bg-sky-500/20 text-sky-100" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Unread
          </button>
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
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.06]" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <InboxEmpty />
        ) : (
          <ul className="space-y-1">
            {rows.map((c) => {
              const active = selected === c.phone;
              return (
                <li key={c.phone}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.phone)}
                    className={`flex w-full flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow] ${
                      active
                        ? "border-sky-400/35 bg-sky-500/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                        : "border-transparent bg-transparent hover:border-white/[0.08] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-white">{c.name}</span>
                      <span className="shrink-0 text-[11px] text-slate-500">{formatTime(c.last_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${tempBadgeClass(c.temperature)}`}
                      >
                        {c.temperature}
                      </span>
                      {c.unread > 0 ? (
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
