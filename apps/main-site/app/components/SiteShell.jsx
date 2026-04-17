import { Navbar } from "@/app/components/Navbar";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SpaceFieldBackground } from "@/app/components/SpaceFieldBackground";
import { StickyDiagnosisCta } from "@/app/components/StickyDiagnosisCta";

export function SiteShell({ children }) {
  return (
    <div className="relative flex min-h-full flex-col bg-[#030306] text-zinc-200">
      <SpaceFieldBackground />
      <Navbar />
      <main className="relative z-10 flex-1 pb-[5.5rem] lg:pb-[5.25rem]">{children}</main>
      <SiteFooter />
      <StickyDiagnosisCta />
    </div>
  );
}
