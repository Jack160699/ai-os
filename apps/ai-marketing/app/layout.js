import "./globals.css";
import Link from "next/link";
import { URLS } from "@stratxcel/config";

export const metadata = {
  title: "Stratxcel AI — Operating system for revenue teams",
  description: "Sell Stratxcel AI OS: pipelines, agents, and automation in one governed surface.",
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/book-demo", label: "Book demo" },
  { href: "/pricing", label: "Pricing" },
  { href: "/waitlist", label: "Waitlist" },
  { href: "/case-studies", label: "Case studies" },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="font-semibold text-blue-900">
              stratxcel.ai
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-700">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-blue-700">
                  {n.label}
                </Link>
              ))}
              <a href={URLS.aiOs} className="text-blue-700 hover:underline">
                Sign in
              </a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-20 border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-600">
          <a href={URLS.main} className="hover:text-blue-700">
            stratxcel.in
          </a>
          <span className="mx-2">·</span>
          <a href={URLS.demo} className="hover:text-blue-700">
            Live demos
          </a>
        </footer>
      </body>
    </html>
  );
}
