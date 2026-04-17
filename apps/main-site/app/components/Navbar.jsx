"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StratxcelBrand } from "./StratxcelBrand";

const links = [
  { label: "Problem", href: "/#pain" },
  { label: "Transform", href: "/#transform" },
  { label: "Systems", href: "/#systems" },
  { label: "Why", href: "/#why" },
  { label: "Scenarios", href: "/#cases" },
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
    "py-1 text-[13px] font-medium tracking-[-0.015em] text-zinc-400 antialiased transition-[color,text-shadow] duration-500 ease-out hover:text-white hover:[text-shadow:0_0_18px_rgba(147,197,253,0.2)]";

  const headerSurface = scrolled
    ? "border-b border-white/[0.07] bg-black/82 shadow-[0_20px_56px_-28px_rgba(0,0,0,0.82),0_1px_0_rgba(255,255,255,0.05)_inset] backdrop-blur-2xl backdrop-saturate-150"
    : "border-b border-transparent bg-black/40 backdrop-blur-xl";

  const ctaDesktopClass =
    "sx-cta-primary inline-flex h-[40px] min-h-[44px] items-center justify-center rounded-full border border-sky-500/30 bg-[#0B0F19]/95 px-[1.25rem] text-[13px] font-semibold tracking-[-0.01em] text-[#E5E7EB] active:scale-[0.98]";

  const menuBtnClass =
    "inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/16 bg-white/[0.07] text-zinc-100 shadow-none backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300 ease-out hover:border-white/26 hover:bg-white/[0.12] active:scale-[0.97] lg:hidden";

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
            "relative mx-auto flex h-[var(--sx-nav-h)] max-w-[var(--sx-max)] items-center justify-between px-[var(--sx-gutter)] transition-[height] duration-300",
          ].join(" ")}
        >
          <StratxcelBrand tone="hero" />

          <nav
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-4 min-[1440px]:gap-6 lg:flex"
            aria-label="Primary"
          >
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={navLinkClass}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center lg:flex">
            <Link href="/#pricing" className={ctaDesktopClass}>
              Request Diagnosis
            </Link>
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className={menuBtnClass}
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
            "absolute inset-0 bg-black/55 backdrop-blur-[3px] transition-opacity duration-500 ease-out",
            open ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setOpen(false)}
        />
        <div
          id="mobile-nav-panel"
          className={[
            "absolute inset-0 flex flex-col bg-[#0B0F19] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            open ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-[var(--sx-nav-h)] items-center justify-between border-b border-white/[0.08] px-[var(--sx-gutter)]">
            <StratxcelBrand tone="hero" />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
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
          <nav className="flex flex-1 flex-col px-[var(--sx-gutter)] pt-6" aria-label="Mobile primary">
            <ul className="flex flex-col gap-0.5">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex min-h-[54px] items-center border-b border-white/[0.06] text-[18px] font-medium tracking-[-0.02em] text-zinc-200 transition-[color,letter-spacing] duration-500 ease-out hover:tracking-[-0.015em] hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto border-t border-white/[0.08] pb-8 pt-6">
              <Link
                href="/#pricing"
                onClick={() => setOpen(false)}
                className="sx-cta-primary flex h-[52px] w-full items-center justify-center rounded-full border border-sky-500/30 bg-[#0B0F19] text-[15px] font-semibold text-[#E5E7EB] active:scale-[0.99]"
              >
                Request Diagnosis Now
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
