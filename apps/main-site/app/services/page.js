import Link from "next/link";
import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "Services — Stratxcel",
};

export default function ServicesPage() {
  return (
    <PageLayout title="Services" eyebrow="What we do">
      <p>
        We scope engagements as systems: bounded workflows, accountable owners, and measurable outcomes.
        For the full service map, start on the{" "}
        <Link href="/#services" className="font-medium text-[var(--sx-accent)] hover:underline">
          homepage
        </Link>{" "}
        or book a strategy call.
      </p>
      <p className="mt-6">
        <Link
          href="/contact"
          className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-7 text-[15px] font-semibold text-white transition hover:bg-[var(--sx-navy-soft)]"
        >
          Book Call
        </Link>
      </p>
    </PageLayout>
  );
}
