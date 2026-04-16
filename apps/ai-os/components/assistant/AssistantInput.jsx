"use client";

export function AssistantInput({ value, onChange, onSend, disabled }) {
  return (
    <div className="border-t border-white/[0.08] p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={2}
          placeholder="Ask anything..."
          className="min-h-[64px] flex-1 resize-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-white/[0.16]"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onSend}
          className="rounded-xl border border-sky-400/35 bg-sky-500/20 px-3 py-2 text-[12px] font-semibold text-sky-100 transition hover:bg-sky-500/30 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}

