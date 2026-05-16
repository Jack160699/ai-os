import Link from "next/link";
import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "Insights — Stratxcel",
};

export default function InsightsPage() {
  return (
    <PageLayout title="Insights" eyebrow="Explore">
      <p>Practical notes on growth, brand, and operations are on the way.</p>
      <p className="mt-6">
        <Link href="/contact" className="font-medium text-stone-800 underline-offset-4 transition-colors hover:text-stone-950 hover:underline">
          Tell us what you want to read first
        </Link>
        .
      </p>
    </PageLayout>
  );
}
