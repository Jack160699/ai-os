import Link from "next/link";
import { CONTACT_EMAIL } from "@stratxcel/config";
import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "Contact — Stratxcel",
};

export default function ContactPage() {
  return (
    <PageLayout title="Book Consultation" eyebrow="Next step">
      <p>
        Email{" "}
        <a
          className="font-semibold text-[var(--sx-accent)] hover:underline"
          href={`mailto:${CONTACT_EMAIL}?subject=Consultation%20Request%20%E2%80%94%20Stratxcel`}
        >
          {CONTACT_EMAIL}
        </a>{" "}
        with your business context, current bottlenecks, and the outcome you need in the next 90 days.
        We respond with a practical path forward.
      </p>
      <p className="mt-8">
        <Link
          href="/pricing"
          className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-zinc-300 bg-white px-7 text-[15px] font-semibold text-[var(--sx-navy)] transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Diagnosis session — ₹499
        </Link>
      </p>
    </PageLayout>
  );
}
