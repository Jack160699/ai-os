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
    <main className="admin-app min-h-screen bg-[#05070c] text-slate-100">
      <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:gap-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-32px)] w-[248px] shrink-0 flex-col rounded-2xl border border-white/[0.06] bg-[#0c0f16] p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] lg:flex lg:flex-col">
          <div className="flex items-center gap-2">
            <Logo variant="dark" />
          </div>
          <nav className="mt-8 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = activePath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2.5 text-[13px] font-medium tracking-tight transition-colors duration-150 ${
                    active
                      ? "border border-white/[0.08] bg-white/[0.08] text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                      : "border border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Status</p>
            <p className="mt-2 text-[13px] leading-snug text-slate-300">Ingestion live. Dashboard refreshes on navigation.</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.06] bg-[#0c0f16] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
          <header className="border-b border-white/[0.06] px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Admin</p>
                <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em] text-white sm:text-[1.65rem]">{title}</h1>
                {subtitle ? <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-500">{subtitle}</p> : null}
              </div>
              <form action={logoutAction} className="shrink-0">
                <button
                  type="submit"
                  className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[12px] font-semibold text-slate-200 transition-colors duration-150 hover:border-white/[0.14] hover:bg-white/[0.06]"
                >
                  Log out
                </button>
              </form>
            </div>
            <nav className="mt-5 flex gap-2 overflow-x-auto pb-0.5 lg:hidden">
              {NAV_ITEMS.map((item) => {
                const active = activePath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 ${
                      active
                        ? "border-white/[0.1] bg-white/[0.08] text-white"
                        : "border-transparent bg-white/[0.03] text-slate-400 hover:border-white/[0.06] hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>
          <section className="space-y-8 p-5 sm:p-8">{children}</section>
        </div>
      </div>
    </main>
  );
}
