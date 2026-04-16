"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StratxcelBrand } from "./StratxcelBrand";

const links = [
  { label: "About", href: "/#about" },
  { label: "How We Work", href: "/#how-we-work" },
  { label: "Results", href: "/#results" },
  { label: "Careers", href: "/#careers" },
  { label: "Contact", href: "/#contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const navLinkClass =
    "text-[14px] font-medium tracking-tight text-zinc-600 transition-colors duration-200 hover:text-[var(--sx-navy)]";

  const headerSurface = scrolled
    ? "border-b border-zinc-200/90 bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md"
    : "border-b border-transparent bg-transparent";

  return (
    <>
      <header
        className={[
          "sticky top-0 z-[100] transition-[background-color,box-shadow,border-color,backdrop-filter] duration-500 ease-out",
          headerSurface,
        ].join(" ")}
      >
        <div
          className={[
            "relative mx-auto flex h-[56px] max-w-6xl items-center justify-between px-4 transition-[height] duration-300 sm:h-[60px] sm:px-6",
            scrolled ? "sm:h-[56px]" : "",
          ].join(" ")}
        >
          <StratxcelBrand />

          <nav
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-9 lg:flex"
            aria-label="Primary"
          >
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={navLinkClass}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center lg:flex">
            <Link
              href="/#pricing"
              className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-5 text-[14px] font-semibold tracking-tight text-white shadow-sm transition duration-200 hover:bg-[var(--sx-navy-soft)] active:scale-[0.98]"
            >
              Request Diagnosis
            </Link>
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-zinc-200/80 bg-white/70 text-zinc-800 shadow-sm backdrop-blur-sm transition hover:bg-white lg:hidden"
          >
            <span className="sr-only">Menu</span>
            <span className="relative block h-5 w-5" aria-hidden>
              <span
                className={[
                  "absolute left-1/2 top-[6px] block h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-transform duration-300 ease-out",
                  open ? "translate-y-[5px] rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-1/2 top-[11px] block h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-opacity duration-200",
                  open ? "opacity-0" : "opacity-100",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-1/2 top-[16px] block h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-transform duration-300 ease-out",
                  open ? "-translate-y-[5px] -rotate-45" : "",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Full-screen mobile menu */}
      <div
        className={[
          "fixed inset-0 z-[150] lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label="Close menu"
          className={[
            "absolute inset-0 bg-zinc-950/30 backdrop-blur-[2px] transition-opacity duration-500 ease-out",
            open ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setOpen(false)}
        />
        <div
          id="mobile-nav-panel"
          className={[
            "absolute inset-0 flex flex-col bg-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            open ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-[56px] items-center justify-between border-b border-zinc-100 px-4 sm:px-6">
            <StratxcelBrand />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <nav className="flex flex-1 flex-col px-4 pt-6 sm:px-6" aria-label="Mobile primary">
            <ul className="flex flex-col gap-0.5">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex min-h-[52px] items-center border-b border-zinc-100/80 text-[18px] font-medium tracking-[-0.02em] text-zinc-800 transition hover:text-[var(--sx-navy)]"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto border-t border-zinc-100 pb-8 pt-6">
              <Link
                href="/#pricing"
                onClick={() => setOpen(false)}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[var(--sx-navy)] text-[15px] font-semibold text-white shadow-sm transition active:scale-[0.99]"
              >
                Request Diagnosis
              </Link>
              <p className="mt-4 text-center text-[12px] leading-relaxed text-zinc-500">
                Built for serious businesses · Selective engagements · India focused
              </p>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
