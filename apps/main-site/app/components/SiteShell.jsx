import { DeferredShellEffects } from "@/app/components/DeferredShellEffects";
import { LanguagePreferenceProvider } from "@/app/components/LanguagePreferenceProvider";
import { Navbar } from "@/app/components/Navbar";
import { SiteFooter } from "@/app/components/SiteFooter";
import { StickyDiagnosisCta } from "@/app/components/StickyDiagnosisCta";

export function SiteShell({ children }) {
  return (
    <LanguagePreferenceProvider>
      <div className="relative flex min-h-full flex-col bg-black text-[#E5E7EB]">
        <DeferredShellEffects />
        <Navbar />
        <main className="relative z-10 flex-1 pb-[5.5rem] lg:pb-[5.25rem]">{children}</main>
        <SiteFooter />
        <StickyDiagnosisCta />
      </div>
    </LanguagePreferenceProvider>
  );
}
