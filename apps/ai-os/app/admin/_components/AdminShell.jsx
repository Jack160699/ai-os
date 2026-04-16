import Link from "next/link";
import { Logo } from "@/app/components/Logo";
import { AdminTopBar } from "@/app/admin/_components/AdminTopBar";
import { ADMIN_NAV } from "@/app/admin/_lib/nav";
import { logoutAction } from "@/app/admin/_lib/auth";
import { getCurrentRole, getVisibleAdminNav } from "@/lib/roles";

function navLinkClass(active) {
  if (active) {
    return "relative bg-white/[0.08] text-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] before:pointer-events-none before:absolute before:left-0 before:top-1/2 before:h-6 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-sky-400 before:content-['']";
  }
  return "relative border border-transparent text-slate-400 before:pointer-events-none before:absolute before:left-0 before:top-1/2 before:h-0 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-sky-400/0 before:opacity-0 before:transition-all before:duration-200 before:content-[''] hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-100 hover:before:h-4 hover:before:bg-sky-400/55 hover:before:opacity-100";
}

export function AdminShell({ activePath = "/admin", title, subtitle, children, headerRight = null }) {
  const role = getCurrentRole();
  const navItems = getVisibleAdminNav(ADMIN_NAV, role);

  const logoutSlot = (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-slate-200 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition-[border-color,background-color,box-shadow,color] duration-150 hover:border-white/[0.12] hover:bg-white/[0.07] hover:text-white hover:shadow-[0_10px_36px_rgba(0,0,0,0.35)]"
      >
        Log out
      </button>
    </form>
  );

  return (
    <main className="admin-app min-h-screen overflow-x-hidden bg-[#05070c] text-slate-100">
      <div className="mx-auto flex min-w-0 w-full max-w-[min(100%,1440px)] gap-5 px-4 py-4 sm:gap-6 sm:px-5 sm:py-5 lg:gap-8 lg:px-6 lg:py-6">
        <aside className="sticky top-4 hidden h-[calc(100vh-32px)] w-[min(252px,100%)] max-w-[252px] shrink-0 flex-col rounded-2xl border border-white/[0.06] bg-[#0c0f16] p-5 shadow-[var(--admin-shadow-panel)] lg:flex lg:flex-col">
          <div className="flex items-center gap-2">
            <Logo variant="dark" />
          </div>
          <nav className="mt-8 space-y-1" aria-label="Primary">
            {navItems.map((item) => {
              const active = activePath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2.5 pl-[11px] text-[13px] font-medium tracking-tight transition-[background-color,border-color,color,box-shadow] duration-150 ${navLinkClass(active)}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">System</p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
              Ingestion is live. Numbers refresh when you open a page—pull to navigate for the latest slice.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.06] bg-[#0c0f16] shadow-[var(--admin-shadow-panel)]">
          <header className="border-b border-white/[0.06] px-5 pb-5 pt-4 sm:px-7 sm:pb-6 sm:pt-5 lg:px-8">
            <AdminTopBar activePath={activePath} navItems={navItems} logoutSlot={logoutSlot} />
            <div className="mt-6 flex flex-col gap-1 sm:mt-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">Console</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-[1.7rem]">{title}</h1>
                  {subtitle ? <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-500">{subtitle}</p> : null}
                </div>
                {headerRight ? <div className="flex shrink-0 items-center">{headerRight}</div> : null}
              </div>
            </div>
          </header>
          <section className="space-y-7 p-5 sm:space-y-8 sm:p-7 lg:p-8">{children}</section>
        </div>
      </div>
    </main>
  );
}
