import Link from "next/link";
import { StratxcelBrand } from "./StratxcelBrand";

export function SiteFooter() {
  return (
    <footer className="sx-footer-space">
      <div className="sx-container">
        <div className="grid gap-8 border-b border-white/[0.08] pb-8 sm:grid-cols-3 sm:gap-6">
          <div>
            <StratxcelBrand tone="hero" />
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-400">Built for serious operators.</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Quick Links</p>
            <div className="mt-4 flex flex-col gap-2 text-[13px] font-medium text-zinc-300">
              <Link href="/about" className="transition-colors duration-300 hover:text-white">
                About
              </Link>
              <Link href="/how-we-work" className="transition-colors duration-300 hover:text-white">
                How We Work
              </Link>
              <Link href="/results" className="transition-colors duration-300 hover:text-white">
                Results
              </Link>
              <Link href="/#careers" className="transition-colors duration-300 hover:text-white">
                Careers
              </Link>
              <Link href="/#pricing" className="transition-colors duration-300 hover:text-white">
                Diagnosis
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
