import { HeroCinematic } from "./HeroCinematic";
import { HomepageIndustryCases } from "./HomepageIndustryCases";
import { HomepageLeadSection } from "./HomepageLeadSection";
import { HomepageTrustBrief } from "./HomepageTrustBrief";
import { HomepageWhatWeHelp } from "./HomepageWhatWeHelp";

export function HomePageContent() {
  return (
    <>
      <HeroCinematic />
      <div className="sx-page-below-hero">
        <HomepageTrustBrief />
        <HomepageWhatWeHelp />
        <HomepageIndustryCases />
        <HomepageLeadSection />
      </div>
    </>
  );
}
