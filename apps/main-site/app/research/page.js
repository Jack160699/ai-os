import Link from "next/link";
import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "Research — Stratxcel",
};

export default function ResearchPage() {
  return (
    <PageLayout title="Research" eyebrow="Explore">
      <p>We&apos;re curating simple, honest research for operators — nothing noisy.</p>
      <p className="mt-6">
        <Link href="/contact" className="font-medium text-stone-800 underline-offset-4 transition-colors hover:text-stone-950 hover:underline">
          Request a topic
        </Link>{" "}
        or a conversation with our team.
      </p>
    </PageLayout>
  );
}
