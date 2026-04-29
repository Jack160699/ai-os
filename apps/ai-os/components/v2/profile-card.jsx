"use client";

import { loadProfile, STATUS_OPTIONS } from "@/lib/v2/personalization";

export function ProfileCard({ userKey, userName, role, themeName, level, xp }) {
  const profile = loadProfile(userKey, { name: userName, role });
  const status = STATUS_OPTIONS.find((s) => s.id === profile.statusId) || STATUS_OPTIONS[0];

  return (
    <div className="mb-2 mt-1 rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-2 py-2">
      <p className="text-xs font-semibold text-[var(--v2-text)]">{profile.fullName || userName}</p>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--v2-muted)]">{role}</p>
      <p className="mt-1 text-[10px] text-[var(--v2-muted)]">Theme: {themeName}</p>
      <p className="text-[10px] text-[var(--v2-muted)]">Status: {status.label}</p>
      <p className="text-[10px] text-[var(--v2-muted)]">Level {level} · {xp} XP</p>
      <p className="mt-0.5 text-[10px] text-[color-mix(in_oklab,var(--v2-accent)_70%,var(--v2-muted))]">{profile.tagline || "Focused Today"}</p>
    </div>
  );
}
