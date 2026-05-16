import { HeroCinematic } from "./HeroCinematic";
import { HomepageFinalWhatsappCta } from "./HomepageFinalWhatsappCta";
import { HomepageTrustBrief } from "./HomepageTrustBrief";
import { WhatWeHelpWithSection } from "./WhatWeHelpWithSection";

export function HomePageContent() {
  return (
    <>
      <HeroCinematic />
      <div className="sx-page-below-hero">
        <WhatWeHelpWithSection />
        <HomepageTrustBrief />
        <HomepageFinalWhatsappCta />
      </div>
    </>
  );
}
