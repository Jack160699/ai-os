"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    const onScroll = () => setScrolled(window.scrollY > 8);
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

  const navLinkClass =
    "text-[14px] font-medium tracking-tight text-zinc-600 transition-colors hover:text-[var(--sx-navy)]";

  return (
    <header
      className={[
        "sticky top-0 z-[100] border-b transition-[background,box-shadow,border-color] duration-300",
        scrolled
          ? "border-zinc-200/90 bg-white/92 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md"
          : "border-transparent bg-white/80 backdrop-blur-sm",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 transition-[height,padding] duration-200 sm:px-6",
          scrolled ? "h-[52px] sm:h-[56px]" : "h-[56px] sm:h-[60px]",
        ].join(" ")}
      >
        <Link
          href="/"
          className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--sx-navy)]"
        >
          Stratxcel
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={navLinkClass}>
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[var(--sx-navy-soft)] active:scale-[0.98]"
          >
            Book Consultation
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/#contact"
            className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-4 text-[13px] font-semibold text-white"
          >
            Book Consultation
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm"
          >
            <span className="sr-only">Menu</span>
            <span className="relative block h-5 w-5" aria-hidden>
              <span
                className={[
                  "absolute left-1/2 top-[6px] block h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-transform duration-200",
                  open ? "translate-y-[5px] rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-1/2 top-[11px] block h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-opacity duration-150",
                  open ? "opacity-0" : "opacity-100",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-1/2 top-[16px] block h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-transform duration-200",
                  open ? "-translate-y-[5px] -rotate-45" : "",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/25"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-nav"
            className="absolute inset-x-0 top-[56px] border-b border-zinc-200 bg-white px-4 py-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.25)] sm:top-[60px]"
          >
            <ul className="flex flex-col gap-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex min-h-[48px] items-center rounded-xl px-3 text-[15px] font-medium text-zinc-800 active:bg-zinc-50"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
