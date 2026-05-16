import { HeroCinematic } from "./HeroCinematic";
import { HomepageIndustryCases } from "./HomepageIndustryCases";
import { HomepageLeadSection } from "./HomepageLeadSection";
import { HomepageServiceIntro } from "./HomepageServiceIntro";
import { HomepageTrustBrief } from "./HomepageTrustBrief";
import { HomepageWhatWeHelp } from "./HomepageWhatWeHelp";

export function HomePageContent() {
  return (
    <>
      <HeroCinematic />
      <div className="sx-page-below-hero">
        <HomepageServiceIntro />
        <HomepageTrustBrief />
        <HomepageWhatWeHelp />
        <HomepageIndustryCases />
        <HomepageLeadSection />
      </div>
    </>
  );
}
