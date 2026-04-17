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
    { tag: "01", title: "Coaching business losing leads", body: "Lead follow-up system installed with clear response ownership and sequence discipline." },
    { tag: "02", title: "Local service company relying on referrals", body: "Predictable inbound pipeline built to reduce dependency on word-of-mouth volatility." },
    { tag: "03", title: "Founder overwhelmed daily", body: "Delegation workflow created with ownership mapping and escalation checkpoints." },
    { tag: "04", title: "Sales team inconsistent", body: "CRM accountability system built with mandatory stage hygiene and follow-up visibility." },
    { tag: "05", title: "Growing company blind on numbers", body: "Reporting dashboard installed for weekly operational decisions and issue detection." },
    { tag: "06", title: "Agency stuck at same revenue", body: "Delivery and sales operating systems rebuilt to restore growth throughput." },
    { tag: "07", title: "Clinic missing repeat customers", body: "Retention flow introduced across reminders, follow-ups, and repeat-value touchpoints." },
    { tag: "08", title: "E-commerce messy operations", body: "SOP system created for fulfillment rhythm, handoffs, and exception handling." },
    { tag: "09", title: "Real estate slow follow-up", body: "Lead response engine built to reduce delay and improve conversion consistency." },
    { tag: "10", title: "Small team scaling chaos", body: "Process structure introduced to stabilize execution quality under higher load." },
    { tag: "11", title: "Consultant dependent on founder brand", body: "Authority funnel built so demand generation is not personality-dependent." },
    { tag: "12", title: "Business growing but leaking profit", body: "Inefficiency diagnosis run and corrected through operational system fixes." },
  ];
  const trustSignals = [
    "Registered Indian Company",
    "Founder-led execution",
    "Selective partnerships",
    "Long-term systems focus",
    "India focused operations",
  ];

  return (
    <>
      <HeroCinematic />

      <section id="trust-signals" className="sx-section-space pt-10 pb-8 sm:pt-12 sm:pb-10">
        <SectionReveal>
          <div className="sx-container">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0B0F19]/34 p-2 backdrop-blur-xl">
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {trustSignals.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-center text-[11px] font-medium tracking-[0.08em] text-zinc-300"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="pain" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <SectionSystemGraphic variant="fragmented" className="mb-2" />
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Problem State</p>
            <h2 className="sx-heading-space mt-3">When business nodes disconnect, growth gets noisy.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Most breakdowns are not effort issues. They are system-flow failures: handoffs break, ownership blurs,
              and decision signals arrive too late.
            </p>
            <p className="mt-5 text-[12px] tracking-[0.02em] text-zinc-400">Built for serious operators.</p>
            <ul className="mt-10 divide-y divide-white/[0.07] rounded-2xl border border-white/[0.08] bg-[#0B0F19]/38 backdrop-blur-xl">
              {[
                ["Leads leak", "Response velocity is slow, follow-up chains break, and qualified demand goes dark."],
                ["Execution stalls", "Teams rely on chat memory instead of operational rails, standards, and cadence."],
                ["Founder saturation", "Decision load centralizes around one person, creating constant throughput drag."],
                ["Unstable growth", "Revenue swings because systems cannot hold pressure under scale."],
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
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Transformation</p>
            <h2 className="sx-heading-space mt-3">From scattered effort to one operating graph.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              We redesign operational flow end-to-end, so information, ownership, and execution move as a coordinated
              system instead of reactive firefighting.
            </p>
            <p className="mt-5 text-[12px] tracking-[0.02em] text-zinc-400">Long-term thinking over quick hacks.</p>
            <div className="mt-10 rounded-2xl border border-white/[0.08] bg-[#0B0F19]/35 p-1 backdrop-blur-md shadow-[0_0_0_1px_rgba(0,0,0,0.45)_inset] sm:p-2">
              <ul className="divide-y divide-white/[0.06] sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  ["Chaos -> clarity", "Every critical workflow, owner, and signal becomes explicit and measurable."],
                  ["Manual -> systems", "Repeatable rails replace dependence on memory and ad-hoc coordination."],
                  ["Effort -> leverage", "The same team ships more output with fewer bottlenecks and escalations."],
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
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">What We Build</p>
            <h2 className="sx-heading-space mt-3">
              We don&apos;t sell services.
              <br />
              We build growth systems.
            </h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Every business bottleneck is usually a systems issue in disguise.
            </p>
            <ConnectedBuildRail
              modules={[
                "Lead Generation Systems",
                "Sales Conversion Systems",
                "Operations Systems",
                "Growth Intelligence Systems",
              ]}
            />
            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {[
                ["Lead Generation Systems", "Build predictable inbound and outbound lead flow with clear signal quality."],
                ["Sales Conversion Systems", "Improve follow-up speed, tracking discipline, and closing consistency."],
                ["Operations Systems", "Reduce founder dependency and eliminate execution chaos in day-to-day delivery."],
                ["Growth Intelligence Systems", "Install dashboards, tracking, and decision visibility that teams can act on."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-white/[0.08] bg-[#0B0F19]/35 p-4 backdrop-blur-md">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300/65">{title}</p>
                  <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </section>

      <section id="why" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <SectionSystemGraphic variant="control" className="mb-4" />
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Why Stratxcel</p>
            <h2 className="sx-heading-space mt-3">
              Most businesses don&apos;t need more hustle.
              <br />
              They need better systems.
            </h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Growth slows when operations depend on memory, chaos, and constant founder involvement.
            </p>
            <p className="sx-prose-space sx-prose-space--wide mt-4">
              We help businesses replace friction with structure, speed, and clarity.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["Systems Thinking", "We diagnose bottlenecks, decision loops, and ownership architecture before interventions."],
                ["Execution Discipline", "We install operating rhythm, standards, and accountability so teams ship without chaos."],
                ["Compounding Growth", "We build system leverage that improves output quality, speed, and consistency over time."],
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
            <p className="mt-6 text-[12px] tracking-[0.02em] text-zinc-400">Selective engagements only.</p>
          </div>
        </SectionReveal>
      </section>

      <section id="founder-mindset" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container sx-container--narrow">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Founder Psychology</p>
            <h2 className="sx-heading-space mt-3">Built by someone who solves problems through systems.</h2>
            <div className="mt-7 rounded-2xl border border-white/[0.08] bg-[#0B0F19]/40 p-6 backdrop-blur-md shadow-[0_0_0_1px_rgba(0,0,0,0.45)_inset] sm:p-7">
              <p className="text-[14px] leading-relaxed text-zinc-300">I build systems first for my own work.</p>
              <p className="mt-3 text-[14px] leading-relaxed text-zinc-300">Then test them under pressure.</p>
              <p className="mt-3 text-[14px] leading-relaxed text-zinc-300">
                Then refine them until they create real leverage.
              </p>
              <p className="mt-5 text-[14px] leading-relaxed text-zinc-400">
                That same mindset powers Stratxcel.
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-zinc-400">
                We don&apos;t sell random services. We build solutions that remove friction and create momentum.
              </p>
            </div>
            <p className="mt-6 text-[12px] tracking-[0.02em] text-zinc-400">Quiet execution. Visible outcomes.</p>
          </div>
        </SectionReveal>
      </section>

      <section id="cases" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Use Cases</p>
            <h2 className="sx-heading-space mt-3">Real operational scenarios we solve.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Every business has different symptoms. Most share the same root problem: weak systems.
            </p>
            <ul className="mt-10 grid list-none gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {useCases.map((c) => (
                <li
                  key={c.title}
                  className="flex flex-col rounded-xl border border-white/[0.08] bg-[#0B0F19]/40 p-5 backdrop-blur-md transition-[border-color,box-shadow,transform] duration-[600ms] ease-out hover:-translate-y-0.5 hover:border-sky-500/18 hover:shadow-[0_0_44px_-20px_rgba(59,130,246,0.14)]"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Case {c.tag}</span>
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

      <section id="results" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Results</p>
            <h2 className="sx-heading-space mt-3">What better systems usually create.</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Faster response times",
                "Better lead consistency",
                "Less founder overload",
                "Clearer operations",
                "Higher team accountability",
                "Better decision visibility",
                "Smoother growth capacity",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/[0.08] bg-[#0B0F19]/38 px-4 py-4 text-[13px] font-medium tracking-[-0.01em] text-zinc-200 backdrop-blur-md"
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-6 text-[12px] tracking-[0.02em] text-zinc-400">
              Results vary by business stage, team quality, and execution speed.
            </p>
          </div>
        </SectionReveal>
      </section>

      <section id="why-now" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container sx-container--narrow">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Why This Matters Now</p>
            <h2 className="sx-heading-space mt-3">Growth gets expensive when inefficiency compounds.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Most businesses try to grow on top of broken systems.
            </p>
            <p className="sx-prose-space sx-prose-space--wide mt-3">
              That creates stress, waste, delays, and invisible leakage.
            </p>
            <p className="sx-prose-space sx-prose-space--wide mt-3">
              Fixing systems early compounds future growth.
            </p>
          </div>
        </SectionReveal>
      </section>

      <section id="consultation" className="sx-section-space sx-section-space--ridge">
        <SectionReveal>
          <div className="sx-container">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">How We Work</p>
            <h2 className="sx-heading-space mt-3">Diagnosis first. Build second.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Every engagement starts with a structured diagnosis to map flow, reveal constraints, and determine fit.
            </p>
            <p className="mt-5 text-[12px] tracking-[0.02em] text-zinc-400">Selective engagements only.</p>
            <ol className="mt-8 grid list-none gap-4 pl-0 md:grid-cols-3">
              {[
                ["1 - Request", 'You submit business context, bottlenecks, and what "fixed" means in the next 90 days.'],
                ["2 - Diagnose", "We map current-state systems, identify breakpoints, and define sequence priorities."],
                ["3 - Execute (optional)", "If fit is strong, we design and implement your execution architecture together."],
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
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Entry Gate</p>
            <h2 className="sx-heading-space mt-3">Intent before fee. Clarity before commitment.</h2>
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
              You may not need more marketing.
              <br />
              You may need better operations.
            </h2>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Link href="/#pricing" className={ctaPrimaryClass}>
                Request Business Diagnosis
              </Link>
            </div>
            <p className="mt-5 text-[12px] tracking-[0.02em] text-zinc-400">For serious operators only.</p>
          </div>
        </SectionReveal>
      </section>

      <section id="careers" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Careers</p>
            <h2 className="sx-heading-space mt-3">Join a system, not a company.</h2>
            <p className="mt-3 text-[15px] font-medium tracking-[-0.02em] text-zinc-300">Join a system, not a company.</p>
            <p className="sx-prose-space sx-prose-space--wide mt-4">
              For operators who want execution depth, system discipline, and real responsibility.
            </p>
            <p className="mt-5 text-[12px] tracking-[0.02em] text-zinc-400">Long-term thinking over quick hacks.</p>
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
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Contact</p>
            <h2 className="sx-heading-space mt-3">Request a serious business diagnosis.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              Share context, constraints, and the outcome you need in the next 90 days. We reply with a direct, practical
              read — not a generic brochure.
            </p>
            <p className="mt-5 text-[12px] tracking-[0.02em] text-zinc-400">Quiet execution. Visible outcomes.</p>
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
