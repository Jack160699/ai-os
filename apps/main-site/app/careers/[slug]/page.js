import Link from "next/link";
import { CONTACT_EMAIL } from "@stratxcel/config";
import { PageLayout } from "@/app/components/PageLayout";

const ROLE_MAP = {
  "business-development-intern": {
    title: "Business Development Intern",
    overview:
      "Start your career where business development is treated as a disciplined system, not random cold calls.",
    do: [
      "Prospecting and lead list building",
      "Outreach drafting and follow-up discipline",
      "Follow-up lists and simple status tracking",
    ],
    learn: ["Communication", "Sales fundamentals", "Execution discipline"],
    who: ["Strong communication", "High ownership", "Comfortable with outreach and feedback"],
  },
  "marketing-intern": {
    title: "Marketing Intern",
    overview:
      "Learn modern marketing execution with real campaigns, clear accountability, and measurable outcomes.",
    do: ["Content system support", "Campaign planning basics", "Performance reporting hygiene"],
    learn: ["Brand thinking", "Distribution basics", "Consistency and craft"],
    who: ["Curious learners", "Writers and builders", "Detail-oriented execution"],
  },
  "operations-intern": {
    title: "Operations Intern",
    overview:
      "Build operator-grade execution discipline through workflow systems, coordination, and delivery rhythms.",
    do: ["Process mapping", "Coordination support", "Checklists and operating cadence"],
    learn: ["Ops thinking", "Structured execution", "Team coordination"],
    who: ["Organized and reliable", "Comfortable with follow-through", "Systems mindset"],
  },
  "it-tech-intern": {
    title: "IT / Tech Intern",
    overview: "Work on production web systems and internal tools that solve real operational problems.",
    do: ["Frontend fixes and UI hygiene", "Automation support", "Basic integrations and documentation"],
    learn: ["Production quality", "Testing mindset", "Execution cadence"],
    who: ["Builders", "Comfortable debugging", "Willing to learn production discipline"],
  },
  "finance-intern": {
    title: "Finance Intern",
    overview:
      "Learn practical business finance operations: GST basics, invoicing discipline, and reporting hygiene.",
    do: ["Invoice support", "GST-related coordination", "Reporting structure and checks"],
    learn: ["Business finance basics", "Operational reporting", "Accuracy discipline"],
    who: ["Detail oriented", "Comfortable with documentation", "Serious about correctness"],
  },
  "hr-talent-intern": {
    title: "HR / Talent Intern",
    overview: "Understand how growing companies hire, coordinate, and build reliable people systems.",
    do: ["Candidate coordination", "Interview scheduling hygiene", "Hiring pipeline documentation"],
    learn: ["Hiring fundamentals", "People systems", "Professional communication"],
    who: ["Structured communicators", "Reliable follow-through", "Discretion and clarity"],
  },
  "founders-associate": {
    title: "Execution Associate",
    overview:
      "Hands-on support across research, delivery, and client coordination — high ownership, clear standards.",
    do: ["Research and synthesis", "Execution tracking", "Client-facing coordination where needed"],
    learn: ["Operator mindset", "Systems thinking", "Professional standards"],
    who: ["High ownership", "Fast learner", "Strong writing + clarity"],
  },
  "business-development-associate": {
    title: "Business Development Associate (Full-time)",
    overview:
      "Own pipeline execution with clear targets, strong coaching, and a long-term growth path in business development.",
    do: ["Outbound prospecting", "Follow-up consistency", "Pipeline reporting and iteration"],
    learn: ["Business development as a system", "Communication", "Execution discipline"],
    who: ["Coachability", "Consistency", "Comfortable with targets"],
  },
};

export const metadata = {
  title: "Careers — Stratxcel",
};

export default function RolePage({ params }) {
  const role = ROLE_MAP[params.slug];
  if (!role) {
    return (
      <PageLayout title="Role not found" eyebrow="Careers">
        <p className="text-[15px] text-[color:var(--sx-ink-secondary)]">Return to careers to view open roles.</p>
        <p className="mt-8">
          <Link
            href="/careers"
            className="font-semibold text-[var(--sx-ink)] underline decoration-stone-300/80 underline-offset-[5px] transition-colors hover:decoration-stone-400"
          >
            Back to Careers
          </Link>
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={role.title} eyebrow="Careers">
      <p className="text-[15px] leading-[1.7] text-[color:var(--sx-ink-secondary)]">{role.overview}</p>

      <Section title="What you will do" items={role.do} />
      <Section title="What you will learn" items={role.learn} />
      <Section title="Who should apply" items={role.who} />

      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Application%20%E2%80%94%20${encodeURIComponent(role.title)}`}
          className="sx-cta-primary inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-stone-800/25 px-7 text-[15px] font-semibold text-stone-50"
        >
          Apply now
        </a>
        <Link
          href="/careers"
          className="sx-btn-secondary-elegant inline-flex h-12 min-h-[48px] items-center justify-center rounded-full px-7 text-[15px] font-semibold"
        >
          Back to Careers
        </Link>
      </div>
    </PageLayout>
  );
}

function Section({ title, items }) {
  return (
    <div className="mt-10">
      <p className="text-sm font-semibold text-[var(--sx-ink)]">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li
            key={it}
            className="sx-card-space sx-card--interactive rounded-lg px-3 py-3 text-sm text-[color:var(--sx-ink-secondary)]"
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
