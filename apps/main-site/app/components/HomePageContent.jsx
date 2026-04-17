import Link from "next/link";
import { CONTACT, SOCIAL } from "@stratxcel/config";
import { ConnectedBuildRail } from "./ConnectedBuildRail";
import { HeroCinematic } from "./HeroCinematic";
import { PricingGate } from "./PricingGate";
import { SectionReveal } from "./SectionReveal";
import { SectionSystemGraphic } from "./SectionSystemGraphic";

const ctaPrimaryClass =
  "inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-sky-500/28 bg-[#0B0F19]/95 px-8 text-[14px] font-semibold tracking-[-0.015em] text-[#E5E7EB] sx-cta-glow transition-[transform,box-shadow,border-color,background-color] duration-[520ms] ease-out hover:-translate-y-0.5 hover:border-sky-400/38 hover:bg-[#0f1524] active:translate-y-0";

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
    {
      tag: "Signal",
      title: "Service business — lead integrity",
      body: "When intake, routing, SLA, and follow-through have clear owners, leakage tightens without adding headcount noise.",
    },
    {
      tag: "Load",
      title: "Founder — dependency curve",
      body: "Cadence, priorities, and handoffs replace everything living in one head — fewer bottlenecks, faster decisions.",
    },
    {
      tag: "Throughput",
      title: "Team — execution rails",
      body: "Checklists, standards, and escalation paths replace chat-thread operations so work ships on rhythm, not memory.",
    },
  ];

  return (
    <>
      <HeroCinematic />

      <section id="pain" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <SectionSystemGraphic variant="fragmented" className="mb-2" />
            <h2 className="sx-heading-space">When nodes drift, the system goes quiet.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              That is the feel of business chaos: effort rises, but signal does not. The failure is rarely motivation — it
              is disconnected flow between the parts that should move revenue.
            </p>
            <ul className="mt-10 divide-y divide-white/[0.07] border-y border-white/[0.08]">
              {[
                ["Leads lost", "Slow response, dropped follow-ups, and no clear owner for revenue-critical steps."],
                ["Slow execution", "Decisions wait on the founder; teams lack cadence, standards, and handoffs."],
                ["Founder overload", "Tactical work crowds out strategy because systems do not carry the load."],
                ["Inconsistent growth", "Revenue wobbles because operations are not stable under pressure."],
              ].map(([t, d]) => (
                <li key={t} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-10 sm:py-5">
                  <span className="shrink-0 text-[13px] font-semibold tracking-[-0.01em] text-zinc-200">{t}</span>
                  <span className="text-[14px] leading-relaxed text-zinc-500">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionReveal>
      </section>

      <section id="transform" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <SectionSystemGraphic variant="forming" className="mb-2" />
            <h2 className="sx-heading-space">From noise to a single operating graph.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              We do not patch symptoms. We redesign how information, ownership, and rhythm flow — so the business runs
              with clarity instead of heroics.
            </p>
            <div className="mt-10 rounded-2xl border border-white/[0.08] bg-[#0B0F19]/35 p-1 backdrop-blur-md shadow-[0_0_0_1px_rgba(0,0,0,0.45)_inset] sm:p-2">
              <ul className="divide-y divide-white/[0.06] sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  ["Chaos → clarity", "One map of what matters, who owns it, and how progress is measured."],
                  ["Manual → systems", "Repeatable rails replace memory, chat threads, and one-off fixes."],
                  ["Effort → leverage", "The same team produces more, with less thrash and fewer drop-offs."],
                ].map(([t, d]) => (
                  <li key={t} className="px-4 py-5 sm:px-5 sm:py-6">
                    <p className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-200">{t}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{d}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="systems" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-space">What we build — connected modules, not decks.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Deliverables are operational: workflows, ownership maps, dashboards, and automation where they earn their
              place. Nothing ornamental. Everything built to run as one system.
            </p>
            <ConnectedBuildRail />
            <p className="sx-prose-space sx-prose-space--wide mt-10">
              Under the hood: handoff design between people and tools, documentation teams actually use, and tracking
              that shows signal — not vanity metrics.
            </p>
          </div>
        </SectionReveal>
      </section>

      <section id="why" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <SectionSystemGraphic variant="control" className="mb-4" />
            <h2 className="sx-heading-space">Why Stratxcel</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Most businesses stay stuck because they fix tasks, not systems. New tools rarely change outcomes when the
              operating architecture is unchanged.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["Systems thinking", "We map bottlenecks, sequence, and feedback loops before touching execution detail."],
                ["Execution", "Led by operators who ship under constraint — standards, cadence, and accountability first."],
                ["Clarity", 'One honest picture of what "fixed" looks like — then rails your team can run without noise.'],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/[0.08] bg-[#0B0F19]/45 p-6 backdrop-blur-md shadow-[0_0_0_1px_rgba(0,0,0,0.45)_inset] transition-[border-color,box-shadow,transform] duration-[600ms] ease-out hover:-translate-y-0.5 hover:border-sky-500/18 hover:shadow-[0_0_40px_-22px_rgba(59,130,246,0.16)] sm:p-7"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400/55">{title}</p>
                  <p className="mt-4 text-[14px] leading-relaxed text-zinc-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="cases" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-space">Use cases — command readouts.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Illustrative patterns we see repeatedly. Every engagement is scoped after diagnosis; outcomes depend on your
              context and commitment to run what we design.
            </p>
            <ul className="mt-10 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((c) => (
                <li
                  key={c.title}
                  className="flex flex-col rounded-xl border border-white/[0.08] bg-[#0B0F19]/40 p-5 backdrop-blur-md transition-[border-color,box-shadow,transform] duration-[600ms] ease-out hover:-translate-y-0.5 hover:border-sky-500/18 hover:shadow-[0_0_44px_-20px_rgba(59,130,246,0.14)]"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{c.tag}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/30 shadow-[0_0_12px_rgba(52,211,153,0.25)]" aria-hidden />
                  </div>
                  <p className="mt-3 text-[14px] font-semibold tracking-[-0.02em] text-zinc-200">{c.title}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{c.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </SectionReveal>
      </section>

      <section id="consultation" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-space">How we work — diagnosis first.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              A paid diagnosis is the entry point. It is structured, documented, and designed to surface whether we
              should work together further.
            </p>
            <ol className="mt-8 grid list-none gap-4 pl-0 md:grid-cols-3">
              {[
                ["1 — Request", 'You submit context: business model, bottlenecks, and what "fixed" looks like in 90 days.'],
                ["2 — Diagnose", "We run a working session: map systems, gaps, and sequence. You leave with clarity, not jargon."],
                ["3 — Together (optional)", "If there is mutual fit, we propose an execution arc. If not, you still keep the diagnosis output."],
              ].map(([t, d]) => (
                <li
                  key={t}
                  className="rounded-xl border border-white/[0.08] bg-[#0B0F19]/35 px-5 py-5 backdrop-blur-md transition-[border-color,transform] duration-[520ms] ease-out hover:-translate-y-0.5 hover:border-white/14"
                >
                  <p className="text-[13px] font-semibold text-zinc-200">{t}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{d}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 max-w-[60ch] border-l border-sky-500/20 pl-5 text-[14px] leading-relaxed text-zinc-400">
              <span className="font-semibold text-[#E5E7EB]">Only serious enquiries.</span> We decline requests that are
              vague, purely exploratory, or misaligned with how we work. If you are ready to operate at a higher standard,
              start below.
            </p>
            <div className="mt-8">
              <Link href="/#pricing" className={ctaPrimaryClass}>
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

      <section id="final-cta" className="sx-section-space sx-cta-focus-zone">
        <SectionReveal>
          <div className="sx-container sx-container--narrow text-center">
            <h2 className="sx-heading-space text-[1.45rem] leading-snug sm:text-[1.7rem]">
              If growth feels harder than it should,
              <br />
              your systems are likely the problem.
            </h2>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/#pricing" className={ctaPrimaryClass}>
                Request Business Diagnosis
              </Link>
              <Link
                href="/#consultation"
                className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] px-8 text-[14px] font-semibold tracking-[-0.015em] text-[#E5E7EB] backdrop-blur-md transition-[border-color,background-color,transform] duration-[520ms] ease-out hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] active:translate-y-0"
              >
                See How We Work
              </Link>
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="careers" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <h2 className="sx-heading-space">Careers</h2>
            <p className="mt-3 text-[15px] font-medium tracking-[-0.02em] text-zinc-300">Join a system, not a company.</p>
            <p className="sx-prose-space sx-prose-space--wide mt-4">
              For serious learners who want execution depth, not certificate theatre. Intern and full-time paths below.
            </p>
            <div className="sx-card-grid sm:grid-cols-2 lg:grid-cols-4">
              {roles.slice(0, 6).map((r) => (
                <Link
                  key={r.slug}
                  href={`/careers/${r.slug}`}
                  className="sx-card-space sx-card--interactive sx-card--lift sx-card-title-space block rounded-xl"
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
                  className="sx-card-space sx-card--interactive sx-card--lift sx-card-title-space block rounded-xl"
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
              Share context, constraints, and the outcome you need in the next 90 days. We reply with a direct, practical
              read — not a generic brochure.
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
