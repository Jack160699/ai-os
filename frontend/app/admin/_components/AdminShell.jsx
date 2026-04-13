import Link from "next/link";
import { Logo } from "@/app/components/Logo";
import { logoutAction } from "@/app/admin/_lib/auth";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/pipeline", label: "Pipeline" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/automation", label: "Automation" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ activePath = "/admin", title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-[#090E1A] text-slate-100">
      <div className="mx-auto flex w-full max-w-[1400px] gap-4 px-3 py-3 sm:px-5 sm:py-5 lg:gap-6">
        <aside className="sticky top-3 hidden h-[calc(100vh-24px)] w-[240px] shrink-0 rounded-3xl border border-white/10 bg-[#0C1325] p-4 lg:block">
          <Logo variant="dark" />
          <nav className="mt-6 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = activePath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-white/10 text-white shadow-[0_8px_24px_rgba(69,196,255,0.10)]"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Quick Status</p>
            <p className="mt-2 text-sm text-slate-200">System healthy. Real-time ingestion active.</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-[#0C1325]">
          <header className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Admin Console</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
              </div>
              <form action={logoutAction}>
                <button className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05]">
                  Logout
                </button>
              </form>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {NAV_ITEMS.map((item) => {
                const active = activePath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition ${
                      active ? "bg-white/10 text-white" : "bg-white/[0.03] text-slate-400"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>
          <section className="p-4 sm:p-6">{children}</section>
        </div>
      </div>
    </main>
  );
}
