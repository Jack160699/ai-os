import Link from "next/link";
import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "News — Stratxcel",
};

export default function NewsPage() {
  return (
    <PageLayout title="News" eyebrow="Explore">
      <p>Company updates and announcements will appear here.</p>
      <p className="mt-6">
        <Link href="/#contact" className="font-medium text-sky-300/90 underline-offset-4 hover:underline">
          Contact the team
        </Link>{" "}
        for press or partnerships.
      </p>
    </PageLayout>
  );
}
