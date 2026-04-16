"use client";

import Link from "next/link";
import { useState } from "react";

const ACTIONS = [
  { href: "/admin/leads", label: "Add Lead" },
  { href: "/admin/automation", label: "Start Campaign" },
  { href: "/admin/payments", label: "Send Payment" },
];

export function QuickActions() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="hidden items-center gap-2 md:flex">
        {ACTIONS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-white/[0.14] hover:bg-white/[0.07]"
          >
            + {item.label}
          </Link>
        ))}
      </div>
      <div className="relative md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-200"
        >
          Quick actions
        </button>
        {open ? (
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/[0.1] bg-[#0c1119] p-1.5 shadow-xl">
            {ACTIONS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block rounded-lg px-2.5 py-2 text-[12px] text-slate-200 hover:bg-white/[0.06]">
                + {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

