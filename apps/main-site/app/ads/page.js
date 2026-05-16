import { ServicePageClient } from "@/app/components/service/ServicePageClient";

export const metadata = {
  title: "Ads — Stratxcel",
  description: "Campaigns you can read: spend, clicks, and what happens after — in normal language.",
};

export default function AdsPage() {
  return <ServicePageClient slug="ads" />;
}
