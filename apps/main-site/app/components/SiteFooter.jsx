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
    <footer className="border-t border-zinc-200 bg-zinc-50/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-[var(--sx-navy)]">Stratxcel</p>
          <p className="mt-1 text-sm text-zinc-500">
            © {new Date().getFullYear()} Stratxcel. All rights reserved.
          </p>
          <p className="mt-4 text-xs text-zinc-500">
            Stratxcel OPC Private Limited | MSME | GST | Startup India | DPIIT
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
          <Link href="/#about" className="hover:text-[var(--sx-navy)]">
            About
          </Link>
          <Link href="/#how-we-work" className="hover:text-[var(--sx-navy)]">
            How We Work
          </Link>
          <Link href="/#results" className="hover:text-[var(--sx-navy)]">
            Results
          </Link>
          <Link href="/#careers" className="hover:text-[var(--sx-navy)]">
            Careers
          </Link>
          <Link href="/#pricing" className="hover:text-[var(--sx-navy)]">
            Pricing
          </Link>
          <Link href="/#contact" className="hover:text-[var(--sx-navy)]">
            Contact
          </Link>
          <a href={URLS.aiOs} className="hover:text-[var(--sx-navy)]" rel="noopener noreferrer">
            AI OS
          </a>
          <a href={URLS.demo} className="hover:text-[var(--sx-navy)]" rel="noopener noreferrer">
            Demos
          </a>
          {socials.length ? <span className="w-full" /> : null}
          {socials.map(([label, href]) => (
            <a key={label} href={href} className="hover:text-[var(--sx-navy)]" rel="noopener noreferrer">
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
