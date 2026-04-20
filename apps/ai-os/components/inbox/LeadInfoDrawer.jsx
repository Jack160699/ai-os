"use client";

import { useState } from "react";
import { OWNER_OPTIONS } from "@/components/inbox/constants";

export function LeadInfoDrawer({
  selected,
  detail,
  mobileTab,
  owner,
  onOwnerChange,
  onAddTag,
  onAddNote,
  onArchive,
  onDelete,
}) {
  const [tagInput, setTagInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const tags = detail?.state?.tags || [];
  const notes = detail?.state?.lead_notes || [];

  return (
    <aside
      className={`flex min-h-0 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 sm:p-4 ${
        mobileTab === "intel" ? "flex" : "hidden"
      } lg:flex`}
    >
      {!selected ? (
        <p className="text-[13px] text-slate-500">Select a conversation to view lead details.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <div className="admin-pill rounded-xl p-3">
            <p className="admin-section-label">Lead Info</p>
            <label className="mt-2 flex items-center justify-between gap-2 text-[12px] text-slate-300">
              Owner
              <select value={owner} onChange={(e) => onOwnerChange(e.target.value)} className="admin-control rounded px-2 py-1 text-[12px]">
                {OWNER_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-100">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="admin-pill rounded-xl p-3">
            <p className="admin-section-label">Add Tag</p>
            <div className="mt-2 flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="New tag"
                className="admin-control min-w-0 flex-1 rounded-lg px-2 py-1.5 text-[12px] text-white outline-none placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => {
                  if (!tagInput.trim()) return;
                  onAddTag(tagInput.trim());
                  setTagInput("");
                }}
                className="admin-control rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-200"
              >
                Add
              </button>
            </div>
          </div>

          <div className="admin-pill rounded-xl p-3">
            <p className="admin-section-label">Internal Notes</p>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              rows={3}
              placeholder="Add internal note..."
              className="admin-control mt-2 w-full resize-none rounded-lg px-2 py-1.5 text-[12px] text-white outline-none placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={() => {
                if (!noteInput.trim()) return;
                onAddNote(noteInput.trim());
                setNoteInput("");
              }}
              className="mt-2 rounded-lg border border-sky-400/30 bg-sky-500/15 px-3 py-1.5 text-[11px] font-semibold text-sky-100"
            >
              Save note
            </button>
            {notes.length ? (
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-[11px] text-slate-400">
                {notes.slice(-6).map((n, i) => (
                  <li key={`${n.at || "n"}-${i}`} className="border-l border-white/[0.08] pl-2">
                    {(n.text || "").slice(0, 120)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2">
            <button type="button" onClick={onArchive} className="rounded-lg border border-amber-400/30 bg-amber-500/12 px-3 py-2 text-[11px] font-semibold text-amber-100">
              Archive
            </button>
            <button type="button" onClick={onDelete} className="rounded-lg border border-rose-400/35 bg-rose-500/12 px-3 py-2 text-[11px] font-semibold text-rose-100">
              Delete
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
