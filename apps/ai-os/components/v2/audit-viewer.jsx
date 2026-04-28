"use client";

import { useCallback, useEffect, useState } from "react";

export function AuditViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (action) params.set("action", action);
    const query = params.toString();
    const res = await fetch(`/api/v2/audit${query ? `?${query}` : ""}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || "Could not load audit logs");
      setLoading(false);
      return;
    }
    setLogs(Array.isArray(data?.logs) ? data.logs : []);
    setError("");
    setLoading(false);
  }, [q, action]);

  useEffect(() => {
    const id = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  return (
    <div className="rounded-2xl border border-black/10 bg-[var(--v2-surface)] p-4 shadow-sm dark:border-white/10">
      <div className="mb-3 grid gap-2 md:grid-cols-[1fr_220px_auto]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search actor/email/entity"
          className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Action (e.g. chat.assigned)"
          className="rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
        <button onClick={load} className="rounded-xl bg-[#2563eb] px-3 py-2 text-sm text-white">
          Filter
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
          ))}
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      {!loading && !error && logs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-[var(--v2-muted)] dark:border-white/15">
          No audit logs found for current filters.
        </p>
      ) : null}
      {!loading && logs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 text-[var(--v2-muted)] dark:border-white/10">
              <tr>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="px-3 py-2 text-xs">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{row.actor_email || "system"}</td>
                  <td className="px-3 py-2 font-medium">{row.action}</td>
                  <td className="px-3 py-2 text-[var(--v2-muted)]">
                    {row.entity_type} {row.entity_id ? `#${row.entity_id}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
