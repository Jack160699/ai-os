"use client";

import { useCallback, useRef, useState } from "react";

export function CopilotInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const debounceRef = useRef(null);

  const scheduleDebounced = useCallback((v) => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebounced(v), 120);
  }, []);

  const onChange = useCallback(
    (e) => {
      const v = e.target.value;
      setValue(v);
      scheduleDebounced(v);
    },
    [scheduleDebounced],
  );

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    setDebounced("");
  }

  return (
    <div className="shrink-0 border-t border-white/[0.08] bg-[#0a0d14]/95 p-3 backdrop-blur-md">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="Command the platform…"
          className="min-h-[56px] flex-1 resize-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-sky-500/35"
          aria-label="Copilot command"
        />
        <button
          type="button"
          disabled={disabled || !value.trim()}
          onClick={submit}
          className="rounded-xl border border-sky-400/35 bg-sky-500/25 px-3 py-2 text-[12px] font-semibold text-sky-100 transition hover:bg-sky-500/35 disabled:opacity-40"
        >
          Run
        </button>
      </div>
      {debounced && debounced.length > 2 ? (
        <p className="mt-1 text-[10px] text-slate-600">Ready · {debounced.length} chars</p>
      ) : null}
    </div>
  );
}
