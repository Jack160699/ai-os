import { ServicePageClient } from "@/app/components/service/ServicePageClient";

export const metadata = {
  title: "Automation, WhatsApp & CRM — Stratxcel",
  description: "WhatsApp routing, CRM stages, and small automations that your team will actually use.",
};

export default function AutomationPage() {
  return <ServicePageClient slug="automation" />;
}
