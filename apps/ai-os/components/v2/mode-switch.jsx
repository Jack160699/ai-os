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
          ? "border-[#1d4ed8]/45 bg-[#1d4ed8]/20 text-[#c8d9ff]"
          : "border-white/15 bg-white/[0.03] text-[#94a3b8] hover:border-white/25"
      }`}
    >
      <span className="font-semibold tracking-[0.08em]">PRO MODE</span>
      <span className={`h-2.5 w-2.5 rounded-full ${proMode ? "bg-[#60a5fa]" : "bg-white/30"}`} />
    </button>
  );
}
