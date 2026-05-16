import { ServicePageClient } from "@/app/components/service/ServicePageClient";

export const metadata = {
  title: "Websites — Stratxcel",
  description: "Sites that load, read clean on mobile, and turn visits into messages — without corporate theatre.",
};

export default function WebsitesPage() {
  return <ServicePageClient slug="websites" />;
}
