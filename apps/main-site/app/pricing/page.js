import { permanentRedirect } from "next/navigation";

/** Old /pricing URL — conversations only, no checkout. */
export default function PricingPage() {
  permanentRedirect("/contact");
}
