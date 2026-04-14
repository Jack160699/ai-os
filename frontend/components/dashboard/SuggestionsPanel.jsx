import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

function SuggestionIcon({ type }) {
  const cls = "h-4 w-4 text-sky-300";
  if (type === "fire") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
        <path d="M12 3c1 3-1 4 1 6s4 3 4 6a5 5 0 11-10 0c0-2 1-3 2-4 1-1 1-3 3-8z" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  if (type === "clock") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 8v4l2.5 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "alert") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
        <path d="M12 4l8 14H4l8-14z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 9v4m0 3h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "refresh") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
        <path d="M20 12a8 8 0 01-14 5m-2-5a8 8 0 0114-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M4 15v4h4M20 9V5h-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "phone") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
        <path
          d="M6 4h3l1.2 4.2-1.6 1.6a14 14 0 005.6 5.6l1.6-1.6L20 15v3a2 2 0 01-2.2 2A16 16 0 014 6.2 2 2 0 016 4z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function SuggestionsPanel({ items = [] }) {
  return (
    <SurfaceCard className="p-6" delay={0.06}>
      <p className="text-sm font-semibold tracking-tight text-white">Smart Suggestions</p>
      <p className="mt-1 text-[12px] text-slate-500">Actionable AI cues to improve conversion quality and speed.</p>

      <div className="mt-4 grid gap-3">
        {items.slice(0, 5).map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.015] p-3.5"
          >
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10">
                <SuggestionIcon type={item.icon} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-slate-100">{item.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{item.detail}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </SurfaceCard>
  );
}

