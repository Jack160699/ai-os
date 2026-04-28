"use client";

import { useProMode } from "@/components/v2/pro-mode";

export function ModeSwitch() {
  const { proMode, setProMode } = useProMode();

  return (
    <button
      type="button"
      onClick={() => setProMode(!proMode)}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
        proMode
          ? "border-[var(--v2-focus)] bg-[var(--v2-elevated)] text-[var(--v2-text)]"
          : "border-[var(--v2-border)] bg-[var(--v2-panel)] text-[var(--v2-muted)] hover:border-[var(--v2-focus)]"
      }`}
    >
      <span className="font-semibold tracking-[0.08em]">PRO MODE</span>
      <span className={`h-2.5 w-2.5 rounded-full ${proMode ? "bg-[var(--v2-text)]" : "bg-[var(--v2-muted)]"}`} />
    </button>
  );
}
