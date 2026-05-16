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
        <Link href="/#contact" className="font-medium text-sky-300/90 underline-offset-4 hover:underline">
          Request a topic
        </Link>{" "}
        or a conversation with our team.
      </p>
    </PageLayout>
  );
}
