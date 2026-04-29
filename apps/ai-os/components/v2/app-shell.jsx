"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { CreditCard, House, Inbox, Settings, Users } from "lucide-react";
import { ThemeAnalyticsTracker } from "@/components/v2/theme-analytics-tracker";
import { Sidebar } from "@/components/v2/sidebar";
import { ThemeProvider } from "@/components/v2/theme-provider";
import { Topbar } from "@/components/v2/topbar";

const MOBILE_ICONS = {
  "/v2": House,
  "/v2/inbox": Inbox,
  "/v2/payments": CreditCard,
  "/v2/team": Users,
  "/v2/settings": Settings,
};

export function AppShell({ user, role, navItems, logoutAction, children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")?.[0] ||
      "User"
    );
  }, [user]);

  const userKey = String(user?.id || user?.email || "").trim();

  return (
    <ThemeProvider userKey={userKey}>
      <ThemeAnalyticsTracker />
      <div className="v2-theme-scope min-h-screen bg-[var(--v2-bg)] text-[var(--v2-text)] transition-colors duration-200">
        <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
          {mobileOpen ? (
            <button
              type="button"
              aria-label="Close menu backdrop"
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-30 bg-black/55 lg:hidden"
            />
          ) : null}

          <Sidebar
            navItems={navItems}
            pathname={pathname}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar userKey={userKey} userName={userName} role={role} logoutAction={logoutAction} setMobileOpen={setMobileOpen} />

            <main className="v2-page-enter flex-1 bg-[var(--v2-bg)] px-4 py-5 md:px-8 md:py-7">
              <div className="mx-auto w-full max-w-[1320px]">{children}</div>
            </main>
            <nav className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-[var(--v2-border)] bg-[var(--v2-panel)]/95 p-2 backdrop-blur lg:hidden">
              {navItems.slice(0, 5).map((item) => {
                const Icon = MOBILE_ICONS[item.href] || House;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] transition active:scale-[0.98] ${
                      pathname === item.href || pathname.startsWith(`${item.href}/`) ? "text-[var(--v2-text)]" : "text-[var(--v2-muted)]"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
