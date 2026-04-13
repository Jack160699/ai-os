"use client";

import { useState } from "react";

export function TagComposer({ onAdd }) {
  const [v, setV] = useState("");
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const t = v.trim();
        if (!t) return;
        onAdd(t);
        setV("");
      }}
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Add tag"
        className="w-24 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[11px] text-white outline-none focus:border-white/[0.18]"
      />
      <button
        type="submit"
        className="rounded-lg border border-white/[0.1] px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.06]"
      >
        +
      </button>
    </form>
  );
}
