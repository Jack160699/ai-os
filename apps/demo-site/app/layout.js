import "./globals.css";
import Link from "next/link";
import { URLS } from "@stratxcel/config";

export const metadata = {
  title: "Stratxcel Demos",
  description: "Portfolio showcases — hospitality, asset management, consulting, and upcoming builds.",
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/hotel-website", label: "Hotel" },
  { href: "/honest-asset-management", label: "Asset management" },
  { href: "/premium-consulting", label: "Consulting" },
  { href: "/future-projects", label: "Future" },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/10 bg-black/40 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="font-semibold text-white">
              demo.stratxcel.in
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm text-blue-100">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-white">
                  {n.label}
                </Link>
              ))}
              <a href={URLS.main} className="text-blue-300 hover:text-white">
                Main site
              </a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
