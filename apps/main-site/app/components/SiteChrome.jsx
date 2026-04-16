import Link from "next/link";
import { URLS } from "@stratxcel/config";

const nav = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function SiteChrome({ children }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-[#1E3A8A]">
            Stratxcel
          </Link>
          <nav className="hidden flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm font-medium text-slate-700 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-blue-700"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-slate-800/10 transition hover:bg-slate-800"
            >
              Admin
            </Link>
          </nav>
          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/admin"
                className="mt-1 block rounded-lg px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
              >
                Admin
              </Link>
            </div>
          </details>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Stratxcel. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <a className="hover:text-blue-700" href={URLS.aiOs}>
              AI OS
            </a>
            <a className="hover:text-blue-700" href={URLS.aiMarketing}>
              stratxcel.ai
            </a>
            <a className="hover:text-blue-700" href={URLS.demo}>
              Demos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
