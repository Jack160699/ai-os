"use client";

import Link from "next/link";
import { CONTACT, URLS } from "@stratxcel/config";
import { StratxcelBrand } from "./StratxcelBrand";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

function caseStudiesUrl() {
  const base = String(URLS.aiMarketing || "https://stratxcel.ai").replace(/\/+$/, "");
  return `${base}/case-studies`;
}

function footerWhatsAppHref(isHinglish) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  const text = isHinglish ? "Hi, StratXcel footer se — connect karna tha." : "Hi — contacting from StratXcel footer.";
  const q = digits ? `?text=${encodeURIComponent(text)}` : "";
  return digits ? `https://wa.me/${digits}${q}` : "/#lead";
}

const COPY = {
  en: {
    tagline: "Websites, ads & WhatsApp — for teams who sell in the real world.",
    linksHead: "Links",
    home: "Home",
    whatsapp: "WhatsApp",
    contact: "Contact",
    caseStudies: "Case studies",
    careers: "Careers",
  },
  hi: {
    tagline: "Website, ads, WhatsApp — jahan actual customers bante hain.",
    linksHead: "Links",
    home: "Home",
    whatsapp: "WhatsApp",
    contact: "Baat karein",
    caseStudies: "Case studies",
    careers: "Careers",
  },
};

export function SiteFooter() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const c = isHinglish ? COPY.hi : COPY.en;
  const waHref = footerWhatsAppHref(isHinglish);

  return (
    <footer className="sx-footer-space">
      <div className="sx-container">
        <div className="grid gap-8 border-b border-stone-200/80 pb-8 sm:grid-cols-2 sm:gap-10 sm:pb-9">
          <div className="max-w-md">
            <StratxcelBrand tone="hero" />
            <p className="mt-3 text-[13px] leading-relaxed text-stone-600">{c.tagline}</p>
          </div>

          <div className="sm:justify-self-end sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">{c.linksHead}</p>
            <nav
              className="mt-3 flex flex-col gap-2 text-[13px] font-medium text-stone-700 sm:items-end"
              aria-label="Footer"
            >
              <Link href="/" className="transition-colors duration-200 hover:text-stone-950">
                {c.home}
              </Link>
              <a
                href={waHref}
                className="transition-colors duration-200 hover:text-stone-950"
                rel="noopener noreferrer"
                target="_blank"
              >
                {c.whatsapp}
              </a>
              <Link href="/contact" className="transition-colors duration-200 hover:text-stone-950">
                {c.contact}
              </Link>
              <a
                href={caseStudiesUrl()}
                className="transition-colors duration-200 hover:text-stone-950"
                rel="noopener noreferrer"
                target="_blank"
              >
                {c.caseStudies}
              </a>
              <Link href="/careers" className="transition-colors duration-200 hover:text-stone-950">
                {c.careers}
              </Link>
            </nav>
          </div>
        </div>
        <div className="pt-4 text-center text-[12px] tracking-[0.02em] text-stone-500 sm:pt-5">
          © 2026 Stratxcel. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
