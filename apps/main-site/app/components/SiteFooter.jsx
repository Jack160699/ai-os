import Link from "next/link";
import { SOCIAL, URLS } from "@stratxcel/config";

export function SiteFooter() {
  const socials = [
    ["LinkedIn", SOCIAL.linkedin],
    ["Instagram", SOCIAL.instagram],
    ["Facebook", SOCIAL.facebook],
    ["X", SOCIAL.x],
    ["YouTube", SOCIAL.youtube],
    ["GitHub", SOCIAL.github],
  ].filter(([, href]) => href);

  return (
    <footer className="sx-footer">
      <div className="sx-container flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--sx-navy)]">Stratxcel</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            © {new Date().getFullYear()} Stratxcel. All rights reserved.
          </p>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-zinc-500">
            Stratxcel OPC Private Limited | MSME | GST | Startup India | DPIIT
          </p>
        </div>
        <div className="flex max-w-xl flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium tracking-[-0.01em] text-zinc-600">
          <Link href="/#about" className="transition-colors hover:text-[var(--sx-navy)]">
            About
          </Link>
          <Link href="/#how-we-work" className="transition-colors hover:text-[var(--sx-navy)]">
            How We Work
          </Link>
          <Link href="/#results" className="transition-colors hover:text-[var(--sx-navy)]">
            Results
          </Link>
          <Link href="/#careers" className="transition-colors hover:text-[var(--sx-navy)]">
            Careers
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-[var(--sx-navy)]">
            Pricing
          </Link>
          <Link href="/#contact" className="transition-colors hover:text-[var(--sx-navy)]">
            Contact
          </Link>
          <a href={URLS.aiOs} className="transition-colors hover:text-[var(--sx-navy)]" rel="noopener noreferrer">
            AI OS
          </a>
          <a href={URLS.demo} className="transition-colors hover:text-[var(--sx-navy)]" rel="noopener noreferrer">
            Demos
          </a>
          {socials.length ? <span className="w-full" aria-hidden /> : null}
          {socials.map(([label, href]) => (
            <a key={label} href={href} className="transition-colors hover:text-[var(--sx-navy)]" rel="noopener noreferrer">
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
