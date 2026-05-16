"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONTACT } from "@stratxcel/config";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";
import { StratxcelBrand } from "./StratxcelBrand";

const MAIN_NAV = [
  { label: "Home", href: "/" },
  { label: "Contact", href: "/contact" },
];

const MAIN_NAV_HI = [
  { label: "Home", href: "/" },
  { label: "Baat karein", href: "/contact" },
];

function navWhatsAppHref(isHinglish) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  if (!digits) return "/#lead";
  const text = isHinglish
    ? "Hi, Stratxcel site se — 2 min baat ho sakti hai?"
    : "Hi — I'm on the Stratxcel site and want to chat.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const EXPLORE_NAV = [
  { label: "Case Studies", href: "/case-studies", external: false },
  { label: "Careers", href: "/careers", external: false },
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
  const { experience, openLanguageSelector } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const mainNav = isHinglish ? MAIN_NAV_HI : MAIN_NAV;
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
    ? "border-b border-stone-200/70 bg-[color-mix(in_srgb,var(--sx-surface-muted)_88%,transparent)] shadow-[var(--sx-shadow-md)] backdrop-blur-xl backdrop-saturate-150"
    : "border-b border-stone-200/35 bg-[color-mix(in_srgb,var(--sx-surface-muted)_72%,transparent)] shadow-[0_1px_0_rgb(255_255_255_/_0.55)_inset] backdrop-blur-xl backdrop-saturate-150";

  const mainLinkClass =
    "py-1 text-[13px] font-medium tracking-[-0.015em] text-stone-600 transition-colors duration-300 ease-out hover:text-stone-900";

  const exploreLinkClass =
    "flex min-h-[48px] items-center text-[14px] font-medium tracking-[-0.015em] text-stone-700 transition-colors duration-200 hover:text-stone-900";

  const exploreHeading = "text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500";

  const ctaDesktopClass =
    "sx-btn-wa inline-flex h-9 min-h-[40px] shrink-0 items-center justify-center rounded-full px-4 text-[12px] font-semibold tracking-[-0.01em] sm:px-[1.05rem] sm:text-[13px]";

  const exploreBtnClass =
    "inline-flex h-10 items-center gap-1.5 rounded-full border border-stone-300/90 bg-white/80 px-3.5 text-[13px] font-medium tracking-[-0.01em] text-stone-700 shadow-sm transition-[border-color,background-color,color] duration-300 hover:border-stone-400 hover:bg-white hover:text-stone-900";

  const menuBtnClass =
    "inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-stone-300/90 bg-white/90 text-stone-800 shadow-sm transition-[background-color,border-color] duration-300 hover:border-stone-400 hover:bg-white active:scale-[0.97] lg:hidden";

  return (
    <>
      <header
        className={[
          "sticky top-0 z-[100] transition-[background-color,box-shadow,border-color,backdrop-filter] duration-500 ease-out",
          headerSurface,
        ].join(" ")}
      >
        <div className="relative mx-auto flex h-[var(--sx-nav-h)] max-w-[var(--sx-max)] items-center justify-between gap-2 px-[var(--sx-gutter)] sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center lg:w-auto lg:flex-none lg:shrink-0">
            <StratxcelBrand tone="hero" compact className="min-w-0" />
          </div>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            {mainNav.map((item) => (
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
              {isHinglish ? "Aur" : "Explore"}
              <span className="text-[10px] text-stone-500" aria-hidden>
                {exploreOpen ? "▾" : "▸"}
              </span>
            </button>
            <button type="button" className={mainLinkClass} onClick={() => openLanguageSelector()}>
              {isHinglish ? "Bhasha" : "Language"}
            </button>
            <a
              href={navWhatsAppHref(isHinglish)}
              className={ctaDesktopClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
            className={[menuBtnClass, "shrink-0"].join(" ")}
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
            "absolute inset-0 bg-stone-900/20 backdrop-blur-[2px] transition-opacity duration-300",
            exploreOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setExploreOpen(false)}
        />
        <aside
          id="explore-drawer"
          className={[
            "absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-stone-200/90 bg-[var(--sx-surface)] shadow-[-12px_0_40px_-24px_rgb(28_25_23_/_0.12)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            exploreOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-[var(--sx-nav-h)] items-center justify-between border-b border-stone-200/80 px-5">
            <p className={exploreHeading}>{isHinglish ? "Aur" : "Explore"}</p>
            <button
              type="button"
              aria-label="Close"
              className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
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
                <li key={item.label} className="border-b border-stone-200/70">
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
            "absolute inset-0 bg-stone-900/25 backdrop-blur-[2px] transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setMenuOpen(false)}
        />
        <div
          id="mobile-nav-panel"
          className={[
            "absolute inset-0 flex flex-col bg-[var(--sx-surface)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            menuOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-[var(--sx-nav-h)] items-center justify-between gap-3 border-b border-stone-200/80 px-[var(--sx-gutter)]">
            <div className="min-w-0 flex-1">
              <StratxcelBrand tone="hero" compact className="min-w-0" />
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-1 flex-col overflow-y-auto px-[var(--sx-gutter)] pt-6" aria-label="Site">
            <p className={exploreHeading}>Main</p>
            <ul className="mt-3 flex flex-col gap-0.5">
              {mainNav.map((item) => (
                <li key={item.href} className="border-b border-stone-200/70">
                  <NavItem
                    href={item.href}
                    external={false}
                    className="flex min-h-[52px] items-center text-[17px] font-medium tracking-[-0.02em] text-stone-800 transition-colors hover:text-stone-950"
                    onNavigate={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </NavItem>
                </li>
              ))}
            </ul>
            <p className={`${exploreHeading} mt-10`}>{isHinglish ? "Aur" : "Explore"}</p>
            <ul className="mt-3 flex flex-col gap-0.5">
              {EXPLORE_NAV.map((item) => (
                <li key={item.label} className="border-b border-stone-200/70">
                  <NavItem
                    href={item.href}
                    external={item.external}
                    className="flex min-h-[52px] items-center text-[17px] font-medium tracking-[-0.02em] text-stone-800 transition-colors hover:text-stone-950"
                    onNavigate={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </NavItem>
                </li>
              ))}
            </ul>
            <div className="mt-auto border-t border-stone-200/80 pb-8 pt-6">
              <button
                type="button"
                className="mb-5 flex min-h-[48px] w-full items-center justify-between rounded-xl border border-stone-200/90 bg-stone-50/80 px-4 py-3 text-left text-[14px] font-medium text-stone-800 transition-colors hover:border-stone-300 hover:bg-white"
                onClick={() => {
                  openLanguageSelector();
                  setMenuOpen(false);
                }}
              >
                <span>{isHinglish ? "Bhasha" : "Language"}</span>
                <span className="text-[12px] text-stone-500">{isHinglish ? "Badlo" : "Change"}</span>
              </button>
              <a
                href={navWhatsAppHref(isHinglish)}
                onClick={() => setMenuOpen(false)}
                className="sx-btn-wa flex min-h-[52px] w-full items-center justify-center rounded-full text-[15px] font-semibold no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
