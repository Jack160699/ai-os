"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "7d", label: "7d" },
  { id: "live", label: "Live" },
];

function MenuIcon({ className }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon({ className }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a5 5 0 00-5 5v2.382a2 2 0 01-.553 1.382l-.724.906A1 1 0 006.447 15h11.106a1 1 0 00.724-1.33l-.724-.906A2 2 0 0117 10.382V8a5 5 0 00-5-5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 18a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function AdminTopBar({ activePath, navItems, logoutSlot }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [activePath]);

  useEffect(() => {
    if (!notifOpen) return;
    const onDoc = (e) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [notifOpen]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="admin-button-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition-[border-color,background-color,color,box-shadow] duration-150 hover:border-white/[0.12] hover:bg-white/[0.07] hover:text-white hover:shadow-[0_8px_28px_rgba(0,0,0,0.35)] lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">Open navigation</span>
            <MenuIcon />
          </button>

          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder="Search leads, phone, status…"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-3 text-[13px] text-slate-100 outline-none ring-sky-500/25 placeholder:text-slate-600 transition-[border-color,background-color,box-shadow] duration-150 focus:border-white/[0.14] focus:bg-white/[0.06] focus:ring-2 sm:h-9 sm:max-w-md sm:text-[12px]"
              aria-label="Search workspace"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 sm:ml-auto sm:flex-nowrap sm:justify-end sm:gap-3">
          <div
            className="flex flex-wrap items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]"
            role="group"
            aria-label="Time scope"
          >
            {FILTERS.map((f) => {
              const on = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={on}
                  className={`relative rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition-[color] duration-200 ${
                    on ? "text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {on ? (
                    <motion.span
                      layoutId="admin-filter-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 -z-10 rounded-lg bg-white/[0.1] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]"
                    />
                  ) : null}
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="relative z-[90] flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="admin-button-glow relative z-[91] flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 pointer-events-auto transition-all duration-200 ease-in-out hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-slate-100 hover:shadow-[0_10px_32px_rgba(0,0,0,0.38)]"
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <BellIcon />
              <span
                className="pointer-events-none absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.65)]"
                aria-hidden
              />
            </button>
            {notifOpen ? (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 top-full z-[92] mt-2 w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-white/[0.1] bg-[#0c1119] p-3 text-left text-[12px] text-slate-300 shadow-xl"
              >
                <p className="font-semibold text-white">No new alerts</p>
                <p className="mt-1 text-slate-500">You are all caught up. We will surface hot leads and payment events here.</p>
              </div>
            ) : null}
            </div>

            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-gradient-to-br from-slate-500/90 to-slate-900 text-[11px] font-semibold text-white shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
              title="Admin"
              aria-hidden
            >
              AD
            </div>

            <div className="hidden sm:block">{logoutSlot}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-white/[0.06] pt-3 sm:hidden">{logoutSlot}</div>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.div
              key="admin-drawer-backdrop"
              role="presentation"
              initial={reduce ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              key="admin-drawer"
              id="admin-mobile-nav"
              initial={reduce ? undefined : { x: -18, opacity: 0.97 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduce ? undefined : { x: -14, opacity: 0 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 36 }}
              className="fixed left-0 top-0 z-[70] flex h-full w-[min(300px,88vw)] flex-col border-r border-white/[0.08] bg-[#0a0d14] p-5 shadow-[24px_0_80px_rgba(0,0,0,0.55)] lg:hidden"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Navigate</p>
              <ul className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const active = activePath === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`relative block rounded-xl py-2.5 pl-[11px] pr-3 text-[13px] font-medium tracking-tight transition-colors duration-150 ${
                          active
                            ? "bg-white/[0.08] text-white before:pointer-events-none before:absolute before:left-0 before:top-1/2 before:h-6 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-sky-400 before:content-['']"
                            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
