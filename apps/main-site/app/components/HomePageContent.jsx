import Link from "next/link";
import { CONTACT, SOCIAL } from "@stratxcel/config";
import { HeroCinematic } from "./HeroCinematic";
import { PricingGate } from "./PricingGate";
import { SectionReveal } from "./SectionReveal";
import { SectionSystemGraphic } from "./SectionSystemGraphic";

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

      <section id="pain" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <SectionSystemGraphic variant="fragmented" className="mb-2" />
            <h2 className="sx-heading-space">When execution breaks, growth quietly leaks.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
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
                <div key={t} className="sx-card-space sx-card--lift">
                  <p className="sx-card-title-space">{t}</p>
                  <p className="sx-card-body-space">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="transform" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <SectionSystemGraphic variant="forming" className="mb-2" />
            <h2 className="sx-heading-space">From friction to operating leverage.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              We do not patch symptoms. We redesign how information, ownership, and rhythm flow — so the business runs
              with clarity instead of heroics.
            </p>
            <div className="sx-card-grid sm:grid-cols-3">
              {[
                ["Chaos → clarity", "One map of what matters, who owns it, and how progress is measured."],
                ["Manual → systems", "Repeatable rails replace memory, chat threads, and one-off fixes."],
                ["Effort → leverage", "The same team produces more, with less thrash and fewer drop-offs."],
              ].map(([t, d]) => (
                <div key={t} className="sx-card-space sx-card--lift">
                  <p className="sx-card-title-space">{t}</p>
                  <p className="sx-card-body-space">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="systems" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <SectionSystemGraphic variant="modules" className="mb-2" />
            <h2 className="sx-heading-space">What we build — systems, not slide decks.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
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
                <li key={item} className="sx-pill-space">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SectionReveal>
      </section>

      <section id="why" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <SectionSystemGraphic variant="control" className="mb-4" />
            <h2 className="sx-heading-space">Why Stratxcel</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Most businesses stay stuck because they fix tasks, not systems. Training sessions and new tools rarely
              change outcomes when the operating architecture is unchanged.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="sx-card-space sx-card--lift rounded-2xl p-6 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">Control</p>
                <p className="mt-3 text-[15px] leading-relaxed text-zinc-300">
                  Ownership, cadence, and standards so execution does not depend on heroics or memory.
                </p>
              </div>
              <div className="sx-card-space sx-card--lift rounded-2xl p-6 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">Clarity</p>
                <p className="mt-3 text-[15px] leading-relaxed text-zinc-300">
                  One honest map of bottlenecks, sequence, and what &ldquo;fixed&rdquo; looks like — then systems that
                  teams can run.
                </p>
              </div>
            </div>
            <p className="sx-prose-space sx-prose-space--wide mt-8">
              We rebuild how businesses operate — bottlenecks first, execution reality second, then durable systems you
              can run without constant intervention. Led by operators who ship under constraint, not agencies selling
              hours.
            </p>
          </div>
        </SectionReveal>
      </section>

      <section id="cases" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-space">Typical scenarios — no inflated claims.</h2>
            <p className="sx-prose-space">
              Illustrative patterns we see repeatedly. Every engagement is scoped after diagnosis; outcomes depend on
              your context and commitment to run what we design.
            </p>
            <ul className="sx-card-grid list-none sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Service business — lead leakage tightened when intake, routing, SLA, and follow-through have clear owners.",
                "Founder — reduced dependency when cadence, priorities, and handoffs replace everything living in one head.",
                "Team — improved execution when checklists, standards, and escalation paths replace chat-thread operations.",
              ].map((line) => (
                <li key={line} className="sx-card-space sx-card--lift text-[13px] leading-relaxed text-zinc-400">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </SectionReveal>
      </section>

      <section id="consultation" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-space">Consultation — how engagement starts</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              A paid diagnosis is the entry point. It is structured, documented, and designed to surface whether we
              should work together further.
            </p>
            <ol className="mt-8 grid list-none gap-4 pl-0 md:grid-cols-3">
              <li className="sx-card-space sx-card--lift">
                <p className="sx-card-title-space">1 — Request</p>
                <p className="sx-card-body-space">
                  You submit context: business model, bottlenecks, and what &ldquo;fixed&rdquo; looks like in 90 days.
                </p>
              </li>
              <li className="sx-card-space sx-card--lift">
                <p className="sx-card-title-space">2 — Diagnose</p>
                <p className="sx-card-body-space">
                  We run a working session: map systems, gaps, and sequence. You leave with clarity, not jargon.
                </p>
              </li>
              <li className="sx-card-space sx-card--lift">
                <p className="sx-card-title-space">3 — Together (optional)</p>
                <p className="sx-card-body-space">
                  If there is mutual fit, we propose an execution arc. If not, you still keep the diagnosis output.
                </p>
              </li>
            </ol>
            <p className="mt-10 max-w-[60ch] border-l border-sky-400/25 pl-5 text-[14px] leading-relaxed text-zinc-400">
              <span className="font-semibold text-zinc-100">Only serious enquiries.</span> We decline requests that
              are vague, purely exploratory, or misaligned with how we work. If you are ready to operate at a higher
              standard, start below.
            </p>
            <div className="mt-8">
              <Link
                href="/#pricing"
                className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-white/12 bg-white px-8 text-[14px] font-semibold tracking-[-0.01em] text-[var(--sx-navy)] shadow-[0_0_40px_-14px_rgba(96,165,250,0.35)] transition-[transform,box-shadow] duration-500 ease-out hover:shadow-[0_0_48px_-12px_rgba(96,165,250,0.45)]"
              >
                Request Business Diagnosis
              </Link>
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="pricing" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-space">Diagnosis — intent before fee.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              We lead with fit and seriousness of intent. Fee and scope are disclosed only when you choose to proceed.
            </p>
            <PricingGate />
          </div>
        </SectionReveal>
      </section>

      <section id="final-cta" className="sx-section-space sx-section-space--ridge">
        <SectionReveal>
          <div className="sx-container sx-container--narrow text-center">
            <h2 className="sx-heading-space text-[1.5rem] leading-snug sm:text-[1.75rem]">
              If growth feels harder than it should,
              <br />
              your systems are likely the problem.
            </h2>
            <div className="mt-10">
              <Link
                href="/#pricing"
                className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-white/12 bg-white px-8 text-[15px] font-semibold tracking-[-0.015em] text-[var(--sx-navy)] shadow-[0_0_40px_-14px_rgba(96,165,250,0.35)] transition-[transform,box-shadow] duration-500 ease-out hover:shadow-[0_0_52px_-12px_rgba(96,165,250,0.45)]"
              >
                Request Business Diagnosis
              </Link>
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="careers" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-space">Careers — work on real systems.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              For serious learners who want execution depth, not certificate theatre. Intern and full-time paths below.
            </p>
            <div className="sx-card-grid sm:grid-cols-2 lg:grid-cols-4">
              {roles.slice(0, 6).map((r) => (
                <Link
                  key={r.slug}
                  href={`/careers/${r.slug}`}
                  className="sx-card-space sx-card--interactive sx-card--lift sx-card-title-space block"
                >
                  {r.title}
                </Link>
              ))}
            </div>
            <p className="sx-prose-space sx-prose-space--wide mt-10">Full-time roles</p>
            <div className="sx-card-grid sm:grid-cols-2">
              {roles.slice(6).map((r) => (
                <Link
                  key={r.slug}
                  href={`/careers/${r.slug}`}
                  className="sx-card-space sx-card--interactive sx-card--lift sx-card-title-space block"
                >
                  {r.title}
                </Link>
              ))}
            </div>
            <p className="mt-8 text-sm leading-relaxed text-zinc-500">
              Eligible: BBA, MBA, BCA, MCA, B.Com, M.Com, CS, IT, Sales, Commerce — serious learners only.
            </p>
          </div>
        </SectionReveal>
      </section>

      <section id="contact" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-space">Contact</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Share context, constraints, and the outcome you need in the next 90 days. We reply with a direct,
              practical read — not a generic brochure.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {socialRows.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="sx-social-space"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                >
                  {label.slice(0, 2)}
                </a>
              ))}
              <a
                href={`mailto:${CONTACT.email}?subject=Business%20systems%20%E2%80%94%20Stratxcel`}
                className="sx-social-space"
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
