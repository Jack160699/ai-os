"use client";

import { useEffect, useState } from "react";
import { loadProfile, saveProfile, STATUS_OPTIONS } from "@/lib/v2/personalization";

export function UserStatus({ userKey, userName, role }) {
  const [profile, setProfile] = useState(() => loadProfile(userKey, { name: userName, role }));

  useEffect(() => {
    setProfile(loadProfile(userKey, { name: userName, role }));
  }, [userKey, userName, role]);

  const selected = STATUS_OPTIONS.find((s) => s.id === profile.statusId) || STATUS_OPTIONS[0];

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] px-3 py-2 text-xs text-[var(--v2-muted)] transition hover:border-[var(--v2-focus)] active:scale-[0.98]">
        {selected.emoji} {selected.label}
      </summary>
      <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-2 shadow-xl">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.id}
            type="button"
            className="mb-1 w-full rounded-lg px-2 py-1.5 text-left text-xs text-[var(--v2-muted)] transition hover:bg-[var(--v2-elevated)] hover:text-[var(--v2-text)] active:scale-[0.99]"
            onClick={() => {
              const next = { ...profile, statusId: status.id };
              setProfile(next);
              saveProfile(userKey, next);
            }}
          >
            {status.emoji} {status.label}
          </button>
        ))}
      </div>
    </details>
  );
}
