import Link from "next/link";
import { BookDiagnosisCheckoutButton } from "@stratxcel/ui";
import { CONTACT, SOCIAL } from "@stratxcel/config";
import { HeroCinematic } from "./HeroCinematic";

export function HomePageContent() {
  const roles = [
    { title: "Business Development Intern", slug: "business-development-intern" },
    { title: "Marketing Intern", slug: "marketing-intern" },
    { title: "Operations Intern", slug: "operations-intern" },
    { title: "IT / Tech Intern", slug: "it-tech-intern" },
    { title: "Finance Intern", slug: "finance-intern" },
    { title: "HR / Talent Intern", slug: "hr-talent-intern" },
    { title: "Founder's Associate", slug: "founders-associate" },
    { title: "Business Development Associate (Full-time)", slug: "business-development-associate" },
  ];
  const socialRows = [
    ["LinkedIn", SOCIAL.linkedin],
    ["Instagram", SOCIAL.instagram],
    ["Facebook", SOCIAL.facebook],
    ["X", SOCIAL.x],
    ["YouTube", SOCIAL.youtube],
    ["GitHub", SOCIAL.github],
  ].filter(([, href]) => href);
  const useCases = [
    "Service business missing hot leads due to delayed first response -> automated lead intake + instant response workflow.",
    "Founder manually chasing every follow-up -> structured follow-up system with ownership and reminders.",
    "Sales team updating status inconsistently -> unified pipeline dashboard with stage discipline.",
    "Team executing tasks without priority clarity -> weekly execution board linked to business outcomes.",
    "Operations relying on WhatsApp memory -> process checklists and tracked handoffs.",
    "Marketing leads not reaching sales on time -> lead routing workflow with SLA alerts.",
    "Client onboarding taking too long -> standardized onboarding sequence with clear owner map.",
    "Frequent task drops between departments -> cross-functional workflow with escalation triggers.",
    "Revenue leak from incomplete proposals -> proposal pipeline with completion checkpoints.",
    "Founder stuck in day-to-day approvals -> delegation framework and approval matrix.",
    "Inconsistent client communication -> communication cadence system and tracking log.",
    "Manual reporting consuming team hours -> lightweight reporting automation and dashboard rollups.",
    "Hiring process slow and chaotic -> hiring pipeline with role scorecards and stages.",
    "New hires underperforming early -> role onboarding systems and execution training loops.",
    "Too many tools, no operating rhythm -> simplified core stack and execution cadence.",
    "Business growth stalling despite effort -> system-level bottleneck diagnosis and redesign.",
  ];

  return (
    <>
      <HeroCinematic />

      <section id="about" className="sx-section">
        <div className="sx-container">
          <h2 className="sx-heading-2">Stratxcel is a systems company, not an agency.</h2>
          <p className="sx-prose">
            Most businesses stay stuck because they keep fixing symptoms instead of systems. We do not optimize
            tasks. We redesign how your business operates.
          </p>
        </div>
      </section>

      <section id="how-we-work" className="sx-section sx-section--muted">
        <div className="sx-container">
          <h2 className="sx-heading-2">How We Work</h2>
          <p className="sx-prose sx-prose--wide">
            Why trust us? Because we diagnose before we prescribe, execute before we claim, and stay involved
            until systems hold under pressure.
          </p>
          <ol className="sx-card-grid sm:grid-cols-2">
            {[
              ["Diagnose", "Commercial bottlenecks, workflow constraints, and team realities."],
              ["Design", "System architecture, owners, cadence, and success metrics."],
              ["Implement", "Ship workflows and execution rails in weekly cycles."],
              ["Stabilize", "Tune, document, and harden for long-term reliability."],
            ].map(([t, d]) => (
              <li key={t} className="sx-card">
                <p className="sx-card-title">{t}</p>
                <p className="sx-card-body">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="work" className="sx-section">
        <div className="sx-container">
          <h2 className="sx-heading-2">Why people come to us</h2>
          <p className="sx-prose sx-prose--wide">
            Operations feel messy. Leads are inconsistent. Teams move slowly. Too much depends on the owner.
            Growth feels harder than it should.
          </p>
          <ul className="sx-pill-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Operational chaos",
              "Slow follow-up",
              "Weak execution",
              "Manual processes",
              "Growth bottlenecks",
              "Owner dependency",
              "Untrained teams",
            ].map((item) => (
              <li key={item} className="sx-pill">
                {item}
              </li>
            ))}
          </ul>
          <h3 className="sx-subheading">What we actually build</h3>
          <ul className="sx-pill-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Lead systems",
              "Follow-up systems",
              "Internal dashboards",
              "Automation workflows",
              "Execution systems",
              "Hiring pipelines",
            ].map((item) => (
              <li key={item} className="sx-pill">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="results" className="sx-section sx-section--muted">
        <div className="sx-container">
          <h2 className="sx-heading-2">Results</h2>
          <p className="sx-prose">Use-case scenarios from recurring business problems we solve through systems.</p>
          <ul className="sx-card-grid sm:grid-cols-2">
            {useCases.map((line) => (
              <li key={line} className="sx-card text-[13px] leading-relaxed text-zinc-700">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="why" className="sx-section">
        <div className="sx-container">
          <h2 className="sx-heading-2">Why Stratxcel</h2>
          <p className="sx-prose sx-prose--wide">
            Most businesses stay stuck when effort increases but systems stay weak. We work selectively, stay
            involved, and build for long-term value.
          </p>
          <div className="sx-card-grid sm:grid-cols-3">
            {[
              ["Deep Commitment", "We stay close to the system until it works in real operating conditions."],
              ["Systems Thinking", "Workflows designed for compounding reliability, not short-term hacks."],
              ["Long-Term Value", "Implementation quality that supports scale, hiring, and governance."],
            ].map(([t, d]) => (
              <div key={t} className="sx-card">
                <p className="sx-card-title">{t}</p>
                <p className="sx-card-body">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="founder-note" className="sx-section sx-section--muted">
        <div className="sx-container sx-container--narrow">
          <article className="sx-card px-6 py-8 sm:px-10 sm:py-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Founder note</p>
            <p className="mt-5 text-[1.125rem] font-medium leading-relaxed tracking-[-0.02em] text-[var(--sx-navy)] sm:text-[1.25rem]">
              Built by a founder who believes trust is earned through action, not promises.
            </p>
            <p className="mt-4 max-w-[65ch] text-[15px] leading-[1.75] text-zinc-700 sm:text-[1.0625rem]">
              Most businesses do not fail because of lack of effort.
              <br />
              They fail because everything depends on people, memory, and chaos.
              <br />
              Stratxcel exists to fix that.
              <br />
              We build systems we use ourselves, test them under pressure, and deploy what actually works.
              <br />
              No noise. No theory. Only execution.
            </p>
            <p className="mt-6 text-[13px] leading-relaxed text-zinc-500">
              — Shriyansh Chandrakar
              <br />
              Founder, Stratxcel OPC Private Limited
            </p>
          </article>
        </div>
      </section>

      <section id="careers" className="sx-section">
        <div className="sx-container">
          <h2 className="sx-heading-2">Start where real experience begins.</h2>
          <p className="sx-prose sx-prose--wide">
            SECTION 1 — INTERNS (18-22): Do not do internships that teach nothing. Work on real systems, real
            businesses, and real execution.
          </p>
          <div className="sx-card-grid sm:grid-cols-2 lg:grid-cols-4">
            {roles.slice(0, 6).map((r) => (
              <Link
                key={r.slug}
                href={`/careers/${r.slug}`}
                className="sx-card sx-card--interactive sx-card-title block"
              >
                {r.title}
              </Link>
            ))}
          </div>
          <p className="sx-prose sx-prose--wide mt-10">
            SECTION 2 — FULL-TIME (22+): Work directly on building and scaling a real company.
          </p>
          <div className="sx-card-grid sm:grid-cols-2">
            {roles.slice(6).map((r) => (
              <Link
                key={r.slug}
                href={`/careers/${r.slug}`}
                className="sx-card sx-card--interactive sx-card-title block"
              >
                {r.title}
              </Link>
            ))}
          </div>
          <p className="mt-8 text-sm leading-relaxed text-zinc-600">
            Eligible: BBA, MBA, BCA, MCA, B.Com, M.Com, CS, IT, Sales, Commerce — serious learners.
          </p>
        </div>
      </section>

      <section id="vision" className="sx-section sx-section--muted">
        <div className="sx-container sx-container--narrow">
          <h2 className="sx-heading-2">The future belongs to businesses that operate like software.</h2>
          <p className="sx-prose sx-prose--wide">
            Stratxcel is building the systems layer for modern Indian companies — where growth is clearer,
            teams move faster, and execution becomes dependable.
          </p>
        </div>
      </section>

      <section id="pricing" className="sx-section">
        <div className="sx-container">
          <h2 className="sx-heading-2">Pricing</h2>
          <p className="sx-prose">This is not a call. This is a structured diagnosis.</p>
          <div className="mx-auto mt-8 max-w-md lg:mx-0">
            <div className="sx-card border-zinc-200/95 p-8 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.12)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Business Diagnosis</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--sx-navy)]">
                ₹2200
                <span className="ml-2 text-base font-medium text-zinc-500">per session</span>
              </p>
              <ul className="mt-4 space-y-2 text-[14px] leading-[1.7] text-zinc-600">
                <li>Deep business analysis</li>
                <li>System gap identification</li>
                <li>Execution bottleneck mapping</li>
                <li>Action plan</li>
              </ul>
              <p className="mt-4 text-xs font-medium text-zinc-500">
                Limited diagnosis slots each week to preserve execution quality.
              </p>
              <div className="mt-8">
                <BookDiagnosisCheckoutButton amount={2200} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="final-cta" className="sx-section sx-section--dark">
        <div className="sx-container sx-container--narrow text-center">
          <h2 className="sx-heading-2 sx-heading-2--inverse text-[1.5rem] leading-snug sm:text-[1.75rem]">
            If your business feels harder than it should,
            <br />
            it is not effort — it is your systems.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-zinc-400">
            Get a clear diagnosis.
          </p>
          <div className="mt-10">
            <Link
              href="/#pricing"
              className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-white px-8 text-[15px] font-semibold tracking-[-0.015em] text-[var(--sx-navy)] shadow-sm transition hover:bg-zinc-100"
            >
              Get Business Diagnosis (₹2200)
            </Link>
          </div>
          <p className="mt-5 text-xs text-zinc-500">— Shriyansh Chandrakar, Founder</p>
        </div>
      </section>

      <section id="contact" className="sx-section">
        <div className="sx-container">
          <h2 className="sx-heading-2">Contact</h2>
          <p className="sx-prose sx-prose--wide">
            Share your business context, bottlenecks, and the outcome you need in the next 90 days. We reply
            with a practical path forward.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {socialRows.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="sx-social"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
              >
                {label.slice(0, 2)}
              </a>
            ))}
            <a
              href={`mailto:${CONTACT.email}?subject=Consultation%20Request%20%E2%80%94%20Stratxcel`}
              className="sx-social"
              aria-label="Email"
              title="Email"
            >
              @
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
