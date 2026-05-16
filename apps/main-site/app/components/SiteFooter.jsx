"use client";

import Link from "next/link";
import { CONTACT } from "@stratxcel/config";
import { StratxcelBrand } from "./StratxcelBrand";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

function footerWhatsAppHref(isHinglish) {
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  const text = isHinglish ? "Hi — footer se. Baat karni thi." : "Hi — saying hi from the footer.";
  const q = digits ? `?text=${encodeURIComponent(text)}` : "";
  return digits ? `https://wa.me/${digits}${q}` : "/#lead";
}

const COPY = {
  en: {
    tagline: "Small team. Clear words. Same-day replies, most days.",
    home: "Home",
    whatsapp: "WhatsApp",
    contact: "Contact",
    caseStudies: "Case studies",
    careers: "Careers",
  },
  hi: {
    tagline: "Chhota team. Seedhi baat. Zyada tar same day reply.",
    home: "Home",
    whatsapp: "WhatsApp",
    contact: "Baat",
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
      <div className="sx-container py-7 sm:py-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <div className="max-w-xs">
            <StratxcelBrand tone="hero" />
            <p className="sx-type-caption mt-3 max-w-xs leading-relaxed">{c.tagline}</p>
          </div>
          <nav
            className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium tracking-[-0.015em] text-stone-700"
            aria-label="Footer"
          >
            <Link href="/" className="transition-colors duration-300 hover:text-stone-950">
              {c.home}
            </Link>
            <a href={waHref} className="transition-colors duration-300 hover:text-stone-950" rel="noopener noreferrer" target="_blank">
              {c.whatsapp}
            </a>
            <Link href="/contact" className="transition-colors duration-300 hover:text-stone-950">
              {c.contact}
            </Link>
            <Link href="/#lead" className="transition-colors duration-300 hover:text-stone-950">
              {isHinglish ? "Form" : "Form"}
            </Link>
            <Link href="/case-studies" className="transition-colors duration-300 hover:text-stone-950">
              {c.caseStudies}
            </Link>
            <Link href="/careers" className="transition-colors duration-300 hover:text-stone-950">
              {c.careers}
            </Link>
          </nav>
        </div>
        <p className="mt-8 border-t border-stone-200/70 pt-6 text-center sx-type-caption sm:mt-9 sm:pt-7">
          © 2026 Stratxcel. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
