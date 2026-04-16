import Link from "next/link";
import { URLS } from "@stratxcel/config";
import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "Work — Stratxcel",
};

export default function ProjectsPage() {
  return (
    <PageLayout title="Work & demos" eyebrow="Portfolio">
      <p>
        Outcomes and build quality are summarized on the homepage under{" "}
        <Link href="/#results" className="font-medium text-[var(--sx-accent)] hover:underline">
          Results
        </Link>
        . For interactive showcases, see the{" "}
        <a href={URLS.demo} className="font-medium text-[var(--sx-accent)] hover:underline">
          demo portfolio
        </a>
        .
      </p>
    </PageLayout>
  );
}
