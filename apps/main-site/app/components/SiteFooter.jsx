"use client";

import Link from "next/link";
import { URLS } from "@stratxcel/config";
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

const COPY = {
  en: {
    tagline: "Built for serious operators.",
    mainHead: "Main",
    exploreHead: "Explore",
    trustHead: "Trust",
    home: "Home",
    whatHelp: "What we help",
    whatsapp: "WhatsApp",
    contact: "Contact",
    trust1: "Selective engagements.",
    trust2: "India focused.",
    trust3: "Long-term thinking.",
  },
  hi: {
    tagline: "Jo apna business seriously lete hain, unke liye.",
    mainHead: "Main",
    exploreHead: "Aur padhein",
    trustHead: "Bharosa",
    home: "Home",
    whatHelp: "Kya karte hain",
    whatsapp: "WhatsApp",
    contact: "Contact",
    trust1: "Zyada project ek saath nahi.",
    trust2: "India pe dhyaan.",
    trust3: "Jaldi-jaldi nahi — seedha kaam.",
  },
};

export function SiteFooter() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;
  const c = isHinglish ? COPY.hi : COPY.en;

  return (
    <footer className="sx-footer-space">
      <div className="sx-container">
        <div className="grid gap-10 border-b border-stone-200/80 pb-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-1">
            <StratxcelBrand tone="hero" />
            <p className="mt-4 text-[13px] leading-relaxed text-stone-600">{c.tagline}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">{c.mainHead}</p>
            <div className="mt-4 flex flex-col gap-2 text-[13px] font-medium text-stone-700">
              <Link href="/" className="transition-colors duration-300 hover:text-stone-950">
                {c.home}
              </Link>
              <Link href="/#what-we-help" className="transition-colors duration-300 hover:text-stone-950">
                {c.whatHelp}
              </Link>
              <Link href="/#final-cta" className="transition-colors duration-300 hover:text-stone-950">
                {c.whatsapp}
              </Link>
              <Link href="/contact" className="transition-colors duration-300 hover:text-stone-950">
                {c.contact}
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">{c.exploreHead}</p>
            <div className="mt-4 flex flex-col gap-2 text-[13px] font-medium text-stone-700">
              <a
                href={caseStudiesUrl()}
                className="transition-colors duration-300 hover:text-stone-950"
                rel="noopener noreferrer"
                target="_blank"
              >
                Case Studies
              </a>
              <Link href="/insights" className="transition-colors duration-300 hover:text-stone-950">
                Insights
              </Link>
              <Link href="/news" className="transition-colors duration-300 hover:text-stone-950">
                News
              </Link>
              <Link href="/careers" className="transition-colors duration-300 hover:text-stone-950">
                Careers
              </Link>
              <Link href="/careers#join" className="transition-colors duration-300 hover:text-stone-950">
                Join Us
              </Link>
              <Link href="/research" className="transition-colors duration-300 hover:text-stone-950">
                Research
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">{c.trustHead}</p>
            <div className="mt-4 space-y-2 text-[13px] leading-relaxed text-stone-600">
              <p>{c.trust1}</p>
              <p>{c.trust2}</p>
              <p>{c.trust3}</p>
            </div>
          </div>
        </div>
        <div className="pt-5 text-center text-[12px] tracking-[0.02em] text-stone-500">
          © 2026 Stratxcel. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
