import Link from "next/link";
import { URLS } from "@stratxcel/config";
import { StratxcelBrand } from "./StratxcelBrand";

function caseStudiesUrl() {
  const base = String(URLS.aiMarketing || "https://stratxcel.ai").replace(/\/+$/, "");
  return `${base}/case-studies`;
}

export function SiteFooter() {
  return (
    <footer className="sx-footer-space">
      <div className="sx-container">
        <div className="grid gap-10 border-b border-white/[0.08] pb-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <StratxcelBrand tone="hero" />
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-400">Built for serious operators.</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Main</p>
            <div className="mt-4 flex flex-col gap-2 text-[13px] font-medium text-zinc-300">
              <Link href="/" className="transition-colors duration-300 hover:text-white">
                Home
              </Link>
              <Link href="/#services" className="transition-colors duration-300 hover:text-white">
                Services
              </Link>
              <Link href="/#contact" className="transition-colors duration-300 hover:text-white">
                Contact
              </Link>
              <Link href="/#pricing" className="transition-colors duration-300 hover:text-white">
                Diagnosis
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Explore</p>
            <div className="mt-4 flex flex-col gap-2 text-[13px] font-medium text-zinc-300">
              <a
                href={caseStudiesUrl()}
                className="transition-colors duration-300 hover:text-white"
                rel="noopener noreferrer"
                target="_blank"
              >
                Case Studies
              </a>
              <Link href="/insights" className="transition-colors duration-300 hover:text-white">
                Insights
              </Link>
              <Link href="/news" className="transition-colors duration-300 hover:text-white">
                News
              </Link>
              <Link href="/careers" className="transition-colors duration-300 hover:text-white">
                Careers
              </Link>
              <Link href="/careers#join" className="transition-colors duration-300 hover:text-white">
                Join Us
              </Link>
              <Link href="/research" className="transition-colors duration-300 hover:text-white">
                Research
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Trust</p>
            <div className="mt-4 space-y-2 text-[13px] leading-relaxed text-zinc-400">
              <p>Selective engagements.</p>
              <p>India focused.</p>
              <p>Long-term thinking.</p>
            </div>
          </div>
        </div>
        <div className="pt-5 text-center text-[12px] tracking-[0.02em] text-zinc-500">
          © 2026 Stratxcel. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
