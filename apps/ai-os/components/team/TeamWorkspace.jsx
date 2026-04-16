"use client";

import { useState } from "react";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";

const ROLE_OPTIONS = ["admin", "manager", "agent", "finance", "viewer"];

export function TeamWorkspace() {
  const [users, setUsers] = useState([
    { id: "u1", name: "Shriyansh", email: "admin@stratxcel.ai", role: "admin", status: "Active", lastLogin: "Just now" },
    { id: "u2", name: "Aarav", email: "ops@stratxcel.ai", role: "manager", status: "Active", lastLogin: "15 min ago" },
    { id: "u3", name: "Isha", email: "agent@stratxcel.ai", role: "agent", status: "Active", lastLogin: "1 hr ago" },
  ]);

  function updateRole(id, role) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  function removeUser(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="space-y-6">
      <SurfaceCard className="p-6" delay={0.04}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">Users & roles</p>
            <p className="mt-1 text-[12px] text-slate-500">Admin all access, manager ops/chats/leads, agent chats+leads, finance payments, viewer analytics.</p>
          </div>
          <button type="button" className="rounded-xl border border-sky-400/35 bg-sky-500/20 px-3.5 py-2 text-[12px] font-semibold text-sky-200 transition hover:border-sky-300/45 hover:bg-sky-500/28">
            Invite member
          </button>
        </div>
        <div className="admin-table-shell mt-4">
          <div className="admin-table-scroll">
            <table className="admin-table min-w-[740px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>
                      <select value={item.role} onChange={(e) => updateRole(item.id, e.target.value)} className="rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1 text-[12px] text-slate-200 outline-none">
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role} className="bg-[#0d1118]">
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{item.status}</td>
                    <td>{item.lastLogin}</td>
                    <td>
                      <button type="button" onClick={() => removeUser(item.id)} className="rounded-md border border-rose-400/30 bg-rose-500/12 px-2.5 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-500/18">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6" delay={0.07}>
        <p className="text-sm font-semibold tracking-tight text-white">Activity log</p>
        <ul className="mt-3 space-y-2 text-[12px] text-slate-400">
          <li className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">Role changed: Isha → agent</li>
          <li className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">Member invited: finance@stratxcel.ai</li>
          <li className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">User removed: temp@partner.com</li>
        </ul>
      </SurfaceCard>
    </div>
  );
}

