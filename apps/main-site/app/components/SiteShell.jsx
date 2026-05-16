import { LanguagePreferenceProvider } from "@/app/components/LanguagePreferenceProvider";
import { Navbar } from "@/app/components/Navbar";
import { SiteFooter } from "@/app/components/SiteFooter";

export function SiteShell({ children }) {
  return (
    <LanguagePreferenceProvider>
      <div className="relative flex min-h-full flex-col bg-[var(--sx-canvas)] text-[var(--sx-ink)]">
        <Navbar />
        <main className="relative z-10 flex-1 pb-6 sm:pb-8">{children}</main>
        <SiteFooter />
      </div>
    </LanguagePreferenceProvider>
  );
}
