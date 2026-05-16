import Link from "next/link";
import { AdminTopBar } from "@/app/admin/_components/AdminTopBar";
import { ADMIN_NAV } from "@/app/admin/_lib/nav";
import { logoutAction } from "@/app/admin/_lib/auth";
import { getCurrentRole, getVisibleAdminNav } from "@/lib/roles";

function navLinkClass(active) {
  if (active) {
    return "relative border border-white/[0.05] bg-white/[0.05] text-slate-100 before:pointer-events-none before:absolute before:left-0 before:top-1/2 before:h-5 before:w-px before:-translate-y-1/2 before:bg-sky-400/80 before:content-['']";
  }
  return "relative border border-transparent text-slate-500 transition-colors duration-200 hover:border-white/[0.04] hover:bg-white/[0.02] hover:text-slate-200";
}

export function AdminShell({ activePath = "/admin", title, subtitle, children, headerRight = null }) {
  const role = getCurrentRole();
  const navItems = getVisibleAdminNav(ADMIN_NAV, role);
  const primaryNavItems = navItems.filter((item) => (item.group || "primary") === "primary");
  const secondaryNavItems = navItems.filter((item) => item.group === "secondary");

  const logoutSlot = (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-lg border border-white/[0.06] bg-transparent px-3 py-2 text-[12px] font-medium text-slate-400 transition-colors duration-200 hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-slate-100"
      >
        Log out
      </button>
    </form>
  );

  return (
    <main className="admin-app min-h-screen overflow-x-hidden bg-[#05070c] pb-20 text-slate-100 sm:pb-0">
      <div className="mx-auto flex min-w-0 w-full max-w-[min(100%,1380px)] gap-4 px-3 py-3 sm:gap-5 sm:px-4 sm:py-4 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="sticky top-4 hidden h-[calc(100vh-32px)] w-[min(220px,100%)] max-w-[220px] shrink-0 flex-col border border-white/[0.06] bg-[#0c0f16] px-4 py-6 lg:flex lg:flex-col">
          <div className="border-b border-white/[0.05] pb-5">
            <Link href="/admin" className="group block outline-none transition-colors hover:text-white">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600">Stratxcel</span>
              <span className="mt-1 block text-[13px] font-medium tracking-[-0.02em] text-slate-300">Admin</span>
            </Link>
          </div>
          <nav className="mt-6 flex flex-col gap-0.5" aria-label="Primary">
            {primaryNavItems.map((item) => {
              const active = activePath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2.5 pl-[13px] text-[13px] font-normal tracking-[-0.01em] transition-[background-color,border-color,color] duration-200 ${navLinkClass(active)}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {secondaryNavItems.length ? (
            <div className="mt-6 border-t border-white/[0.05] pt-5">
              <p className="px-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600">More</p>
              <nav className="mt-2 flex flex-col gap-0.5" aria-label="Secondary">
                {secondaryNavItems.map((item) => {
                  const active = activePath === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-lg px-3 py-2 text-[12px] font-normal tracking-[-0.01em] transition-colors duration-200 ${
                        active ? "text-white" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ) : null}
          <p className="mt-auto border-t border-white/[0.05] pt-5 text-[11px] leading-relaxed text-slate-600">
            Data refreshes when you open a page.
          </p>
        </aside>

        <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.06] bg-[#0c0f16] shadow-[var(--admin-shadow-panel)]">
          <header className="border-b border-white/[0.06] px-5 pb-5 pt-4 sm:px-7 sm:pb-6 sm:pt-5 lg:px-8">
            <AdminTopBar
              activePath={activePath}
              navItems={navItems}
              primaryNavItems={primaryNavItems}
              secondaryNavItems={secondaryNavItems}
              logoutSlot={logoutSlot}
            />
            <div className="mt-6 flex flex-col gap-1 sm:mt-7">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">Console</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-[1.7rem]">{title}</h1>
                  {subtitle ? <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-500">{subtitle}</p> : null}
                </div>
                {headerRight ? <div className="flex shrink-0 items-center">{headerRight}</div> : null}
              </div>
            </div>
          </header>
          <section className="space-y-6 p-4 sm:space-y-7 sm:p-6 lg:p-7">{children}</section>
        </div>
      </div>
    </main>
  );
}
