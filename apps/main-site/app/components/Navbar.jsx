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
  const [onHero, setOnHero] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = document.getElementById("hero-cinematic");
    if (!el) {
      setOnHero(false);
      return;
    }
    const io = new IntersectionObserver(([e]) => setOnHero(e.isIntersecting), {
      threshold: 0,
      rootMargin: "-52px 0px -32% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
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

  const pastHero = !onHero;
  const headerToneHero = onHero && !open;

  const navLinkClass = headerToneHero
    ? "py-1 text-[13px] font-medium tracking-[-0.015em] text-zinc-400 antialiased transition-colors duration-200 ease-out hover:text-white"
    : "py-1 text-[13px] font-medium tracking-[-0.015em] text-zinc-600 antialiased transition-colors duration-200 ease-out hover:text-[var(--sx-navy)]";

  const headerSurface = pastHero
    ? scrolled
      ? "border-b border-zinc-200/90 bg-white/93 shadow-[0_8px_32px_-16px_rgba(15,23,42,0.1)] backdrop-blur-xl"
      : "border-b border-transparent bg-white/75 backdrop-blur-md"
    : scrolled
      ? "border-b border-white/[0.08] bg-[#010208]/88 shadow-[0_20px_56px_-24px_rgba(0,0,0,0.65),0_1px_0_rgba(255,255,255,0.07)_inset] backdrop-blur-2xl backdrop-saturate-150"
      : "border-b border-transparent bg-transparent";

  const ctaDesktopClass = headerToneHero
    ? "inline-flex h-[38px] min-h-[44px] items-center justify-center rounded-full bg-white/[0.96] px-[1.2rem] text-[13px] font-semibold tracking-[-0.01em] text-[var(--sx-navy)] shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_8px_24px_-12px_rgba(0,0,0,0.35)] ring-1 ring-white/30 transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-white hover:shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_12px_32px_-10px_rgba(37,99,235,0.25)] active:scale-[0.98]"
    : "inline-flex h-[38px] min-h-[44px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-[1.125rem] text-[13px] font-semibold tracking-[-0.01em] text-white shadow-[0_1px_2px_rgba(12,18,34,0.12)] ring-1 ring-black/[0.08] transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-[var(--sx-navy-soft)] hover:shadow-[0_4px_14px_-4px_rgba(12,18,34,0.35)] active:scale-[0.98]";

  const menuBtnClass = headerToneHero
    ? "inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-zinc-100 shadow-none backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-200 ease-out hover:border-white/30 hover:bg-white/[0.14] active:scale-[0.97] lg:hidden"
    : "inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-zinc-200/80 bg-white/70 text-zinc-800 shadow-sm backdrop-blur-sm transition-[background-color,box-shadow,border-color] duration-200 ease-out hover:border-zinc-300 hover:bg-white hover:shadow-md active:scale-[0.97] lg:hidden";

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
          <StratxcelBrand tone={headerToneHero ? "hero" : "default"} />

          <nav
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 min-[1440px]:gap-7 lg:flex"
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
          <div className="flex h-[var(--sx-nav-h)] items-center justify-between border-b border-zinc-100 px-[var(--sx-gutter)]">
            <StratxcelBrand tone="default" />
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
          <nav className="flex flex-1 flex-col px-[var(--sx-gutter)] pt-6" aria-label="Mobile primary">
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
                className="flex h-12 w-full items-center justify-center rounded-full bg-[var(--sx-navy)] text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(12,18,34,0.12)] ring-1 ring-black/[0.08] transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-[var(--sx-navy-soft)] hover:shadow-[0_6px_20px_-8px_rgba(12,18,34,0.4)] active:scale-[0.99]"
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
