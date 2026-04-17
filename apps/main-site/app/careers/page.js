import Link from "next/link";
import { CONTACT_EMAIL } from "@stratxcel/config";
import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "Careers & Internships — Stratxcel",
};

export default function CareersPage() {
  const roles = [
    { title: "Business Development Intern", slug: "business-development-intern", body: "Sales communication, lead generation, and growth systems." },
    { title: "Marketing Intern", slug: "marketing-intern", body: "Brand campaigns, content systems, and performance basics." },
    { title: "Operations Intern", slug: "operations-intern", body: "Workflow systems, execution discipline, and coordination." },
    { title: "IT / Tech Intern", slug: "it-tech-intern", body: "Web systems, dashboards, automation tools, and AI workflows." },
    { title: "Finance Intern", slug: "finance-intern", body: "GST basics, invoicing, reporting, and finance operations." },
    { title: "HR / Talent Intern", slug: "hr-talent-intern", body: "Hiring basics, people systems, and team coordination." },
    { title: "Founder's Associate", slug: "founders-associate", body: "Cross-functional execution support across strategy, ops, and delivery." },
    { title: "Business Development Associate (Full-time)", slug: "business-development-associate", body: "Own outbound + pipeline discipline with clear targets and coaching." },
  ];

  return (
    <PageLayout title="Build real-world skills, not just certificates." eyebrow="Careers & internships">
      <p>
        At Stratxcel, students and freshers gain practical business experience, real project exposure,
        mentorship, field learning, and industry discipline.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {roles.map((r) => (
          <Link
            key={r.slug}
            href={`/careers/${r.slug}`}
            className="sx-card-space sx-card--interactive sx-card--lift block rounded-xl px-4 py-4"
          >
            <h2 className="text-[15px] font-semibold text-zinc-100">{r.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{r.body}</p>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-zinc-500">
        Eligible: BBA, MBA, BCA, MCA, B.Com, M.Com, CS, IT, Sales, Commerce, and serious learners.
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        Benefits: Real work, mentorship, live projects, certificates, professional growth, and industry readiness.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Internship%20Application%20%E2%80%94%20Stratxcel`}
          className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-white/12 bg-white px-7 text-[15px] font-semibold text-[var(--sx-navy)] shadow-[0_0_32px_-12px_rgba(96,165,250,0.3)] transition hover:bg-zinc-100"
        >
          Apply for Internship
        </a>
        <Link
          href="/#contact"
          className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-white/14 bg-white/[0.06] px-7 text-[15px] font-semibold text-zinc-100 transition hover:border-white/22 hover:bg-white/[0.1]"
        >
          Book Consultation
        </Link>
      </div>
    </PageLayout>
  );
}
