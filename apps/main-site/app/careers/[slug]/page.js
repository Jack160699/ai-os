import Link from "next/link";
import { CONTACT_EMAIL } from "@stratxcel/config";

const ROLE_MAP = {
  "business-development-intern": {
    title: "Business Development Intern",
    overview:
      "Start your career where business development is treated as a disciplined system, not random cold calls.",
    do: [
      "Prospecting and lead list building",
      "Outreach drafting and follow-up discipline",
      "Basic CRM hygiene and pipeline reporting",
    ],
    learn: ["Communication", "Sales fundamentals", "Execution discipline"],
    who: ["Strong communication", "High ownership", "Comfortable with outreach and feedback"],
    growth: "Intern → Junior BD → Business Development Associate",
  },
  "marketing-intern": {
    title: "Marketing Intern",
    overview:
      "Learn modern marketing execution with real campaigns, clear accountability, and measurable outcomes.",
    do: ["Content system support", "Campaign planning basics", "Performance reporting hygiene"],
    learn: ["Brand thinking", "Distribution basics", "Consistency and craft"],
    who: ["Curious learners", "Writers and builders", "Detail-oriented execution"],
    growth: "Intern → Marketing Associate → Brand/Performance specialization",
  },
  "operations-intern": {
    title: "Operations Intern",
    overview:
      "Build operator-grade execution discipline through workflow systems, coordination, and delivery rhythms.",
    do: ["Process mapping", "Coordination support", "Checklists and operating cadence"],
    learn: ["Ops thinking", "Structured execution", "Team coordination"],
    who: ["Organized and reliable", "Comfortable with follow-through", "Systems mindset"],
    growth: "Intern → Ops Associate → Ops lead",
  },
  "it-tech-intern": {
    title: "IT / Tech Intern",
    overview:
      "Work on production web systems and internal tools that solve real operational problems.",
    do: ["Frontend fixes and UI hygiene", "Automation support", "Basic integrations and documentation"],
    learn: ["Production quality", "Testing mindset", "Execution cadence"],
    who: ["Builders", "Comfortable debugging", "Willing to learn production discipline"],
    growth: "Intern → Junior Engineer → Systems Engineer",
  },
  "finance-intern": {
    title: "Finance Intern",
    overview:
      "Learn practical business finance operations: GST basics, invoicing discipline, and reporting hygiene.",
    do: ["Invoice support", "GST-related coordination", "Reporting structure and checks"],
    learn: ["Business finance basics", "Operational reporting", "Accuracy discipline"],
    who: ["Detail oriented", "Comfortable with documentation", "Serious about correctness"],
    growth: "Intern → Finance Ops → Finance associate",
  },
  "hr-talent-intern": {
    title: "HR / Talent Intern",
    overview:
      "Understand how growing companies hire, coordinate, and build reliable people systems.",
    do: ["Candidate coordination", "Interview scheduling hygiene", "Hiring pipeline documentation"],
    learn: ["Hiring fundamentals", "People systems", "Professional communication"],
    who: ["Structured communicators", "Reliable follow-through", "Discretion and clarity"],
    growth: "Intern → Talent Associate → HR/Talent specialist",
  },
  "founders-associate": {
    title: "Founder's Associate",
    overview:
      "A high-ownership role for people who want frontline exposure to founder-led execution and decision-making.",
    do: ["Research and synthesis", "Execution tracking", "Client-facing coordination where needed"],
    learn: ["Operator mindset", "Systems thinking", "Professional standards"],
    who: ["High ownership", "Fast learner", "Strong writing + clarity"],
    growth: "Associate → Ops/Strategy lead",
  },
  "business-development-associate": {
    title: "Business Development Associate (Full-time)",
    overview:
      "Own pipeline execution with clear targets, strong coaching, and a long-term growth path in business development.",
    do: ["Outbound prospecting", "Follow-up consistency", "Pipeline reporting and iteration"],
    learn: ["Business development as a system", "Communication", "Execution discipline"],
    who: ["Coachability", "Consistency", "Comfortable with targets"],
    growth: "Associate → Senior BD → Revenue lead",
  },
};

export const metadata = {
  title: "Careers — Stratxcel",
};

export default function RolePage({ params }) {
  const role = ROLE_MAP[params.slug];
  if (!role) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold text-[var(--sx-navy)]">Role not found</h1>
        <p className="mt-4 text-zinc-600">Return to careers to view open roles.</p>
        <Link className="mt-8 inline-flex text-[var(--sx-accent)] hover:underline" href="/careers">
          Back to Careers
        </Link>
      </div>
    );
  }

  return (
    <div className="border-b border-zinc-100 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Careers</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-4xl">
          {role.title}
        </h1>
        <p className="mt-5 text-[15px] leading-[1.7] text-zinc-600">{role.overview}</p>
        <p className="mt-4 text-sm text-zinc-500">
          This role is built for serious learners who want real responsibility, real standards, and real growth.
        </p>

        <Section title="What you will do" items={role.do} />
        <Section title="What you will learn" items={role.learn} />
        <Section title="Who should apply" items={role.who} />

        <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-4">
          <p className="text-sm font-semibold text-[var(--sx-navy)]">Growth path</p>
          <p className="mt-1 text-sm text-zinc-600">{role.growth}</p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Application%20%E2%80%94%20${encodeURIComponent(role.title)}`}
            className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-7 text-[15px] font-semibold text-white transition hover:bg-[var(--sx-navy-soft)]"
          >
            Apply now
          </a>
          <Link
            href="/careers"
            className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-zinc-300 bg-white px-7 text-[15px] font-semibold text-[var(--sx-navy)] transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            Back to Careers
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, items }) {
  return (
    <div className="mt-10">
      <p className="text-sm font-semibold text-[var(--sx-navy)]">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
