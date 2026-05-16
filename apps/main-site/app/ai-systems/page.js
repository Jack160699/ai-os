import { ServicePageClient } from "@/app/components/service/ServicePageClient";

export const metadata = {
  title: "AI systems — Stratxcel",
  description: "Internal copilots, triage helpers, and RAG on your files — with guardrails humans approve.",
};

export default function AiSystemsPage() {
  return <ServicePageClient slug="ai-systems" />;
}
