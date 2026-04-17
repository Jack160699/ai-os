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
    <footer className="sx-footer-space">
      <div className="sx-container flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-zinc-100">Stratxcel</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            © {new Date().getFullYear()} Stratxcel. All rights reserved.
          </p>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-zinc-500">
            Stratxcel OPC Private Limited | MSME | GST | Startup India | DPIIT
          </p>
        </div>
        <div className="flex max-w-xl flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium tracking-[-0.01em] text-zinc-400">
          <Link href="/#pain" className="transition-colors duration-300 hover:text-white">
            Problem
          </Link>
          <Link href="/#consultation" className="transition-colors duration-300 hover:text-white">
            Diagnosis
          </Link>
          <Link href="/#cases" className="transition-colors duration-300 hover:text-white">
            Scenarios
          </Link>
          <Link href="/#careers" className="transition-colors duration-300 hover:text-white">
            Careers
          </Link>
          <Link href="/#pricing" className="transition-colors duration-300 hover:text-white">
            Pricing
          </Link>
          <Link href="/#contact" className="transition-colors duration-300 hover:text-white">
            Contact
          </Link>
          <a href={URLS.aiOs} className="transition-colors duration-300 hover:text-white" rel="noopener noreferrer">
            AI OS
          </a>
          <a href={URLS.demo} className="transition-colors duration-300 hover:text-white" rel="noopener noreferrer">
            Demos
          </a>
          {socials.length ? <span className="w-full" aria-hidden /> : null}
          {socials.map(([label, href]) => (
            <a key={label} href={href} className="transition-colors duration-300 hover:text-white" rel="noopener noreferrer">
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
