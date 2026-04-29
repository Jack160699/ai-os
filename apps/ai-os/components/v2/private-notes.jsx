"use client";

import { useEffect, useState } from "react";
import { loadPrivateNotes, savePrivateNotes } from "@/lib/v2/personalization";

export function PrivateNotes({ userKey }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setText(loadPrivateNotes(userKey));
  }, [userKey]);

  useEffect(() => {
    const id = setTimeout(() => {
      savePrivateNotes(userKey, text);
      setSaved(true);
      setTimeout(() => setSaved(false), 900);
    }, 350);
    return () => clearTimeout(id);
  }, [text, userKey]);

  return (
    <section className="rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-panel)] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.16)]">
      <div className="flex items-center justify-between gap-2">
        <p className="v2-title-tight text-sm font-semibold text-[var(--v2-text)]">Private Notes</p>
        <p className="text-[10px] text-[var(--v2-muted)]">{saved ? "Auto-saved" : "Autosave on"}</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Today's priorities, reminders, and scripts..."
        className="mt-3 h-32 w-full rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2 text-xs leading-relaxed text-[var(--v2-text)] outline-none transition focus:border-[var(--v2-focus)]"
      />
    </section>
  );
}
