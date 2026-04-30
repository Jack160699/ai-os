"use client";

import { useEffect, useState } from "react";
import { useProMode } from "@/components/v2/pro-mode";
import { useThemeStudio } from "@/components/v2/theme-provider";

const ROLES = ["super_admin", "manager", "support", "finance"];
const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

function stableMetric(value, min, max) {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return min + (hash % (max - min + 1));
}

export function TeamManager() {
  const { proMode } = useProMode();
  const { immersion } = useThemeStudio();
  const tm = immersion.team;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "support",
  });
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v2/team", { cache: "no-store" });
      if (!res) return null;
      const data = await res.json().catch(() => ({}));
      console.log("TEAM API:", data);
      if (!res.ok) throw new Error(data?.message || data?.error || "Could not load team");
      const team = data?.team || [];
      setUsers(safeArray(team));
    } catch (err) {
      setError(err.message || "Could not load team");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createUser(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/v2/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || data?.error || "Could not create user");
        return;
      }
      setCreateForm({ full_name: "", email: "", password: "", role: "support" });
      await loadUsers();
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(userId, patch) {
    const res = await fetch(`/api/v2/team/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || "Could not update user");
      return false;
    }
    return true;
  }

  async function resetPassword(userId) {
    const password = window.prompt("Enter new password (min 8 chars)");
    if (!password) return;
    const res = await fetch(`/api/v2/team/${encodeURIComponent(userId)}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || "Could not reset password");
      return;
    }
    setError("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--v2-muted)]">{tm.blurb}</p>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="rounded-xl border border-[color-mix(in_oklab,var(--v2-accent)_40%,var(--v2-border))] bg-[color-mix(in_oklab,var(--v2-accent)_12%,var(--v2-elevated))] px-3 py-2 text-xs font-medium text-[var(--v2-text)] transition hover:border-[var(--v2-accent)]"
        >
          {tm.inviteUser}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0f131a] shadow-[0_8px_30px_rgba(0,0,0,0.22)]">
        {loading ? <p className="p-4 text-sm text-[var(--v2-muted)]">{tm.loading}</p> : null}
        {error ? <p className="p-4 text-sm text-rose-500">{error}</p> : null}
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 text-[var(--v2-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
              {proMode ? <th className="px-4 py-3 font-medium">Ops</th> : null}
            </tr>
          </thead>
          <tbody>
            {safeArray(users).map((user) => (
              <tr key={user.id} className="border-b border-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-white/[0.03] text-[11px]">
                      {String(user.full_name || user.email || "U").slice(0, 1).toUpperCase()}
                    </span>
                    <span>{user.full_name || "User"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--v2-muted)]">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs"
                    onChange={async (e) => {
                      const role = e.target.value;
                      const ok = await updateUser(user.id, { role });
                      if (ok) {
                        setUsers((prev) => safeArray(prev).map((row) => (row.id === user.id ? { ...row, role } : row)));
                      }
                    }}
                  >
                    {safeArray(ROLES).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className={`rounded-lg border px-2 py-1 text-xs ${
                      user.is_active
                        ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                        : "border-slate-400/30 bg-slate-500/15 text-slate-200"
                    }`}
                    onClick={async () => {
                      const is_active = !user.is_active;
                      const ok = await updateUser(user.id, { is_active });
                      if (ok) {
                        setUsers((prev) => safeArray(prev).map((row) => (row.id === user.id ? { ...row, is_active } : row)));
                      }
                    }}
                  >
                    {user.is_active ? "active" : "inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => resetPassword(user.id)}
                    className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs"
                  >
                    Reset Password
                  </button>
                </td>
                {proMode ? (
                  <td className="px-4 py-3 text-[11px] text-[#94a3b8]">
                    Resp {stableMetric(user.id, 2, 16)}m · Load {stableMetric(user.email, 1, 7)}
                  </td>
                ) : null}
              </tr>
            ))}
            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={proMode ? 6 : 5} className="px-4 py-5 text-sm text-[var(--v2-muted)]">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {inviteOpen ? (
        <aside className="rounded-2xl border border-white/10 bg-[#0f131a] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.22)]">
        <h2 className="text-base font-semibold">Create User</h2>
        <form className="mt-3 space-y-3" onSubmit={createUser}>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
            placeholder="Full name"
            value={createForm.full_name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, full_name: e.target.value }))}
          />
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
            type="email"
            placeholder="Email address"
            required
            value={createForm.email}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
            type="password"
            minLength={8}
            required
            placeholder="Temporary password"
            value={createForm.password}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <select
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
            value={createForm.role}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
          >
            {safeArray(ROLES).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button
            disabled={saving}
            className="w-full rounded-xl border border-[#3b82f6]/35 bg-[#3b82f6]/16 px-3 py-2 text-sm font-medium text-white hover:bg-[#3b82f6]/22 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save User"}
          </button>
          <button
            type="button"
            onClick={() => setInviteOpen(false)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[var(--v2-muted)] transition hover:bg-white/[0.06]"
          >
            Cancel
          </button>
        </form>
      </aside>
      ) : null}
    </div>
  );
}
