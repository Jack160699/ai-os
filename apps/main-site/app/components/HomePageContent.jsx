import { HeroCinematic } from "./HeroCinematic";
import { HomepageFinalWhatsappCta } from "./HomepageFinalWhatsappCta";
import { HomepageTrustBrief } from "./HomepageTrustBrief";

export function HomePageContent() {
  return (
    <>
      <HeroCinematic />
      <div className="sx-page-below-hero">
        <HomepageTrustBrief />
        <HomepageFinalWhatsappCta />
      </div>
    </>
  );
}
