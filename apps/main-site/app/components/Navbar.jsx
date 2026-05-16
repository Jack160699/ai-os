"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { URLS } from "@stratxcel/config";
import { useLanguagePreference } from "./LanguagePreferenceProvider";
import { StratxcelBrand } from "./StratxcelBrand";

const MAIN_NAV = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Contact", href: "/#contact" },
];

function caseStudiesUrl() {
  const base = String(URLS.aiMarketing || "https://stratxcel.ai").replace(/\/+$/, "");
  return `${base}/case-studies`;
}

const EXPLORE_NAV = [
  { label: "Case Studies", href: caseStudiesUrl(), external: true },
  { label: "Insights", href: "/insights", external: false },
  { label: "News", href: "/news", external: false },
  { label: "Careers", href: "/careers", external: false },
  { label: "Join Us", href: "/careers#join", external: false },
  { label: "Research", href: "/research", external: false },
];

function NavItem({ href, external, className, children, onNavigate }) {
  if (external) {
    return (
      <a
        href={href}
        className={className}
        rel="noopener noreferrer"
        target="_blank"
        onClick={onNavigate}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}

export function Navbar() {
  const { openLanguageSelector } = useLanguagePreference();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeAll = () => {
    setMenuOpen(false);
    setExploreOpen(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || exploreOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, exploreOpen]);

  useEffect(() => {
    if (!menuOpen && !exploreOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, exploreOpen]);

  const headerSurface = scrolled
    ? "border-b border-white/[0.07] bg-black/82 shadow-[0_20px_56px_-28px_rgba(0,0,0,0.82),0_1px_0_rgba(255,255,255,0.05)_inset] backdrop-blur-2xl backdrop-saturate-150"
    : "border-b border-transparent bg-black/40 backdrop-blur-xl";

  const mainLinkClass =
    "py-1 text-[13px] font-medium tracking-[-0.015em] text-zinc-400 transition-[color,text-shadow] duration-300 ease-out hover:text-white hover:[text-shadow:0_0_14px_rgba(147,197,253,0.18)]";

  const exploreLinkClass =
    "flex min-h-[48px] items-center text-[14px] font-medium tracking-[-0.015em] text-zinc-300 transition-colors duration-200 hover:text-white";

  const exploreHeading = "text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600";

  const ctaDesktopClass =
    "sx-cta-primary inline-flex h-[40px] min-h-[44px] items-center justify-center rounded-full border border-sky-500/30 bg-[#0B0F19]/95 px-[1.15rem] text-[13px] font-semibold tracking-[-0.01em] text-[#E5E7EB] active:scale-[0.98]";

  const exploreBtnClass =
    "inline-flex h-10 items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 text-[13px] font-medium tracking-[-0.01em] text-zinc-300 transition-[border-color,background-color,color] duration-300 hover:border-white/18 hover:bg-white/[0.07] hover:text-white";

  const menuBtnClass =
    "inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/16 bg-white/[0.07] text-zinc-100 backdrop-blur-md transition-[background-color,border-color] duration-300 hover:border-white/26 hover:bg-white/[0.12] active:scale-[0.97] lg:hidden";

  return (
    <>
      <header
        className={[
          "sticky top-0 z-[100] transition-[background-color,box-shadow,border-color,backdrop-filter] duration-500 ease-out",
          headerSurface,
        ].join(" ")}
      >
        <div className="relative mx-auto flex h-[var(--sx-nav-h)] max-w-[var(--sx-max)] items-center justify-between gap-3 px-[var(--sx-gutter)]">
          <StratxcelBrand tone="hero" />

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {MAIN_NAV.map((item) => (
              <NavItem key={item.href} href={item.href} external={false} className={mainLinkClass}>
                {item.label}
              </NavItem>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 sm:gap-3 lg:flex">
            <button
              type="button"
              aria-expanded={exploreOpen}
              aria-controls="explore-drawer"
              className={exploreBtnClass}
              onClick={() => setExploreOpen((v) => !v)}
            >
              Explore
              <span className="text-[10px] text-zinc-500" aria-hidden>
                {exploreOpen ? "▾" : "▸"}
              </span>
            </button>
            <button type="button" className={mainLinkClass} onClick={() => openLanguageSelector()}>
              Language
            </button>
            <Link href="/#pricing" className={ctaDesktopClass}>
              Request Diagnosis
            </Link>
          </div>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
            className={menuBtnClass}
          >
            <span className="sr-only">Menu</span>
            <span className="relative block h-5 w-5" aria-hidden>
              <span
                className={[
                  "absolute left-1/2 top-[6px] block h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-transform duration-300 ease-out",
                  menuOpen ? "translate-y-[5px] rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-1/2 top-[11px] block h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-opacity duration-200",
                  menuOpen ? "opacity-0" : "opacity-100",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-1/2 top-[16px] block h-[2px] w-4 -translate-x-1/2 rounded-full bg-current transition-transform duration-300 ease-out",
                  menuOpen ? "-translate-y-[5px] -rotate-45" : "",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Desktop + tablet: Explore drawer */}
      <div
        className={[
          "fixed inset-0 z-[130] hidden lg:block",
          exploreOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!exploreOpen}
      >
        <button
          type="button"
          tabIndex={exploreOpen ? 0 : -1}
          aria-label="Close explore menu"
          className={[
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
            exploreOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setExploreOpen(false)}
        />
        <aside
          id="explore-drawer"
          className={[
            "absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-white/[0.08] bg-[#0B0F19]/98 shadow-[-24px_0_64px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            exploreOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-[var(--sx-nav-h)] items-center justify-between border-b border-white/[0.08] px-5">
            <p className={exploreHeading}>Explore</p>
            <button
              type="button"
              aria-label="Close"
              className="rounded-full p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
              onClick={() => setExploreOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Explore">
            <ul className="flex flex-col gap-0.5">
              {EXPLORE_NAV.map((item) => (
                <li key={item.label} className="border-b border-white/[0.05]">
                  <NavItem
                    href={item.href}
                    external={item.external}
                    className={exploreLinkClass}
                    onNavigate={() => setExploreOpen(false)}
                  >
                    {item.label}
                  </NavItem>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      {/* Mobile menu */}
      <div
        className={["fixed inset-0 z-[150] lg:hidden", menuOpen ? "pointer-events-auto" : "pointer-events-none"].join(
          " "
        )}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close menu"
          className={[
            "absolute inset-0 bg-black/55 backdrop-blur-[3px] transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setMenuOpen(false)}
        />
        <div
          id="mobile-nav-panel"
          className={[
            "absolute inset-0 flex flex-col bg-[#0B0F19] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            menuOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-[var(--sx-nav-h)] items-center justify-between border-b border-white/[0.08] px-[var(--sx-gutter)]">
            <StratxcelBrand tone="hero" />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-1 flex-col overflow-y-auto px-[var(--sx-gutter)] pt-6" aria-label="Site">
            <p className={exploreHeading}>Main</p>
            <ul className="mt-3 flex flex-col gap-0.5">
              {MAIN_NAV.map((item) => (
                <li key={item.href} className="border-b border-white/[0.06]">
                  <NavItem
                    href={item.href}
                    external={false}
                    className="flex min-h-[52px] items-center text-[17px] font-medium tracking-[-0.02em] text-zinc-200 transition-colors hover:text-white"
                    onNavigate={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </NavItem>
                </li>
              ))}
            </ul>
            <p className={`${exploreHeading} mt-10`}>Explore</p>
            <ul className="mt-3 flex flex-col gap-0.5">
              {EXPLORE_NAV.map((item) => (
                <li key={item.label} className="border-b border-white/[0.06]">
                  <NavItem
                    href={item.href}
                    external={item.external}
                    className="flex min-h-[52px] items-center text-[17px] font-medium tracking-[-0.02em] text-zinc-200 transition-colors hover:text-white"
                    onNavigate={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </NavItem>
                </li>
              ))}
            </ul>
            <div className="mt-auto border-t border-white/[0.08] pb-8 pt-6">
              <button
                type="button"
                className="mb-5 flex min-h-[48px] w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left text-[14px] font-medium text-zinc-200 transition-colors hover:border-white/14 hover:bg-white/[0.05]"
                onClick={() => {
                  openLanguageSelector();
                  setMenuOpen(false);
                }}
              >
                <span>Language</span>
                <span className="text-[12px] text-zinc-500">Change</span>
              </button>
              <Link
                href="/#pricing"
                onClick={() => setMenuOpen(false)}
                className="sx-cta-primary flex h-[52px] w-full items-center justify-center rounded-full border border-sky-500/30 bg-[#0B0F19] text-[15px] font-semibold text-[#E5E7EB]"
              >
                Request Diagnosis
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
