import Link from "next/link";
import { CONTACT_EMAIL } from "@stratxcel/config";
import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "Careers — Stratxcel",
};

export default function CareersPage() {
  const roles = [
    { title: "Business Development Intern", slug: "business-development-intern", body: "Outreach, leads, clear follow-ups." },
    { title: "Marketing Intern", slug: "marketing-intern", body: "Campaigns, content, performance basics." },
    { title: "Operations Intern", slug: "operations-intern", body: "Coordination, execution, clean handoffs." },
    { title: "IT / Tech Intern", slug: "it-tech-intern", body: "Websites, dashboards, practical tools." },
    { title: "Finance Intern", slug: "finance-intern", body: "GST basics, invoicing, reporting." },
    { title: "HR / Talent Intern", slug: "hr-talent-intern", body: "Hiring basics, scheduling, coordination." },
    { title: "Execution Associate", slug: "founders-associate", body: "High ownership support across delivery." },
    { title: "Business Development Associate (Full-time)", slug: "business-development-associate", body: "Outbound, pipeline, coaching." },
  ];

  return (
    <PageLayout title="Careers" eyebrow="Work with us">
      <p className="text-[15px] text-[color:var(--sx-ink-secondary)]">
        Open roles for interns and one full-time track. Email your CV and the role title — we reply when we can.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {roles.map((r) => (
          <Link
            key={r.slug}
            href={`/careers/${r.slug}`}
            className="sx-card-space sx-card--interactive sx-card--lift block rounded-xl px-4 py-3.5"
          >
            <h2 className="text-[15px] font-semibold text-[var(--sx-ink)]">{r.title}</h2>
            <p className="mt-1.5 text-sm text-[color:var(--sx-ink-secondary)]">{r.body}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Application%20%E2%80%94%20Stratxcel`}
          className="sx-cta-primary inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-stone-800/25 px-7 text-[15px] font-semibold text-stone-50"
        >
          Email your application
        </a>
        <Link
          href="/contact"
          className="sx-btn-secondary-elegant inline-flex h-12 min-h-[48px] items-center justify-center rounded-full px-7 text-[15px] font-semibold"
        >
          Let&apos;s talk about your business
        </Link>
      </div>
    </PageLayout>
  );
}
