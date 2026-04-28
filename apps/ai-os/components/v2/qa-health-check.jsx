"use client";

import { useState } from "react";

function Row({ label, result }) {
  const ok = result?.ok !== false;
  return (
    <div className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-sm">{label}</p>
      <span className={`text-xs font-semibold ${ok ? "text-emerald-500" : "text-rose-500"}`}>{ok ? "PASS" : "FAIL"}</span>
    </div>
  );
}

export function QaHealthCheck() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runCheck() {
    setLoading(true);
    const res = await fetch("/api/v2/health", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-[var(--v2-surface)] p-4 shadow-sm dark:border-white/10">
      <button onClick={runCheck} className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm text-white">
        {loading ? "Running..." : "Run One-Click Health Check"}
      </button>
      {result ? (
        <div className="mt-4 space-y-2">
          <Row label="Auth" result={result?.checks?.auth} />
          <Row label="Database" result={result?.checks?.db} />
          <Row label="Inbox API" result={result?.checks?.inbox_api} />
          <Row label="Notifications" result={result?.checks?.notifications} />
          <Row label="Environment" result={result?.checks?.env} />
          <p className="text-xs text-[var(--v2-muted)]">Checked at: {new Date(result.checked_at).toLocaleString()}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--v2-muted)]">No health run yet.</p>
      )}
    </div>
  );
}
