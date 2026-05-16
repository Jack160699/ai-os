"use client";

import Link from "next/link";
import { COMPANY, CONTACT, SOCIAL } from "@stratxcel/config";
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
    tagline: "Small team. Plain talk. Same-day replies, most days.",
    closing: "Online work shouldn’t feel this confusing.",
    home: "Home",
    whatsapp: "WhatsApp",
    contact: "Contact",
    work: "Work",
    caseStudies: "Case studies",
    careers: "Careers",
    services: "Services",
    emailLabel: "Email",
    legalNote: "Registered company · invoices & contracts handled properly.",
    phoneLabel: "Phone",
  },
  hi: {
    tagline: "Chhota team. Seedhi baat. Zyada tar same day reply.",
    closing: "Seedhi baat zyada kaam karti hai.",
    home: "Home",
    whatsapp: "WhatsApp",
    contact: "Baat",
    work: "Kaam",
    caseStudies: "Case studies",
    careers: "Careers",
    services: "Services",
    emailLabel: "Email",
    legalNote: "Registered company — kaam official tarike se.",
    phoneLabel: "Phone",
  },
};

const SERVICE_LINKS = [
  { href: "/websites", en: "Websites", hi: "Websites" },
  { href: "/ads", en: "Ads", hi: "Ads" },
  { href: "/automation", en: "Automation", hi: "Automation" },
  { href: "/mobile-apps", en: "Apps", hi: "Apps" },
  { href: "/ai-systems", en: "AI", hi: "AI" },
  { href: "/branding", en: "Branding", hi: "Branding" },
];

export function SiteFooter() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const c = isHinglish ? COPY.hi : COPY.en;
  const waHref = footerWhatsAppHref(isHinglish);
  const mailHref = `mailto:${CONTACT.email}`;
  const digits = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");

  return (
    <footer className="sx-footer-space">
      <div className="sx-container py-8 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <StratxcelBrand tone="hero" />
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
              {COMPANY.legalName}
            </p>
            <p className="mt-2 text-[12px] text-stone-600">{COMPANY.location}</p>
            <p className="mt-4 text-[13px] font-medium text-stone-700">{COMPANY.line}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-stone-600">{COMPANY.subline}</p>
            <p className="sx-type-caption mt-4 max-w-sm leading-relaxed">{c.tagline}</p>
            <p className="mt-3 max-w-sm text-[11px] leading-relaxed text-stone-500">{c.legalNote}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5 lg:col-start-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{c.services}</p>
              <ul className="mt-3 flex flex-col gap-2 text-[13px] font-medium text-stone-700">
                {SERVICE_LINKS.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className="transition-colors hover:text-stone-950">
                      {isHinglish ? s.hi : s.en}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Menu</p>
              <nav className="mt-3 flex flex-col gap-2 text-[13px] font-medium text-stone-700" aria-label="Footer">
                <Link href="/" className="transition-colors hover:text-stone-950">
                  {c.home}
                </Link>
                <Link href="/work" className="transition-colors hover:text-stone-950">
                  {c.work}
                </Link>
                <Link href="/case-studies" className="transition-colors hover:text-stone-950">
                  {c.caseStudies}
                </Link>
                <Link href="/contact" className="transition-colors hover:text-stone-950">
                  {c.contact}
                </Link>
                <Link href="/#lead" className="transition-colors hover:text-stone-950">
                  Form
                </Link>
                <Link href="/careers" className="transition-colors hover:text-stone-950">
                  {c.careers}
                </Link>
                <a href={waHref} className="transition-colors hover:text-stone-950" rel="noopener noreferrer" target="_blank">
                  {c.whatsapp}
                </a>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{c.emailLabel}</p>
            <a
              href={mailHref}
              className="mt-2 inline-block text-[13px] font-medium text-stone-800 underline decoration-stone-300/85 underline-offset-[4px] transition-colors hover:text-stone-950"
            >
              {CONTACT.email}
            </a>
            {digits ? (
              <p className="mt-3 text-[12px] text-stone-600">
                WhatsApp:{" "}
                <a href={waHref} className="font-medium text-stone-800 underline decoration-stone-300/80" rel="noopener noreferrer" target="_blank">
                  {CONTACT.whatsapp}
                </a>
              </p>
            ) : null}
            <p className="mt-2 text-[12px] text-stone-600">
              <span className="font-medium text-stone-500">{c.phoneLabel}: </span>
              <a
                href={`tel:${CONTACT.phone}`}
                className="font-medium text-stone-800 underline decoration-stone-300/80 underline-offset-2 transition-colors hover:text-stone-950"
              >
                {CONTACT.phone}
              </a>
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium text-stone-700">
              {SOCIAL.instagram ? (
                <a href={SOCIAL.instagram} className="transition-colors hover:text-stone-950" rel="noopener noreferrer" target="_blank">
                  Instagram
                </a>
              ) : null}
              {SOCIAL.linkedin ? (
                <a href={SOCIAL.linkedin} className="transition-colors hover:text-stone-950" rel="noopener noreferrer" target="_blank">
                  LinkedIn
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-[40ch] text-center text-[14px] font-medium leading-snug tracking-[-0.015em] text-stone-700 sm:max-w-[44ch] sm:text-[15px]">
          {c.closing}
        </p>
        <p className="mt-8 border-t border-stone-200/70 pt-6 text-center text-[11px] leading-relaxed text-stone-500 sm:pt-7">
          © 2026 {COMPANY.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
