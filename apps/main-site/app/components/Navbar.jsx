"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const links = [
  { label: "Services", href: "/#services" },
  { label: "Results", href: "/#results" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();

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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
      <div className="mx-auto flex h-[56px] max-w-6xl items-center justify-between gap-4 px-4 sm:h-[60px] sm:px-6">
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
            Book Call
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/contact"
            className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-4 text-[13px] font-semibold text-white"
          >
            Book Call
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
            <span className="flex flex-col gap-[5px]" aria-hidden>
              <motion.span
                animate={
                  open
                    ? { rotate: 45, y: 7, width: 20 }
                    : { rotate: 0, y: 0, width: 18 }
                }
                transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="block h-[2px] rounded-full bg-current"
              />
              <motion.span
                animate={open ? { opacity: 0, x: -6 } : { opacity: 1, x: 0 }}
                transition={{ duration: reduce ? 0 : 0.18 }}
                className="block h-[2px] w-[18px] rounded-full bg-current"
              />
              <motion.span
                animate={
                  open
                    ? { rotate: -45, y: -7, width: 20 }
                    : { rotate: 0, y: 0, width: 18 }
                }
                transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="block h-[2px] rounded-full bg-current"
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-menu"
            className="fixed inset-0 z-[90] md:hidden"
            initial={{ opacity: reduce ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduce ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
          >
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/25"
              onClick={() => setOpen(false)}
            />
            <motion.nav
              id="mobile-nav"
              className="absolute inset-x-0 top-[56px] border-b border-zinc-200 bg-white px-4 py-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.25)] sm:top-[60px]"
              initial={reduce ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: reduce ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <ul className="flex flex-col gap-1">
                {links.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={reduce ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduce ? 0 : 0.03 + i * 0.035, duration: reduce ? 0 : 0.2 }}
                  >
                    <Link
                      href={l.href}
                      className="flex min-h-[48px] items-center rounded-xl px-3 text-[15px] font-medium text-zinc-800 active:bg-zinc-50"
                      onClick={() => setOpen(false)}
                    >
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
