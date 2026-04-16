"use client";

export function CopilotActions({ sectionTitle, actions, onPick }) {
  if (!actions?.length) return null;
  return (
    <div className="shrink-0 border-b border-white/[0.06] bg-[#080b11]/80 px-3 py-2.5 backdrop-blur-sm">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{sectionTitle}</p>
      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pr-0.5">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a.prompt)}
            className="rounded-full border border-sky-500/25 bg-gradient-to-r from-sky-500/15 to-indigo-500/10 px-3 py-1.5 text-left text-[11px] font-medium text-sky-100 shadow-[0_0_0_1px_rgba(14,165,233,0.08)_inset] transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-sky-400/40 hover:from-sky-500/25 hover:to-indigo-500/15"
            style={{ willChange: "transform" }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
