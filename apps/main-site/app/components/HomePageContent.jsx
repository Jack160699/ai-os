import Link from "next/link";
import { CONTACT, SOCIAL } from "@stratxcel/config";
import { HeroCinematic } from "./HeroCinematic";
import { PricingGate } from "./PricingGate";
import { SectionReveal } from "./SectionReveal";

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

  return (
    <>
      <HeroCinematic />

      <section id="pain" className="sx-section">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-2">When execution breaks, growth quietly leaks.</h2>
            <p className="sx-prose sx-prose--wide">
              Serious operators recognise the pattern: effort goes up, but output does not. The underlying issue is
              rarely motivation — it is how work moves through the business.
            </p>
            <div className="sx-card-grid sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Leads lost", "Slow response, dropped follow-ups, and no clear owner for revenue-critical steps."],
                ["Slow execution", "Decisions wait on the founder; teams lack cadence, standards, and handoffs."],
                ["Founder overload", "Tactical work crowds out strategy because systems do not carry the load."],
                ["Inconsistent growth", "Revenue wobbles because operations are not stable under pressure."],
              ].map(([t, d]) => (
                <div key={t} className="sx-card sx-card--lift">
                  <p className="sx-card-title">{t}</p>
                  <p className="sx-card-body">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="transform" className="sx-section sx-section--muted">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-2">From friction to operating leverage.</h2>
            <p className="sx-prose sx-prose--wide">
              We do not patch symptoms. We redesign how information, ownership, and rhythm flow — so the business runs
              with clarity instead of heroics.
            </p>
            <div className="sx-card-grid sm:grid-cols-3">
              {[
                ["Chaos → clarity", "One map of what matters, who owns it, and how progress is measured."],
                ["Manual → systems", "Repeatable rails replace memory, chat threads, and one-off fixes."],
                ["Effort → leverage", "The same team produces more, with less thrash and fewer drop-offs."],
              ].map(([t, d]) => (
                <div key={t} className="sx-card sx-card--lift">
                  <p className="sx-card-title">{t}</p>
                  <p className="sx-card-body">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="systems" className="sx-section">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-2">What we build — systems, not slide decks.</h2>
            <p className="sx-prose sx-prose--wide">
              Deliverables are operational: workflows, ownership maps, dashboards, and automation where they earn
              their place. Nothing ornamental. Everything built to run.
            </p>
            <ul className="sx-pill-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Lead systems — intake, routing, SLA, and follow-through",
                "Execution systems — cadence, priorities, and accountability",
                "Automation — only where reliability improves",
                "Tracking dashboards — signal, not noise",
                "Handoff design — between people, tools, and teams",
                "Documentation that teams actually use",
              ].map((item) => (
                <li key={item} className="sx-pill">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SectionReveal>
      </section>

      <section id="why" className="sx-section sx-section--muted">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-2">Why Stratxcel</h2>
            <p className="sx-prose sx-prose--wide">
              Most businesses stay stuck because they fix tasks, not systems. Training sessions and new tools rarely
              change outcomes when the operating architecture is unchanged.
            </p>
            <p className="sx-prose sx-prose--wide mt-5">
              We rebuild how businesses operate — bottlenecks first, execution reality second, then durable systems you
              can run without constant intervention. Led by operators who ship under constraint, not agencies selling
              hours.
            </p>
          </div>
        </SectionReveal>
      </section>

      <section id="cases" className="sx-section">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-2">Typical scenarios — no inflated claims.</h2>
            <p className="sx-prose">
              Illustrative patterns we see repeatedly. Every engagement is scoped after diagnosis; outcomes depend on
              your context and commitment to run what we design.
            </p>
            <ul className="sx-card-grid sm:grid-cols-2">
              {[
                "Service business — hot leads cooling off because first response and routing were undefined.",
                "Founder-led team — revenue and delivery still concentrated on one person after years of effort.",
                "Growing sales motion — pipeline stages exist on paper but discipline and handoffs do not hold.",
                "Operations on chat — critical steps live in DMs instead of checklists, owners, and audit trails.",
                "Cross-team delivery — recurring drops between departments with no escalation or completion standard.",
                "Reporting load — leadership hours burned on manual status work instead of decision-ready views.",
              ].map((line) => (
                <li key={line} className="sx-card sx-card--lift text-[13px] leading-relaxed text-zinc-700">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </SectionReveal>
      </section>

      <section id="careers" className="sx-section sx-section--muted">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-2">Careers — work on real systems.</h2>
            <p className="sx-prose sx-prose--wide">
              For serious learners who want execution depth, not certificate theatre. Intern and full-time paths below.
            </p>
            <div className="sx-card-grid sm:grid-cols-2 lg:grid-cols-4">
              {roles.slice(0, 6).map((r) => (
                <Link
                  key={r.slug}
                  href={`/careers/${r.slug}`}
                  className="sx-card sx-card--interactive sx-card--lift sx-card-title block"
                >
                  {r.title}
                </Link>
              ))}
            </div>
            <p className="sx-prose sx-prose--wide mt-10">Full-time roles</p>
            <div className="sx-card-grid sm:grid-cols-2">
              {roles.slice(6).map((r) => (
                <Link
                  key={r.slug}
                  href={`/careers/${r.slug}`}
                  className="sx-card sx-card--interactive sx-card--lift sx-card-title block"
                >
                  {r.title}
                </Link>
              ))}
            </div>
            <p className="mt-8 text-sm leading-relaxed text-zinc-600">
              Eligible: BBA, MBA, BCA, MCA, B.Com, M.Com, CS, IT, Sales, Commerce — serious learners only.
            </p>
          </div>
        </SectionReveal>
      </section>

      <section id="consultation" className="sx-section">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-2">Consultation — how engagement starts</h2>
            <p className="sx-prose sx-prose--wide">
              A paid diagnosis is the entry point. It is structured, documented, and designed to surface whether we
              should work together further.
            </p>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["1 — Request", "You submit context: business model, bottlenecks, and what &quot;fixed&quot; looks like in 90 days."],
                ["2 — Diagnose", "We run a working session: map systems, gaps, and sequence. You leave with clarity, not jargon."],
                ["3 — Together (optional)", "If there is mutual fit, we propose an execution arc. If not, you still keep the diagnosis output."],
              ].map(([t, d]) => (
                <li key={t} className="sx-card sx-card--lift">
                  <p className="sx-card-title">{t}</p>
                  <p className="sx-card-body" dangerouslySetInnerHTML={{ __html: d.replace("&quot;", '"') }} />
                </li>
              ))}
            </ol>
            <p className="mt-10 max-w-[60ch] border-l-2 border-zinc-200 pl-5 text-[14px] leading-relaxed text-zinc-600">
              <span className="font-semibold text-[var(--sx-navy)]">Only serious enquiries.</span> We decline requests
              that are vague, purely exploratory, or misaligned with how we work. If you are ready to operate at a
              higher standard, start below.
            </p>
            <div className="mt-8">
              <Link
                href="/#pricing"
                className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-8 text-[14px] font-semibold tracking-[-0.01em] text-white transition hover:bg-[var(--sx-navy-soft)]"
              >
                Request Business Diagnosis
              </Link>
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="pricing" className="sx-section sx-section--muted">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-2">Diagnosis — intent before fee.</h2>
            <p className="sx-prose sx-prose--wide">
              We lead with fit and seriousness of intent. Fee and scope are disclosed only when you choose to proceed.
            </p>
            <PricingGate />
          </div>
        </SectionReveal>
      </section>

      <section id="final-cta" className="sx-section sx-section--dark">
        <SectionReveal>
          <div className="sx-container sx-container--narrow text-center">
            <h2 className="sx-heading-2 sx-heading-2--inverse text-[1.5rem] leading-snug sm:text-[1.75rem]">
              If growth feels harder than it should,
              <br />
              your systems are likely the problem.
            </h2>
            <div className="mt-10">
              <Link
                href="/#pricing"
                className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-white px-8 text-[15px] font-semibold tracking-[-0.015em] text-[var(--sx-navy)] shadow-sm transition hover:bg-zinc-100"
              >
                Request Business Diagnosis
              </Link>
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="contact" className="sx-section">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-2">Contact</h2>
            <p className="sx-prose sx-prose--wide">
              Share context, constraints, and the outcome you need in the next 90 days. We reply with a direct, practical
              read — not a generic brochure.
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
                href={`mailto:${CONTACT.email}?subject=Business%20systems%20%E2%80%94%20Stratxcel`}
                className="sx-social"
                aria-label="Email"
                title="Email"
              >
                @
              </a>
            </div>
          </div>
        </SectionReveal>
      </section>
    </>
  );
}
