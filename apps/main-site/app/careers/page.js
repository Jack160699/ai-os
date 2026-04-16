import Link from "next/link";
import { CONTACT_EMAIL } from "@stratxcel/config";
import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "Careers & Internships — Stratxcel",
};

export default function CareersPage() {
  const internships = [
    ["Business Development Intern", "Sales communication, lead generation, and growth systems."],
    ["Marketing Intern", "Brand campaigns, content systems, and performance basics."],
    ["Operations Intern", "Workflow systems, execution discipline, and coordination."],
    ["IT / Tech Intern", "Web systems, dashboards, automation tools, and AI workflows."],
    ["Finance Intern", "GST basics, invoicing, reporting, and finance operations."],
    ["HR / Talent Intern", "Hiring basics, people systems, and team coordination."],
  ];

  return (
    <PageLayout title="Build real-world skills, not just certificates." eyebrow="Careers & internships">
      <p>
        At Stratxcel, students and freshers gain practical business experience, real project exposure,
        mentorship, field learning, and industry discipline.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {internships.map(([title, body]) => (
          <article key={title} className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-4">
            <h2 className="text-[15px] font-semibold text-[var(--sx-navy)]">{title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{body}</p>
          </article>
        ))}
      </div>
      <p className="mt-8 text-sm text-zinc-600">
        Eligible: BBA, MBA, BCA, MCA, B.Com, M.Com, CS, IT, Sales, Commerce, and serious learners.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        Benefits: Real work, mentorship, live projects, certificates, professional growth, and industry readiness.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Internship%20Application%20%E2%80%94%20Stratxcel`}
          className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-7 text-[15px] font-semibold text-white transition hover:bg-[var(--sx-navy-soft)]"
        >
          Apply for Internship
        </a>
        <Link
          href="/contact"
          className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-zinc-300 bg-white px-7 text-[15px] font-semibold text-[var(--sx-navy)] transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Book Consultation
        </Link>
      </div>
    </PageLayout>
  );
}
