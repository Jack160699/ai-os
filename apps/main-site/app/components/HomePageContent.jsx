import Image from "next/image";
import Link from "next/link";
import { BookDiagnosisCheckoutButton } from "@stratxcel/ui";
import { CONTACT, SOCIAL } from "@stratxcel/config";

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
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-100 bg-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(15,23,42,0.045),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
          <div className="relative lg:min-h-[4.5rem]">
            <Link
              href="/"
              className="mb-10 inline-flex w-fit shrink-0 lg:absolute lg:right-0 lg:top-0 lg:mb-0"
              aria-label="Stratxcel home"
            >
              <Image
                src="/logo-v2.png"
                alt="Stratxcel"
                width={220}
                height={64}
                className="h-8 w-auto sm:h-9 lg:h-10"
                priority
              />
            </Link>
            <div className="max-w-[40rem] lg:max-w-[46rem] lg:pr-48">
              <h1 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-[var(--sx-navy)] sm:text-[2.75rem] sm:leading-[1.08] lg:text-5xl lg:leading-[1.06]">
                Your business doesn’t need more effort.
                <br />
                It needs better systems.
              </h1>
              <p className="mt-5 max-w-[38rem] text-[15px] leading-[1.7] text-zinc-600 sm:text-[17px] sm:leading-[1.65]">
                We uncover growth bottlenecks, fix execution gaps, and build systems that help serious businesses
                scale.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3">
                <Link
                  href="/#pricing"
                  className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-7 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition hover:bg-[var(--sx-navy-soft)] active:scale-[0.99] sm:min-w-[12rem]"
                >
                  Request Business Diagnosis
                </Link>
                <Link
                  href="/#how-we-work"
                  className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-zinc-200 bg-white/80 px-7 text-[15px] font-semibold text-[var(--sx-navy)] backdrop-blur-sm transition hover:border-zinc-300 hover:bg-white sm:min-w-[12rem]"
                >
                  See How We Work
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Positioning */}
      <section id="about" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">
            Stratxcel is a systems company, not an agency.
          </h2>
          <p className="mt-4 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            Most businesses stay stuck because they keep fixing symptoms instead of systems. We do not optimize
            tasks. We redesign how your business operates.
          </p>
        </div>
      </section>

      {/* How we work */}
      <section id="how-we-work" className="scroll-mt-[72px] border-b border-zinc-100 bg-zinc-50/40 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">How We Work</h2>
          <p className="mt-4 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            Why trust us? Because we diagnose before we prescribe, execute before we claim, and stay involved
            until systems hold under pressure.
          </p>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["Diagnose", "Commercial bottlenecks, workflow constraints, and team realities."],
              ["Design", "System architecture, owners, cadence, and success metrics."],
              ["Implement", "Ship workflows and execution rails in weekly cycles."],
              ["Stabilize", "Tune, document, and harden for long-term reliability."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-[var(--sx-navy)]">{t}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-zinc-600">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why people come to us */}
      <section id="work" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">
            Why people come to us
          </h2>
          <p className="mt-4 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            Operations feel messy. Leads are inconsistent. Teams move slowly. Too much depends on the owner.
            Growth feels harder than it should.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Operational chaos",
              "Slow follow-up",
              "Weak execution",
              "Manual processes",
              "Growth bottlenecks",
              "Owner dependency",
              "Untrained teams",
            ].map((item) => (
              <li key={item} className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-3 text-sm text-zinc-700">
                {item}
              </li>
            ))}
          </ul>
          <h3 className="mt-10 text-lg font-semibold tracking-tight text-[var(--sx-navy)]">
            What we actually build
          </h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Lead systems",
              "Follow-up systems",
              "Internal dashboards",
              "Automation workflows",
              "Execution systems",
              "Hiring pipelines",
            ].map((item) => (
              <li key={item} className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Results */}
      <section id="results" className="scroll-mt-[72px] border-b border-zinc-100 bg-zinc-50/40 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">Results</h2>
          <p className="mt-4 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            Use-case scenarios from recurring business problems we solve through systems.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {useCases.map((line) => (
              <li key={line} className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-700">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why Stratxcel */}
      <section id="why" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">Why Stratxcel</h2>
          <p className="mt-4 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            Most businesses stay stuck when effort increases but systems stay weak. We work selectively, stay
            involved, and build for long-term value.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Deep Commitment", "We stay close to the system until it works in real operating conditions."],
              ["Systems Thinking", "Workflows designed for compounding reliability, not short-term hacks."],
              ["Long-Term Value", "Implementation quality that supports scale, hiring, and governance."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-4">
                <p className="text-sm font-semibold text-[var(--sx-navy)]">{t}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder note */}
      <section id="founder-note" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <article className="rounded-2xl border border-zinc-200 bg-zinc-50/40 px-6 py-8 sm:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Founder note</p>
            <p className="mt-5 text-[18px] leading-relaxed text-[var(--sx-navy)] sm:text-[20px]">
              Built by a founder who believes trust is earned through action, not promises.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-zinc-700">
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
            <p className="mt-6 text-sm text-zinc-500">
              — Shriyansh Chandrakar
              <br />
              Founder, Stratxcel OPC Private Limited
            </p>
          </article>
        </div>
      </section>

      {/* Careers */}
      <section id="careers" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">
            Start where real experience begins.
          </h2>
          <p className="mt-4 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            SECTION 1 — INTERNS (18-22): Do not do internships that teach nothing. Work on real systems, real
            businesses, and real execution.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {roles.slice(0, 6).map((r) => (
              <Link
                key={r.slug}
                href={`/careers/${r.slug}`}
                className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-4 text-[14px] font-semibold text-[var(--sx-navy)] transition hover:bg-zinc-50"
              >
                {r.title}
              </Link>
            ))}
          </div>
          <p className="mt-10 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            SECTION 2 — FULL-TIME (22+): Work directly on building and scaling a real company.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {roles.slice(6).map((r) => (
              <Link
                key={r.slug}
                href={`/careers/${r.slug}`}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-[14px] font-semibold text-[var(--sx-navy)] transition hover:bg-zinc-50"
              >
                {r.title}
              </Link>
            ))}
          </div>
          <p className="mt-8 text-sm text-zinc-600">
            Eligible: BBA, MBA, BCA, MCA, B.Com, M.Com, CS, IT, Sales, Commerce — serious learners.
          </p>
        </div>
      </section>

      {/* Future vision */}
      <section id="vision" className="scroll-mt-[72px] border-b border-zinc-100 bg-zinc-50/40 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">
            The future belongs to businesses that operate like software.
          </h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-zinc-600">
            Stratxcel is building the systems layer for modern Indian companies — where growth is clearer,
            teams move faster, and execution becomes dependable.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">Pricing</h2>
          <p className="mt-4 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            This is not a call. This is a structured diagnosis.
          </p>
          <div className="mt-8 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.12)] ring-1 ring-zinc-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Business Diagnosis</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--sx-navy)]">
              ₹2200
              <span className="ml-2 text-base font-medium text-zinc-500">per session</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm leading-[1.7] text-zinc-600">
              <li>- Deep business analysis</li>
              <li>- System gap identification</li>
              <li>- Execution bottleneck mapping</li>
              <li>- Action plan</li>
            </ul>
            <p className="mt-4 text-xs font-medium text-zinc-500">
              Limited diagnosis slots each week to preserve execution quality.
            </p>
            <div className="mt-8">
              <BookDiagnosisCheckoutButton amount={2200} />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="final-cta" className="scroll-mt-[72px] bg-[var(--sx-navy)] py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
            If your business feels harder than it should,
            <br />
            it is not effort — it is your systems.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-[1.7] text-zinc-300">
            Get a clear diagnosis.
          </p>
          <div className="mt-10">
            <Link
              href="/#contact"
              className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-white px-8 text-[15px] font-semibold text-[var(--sx-navy)] shadow-sm transition hover:bg-zinc-100"
            >
              Get Business Diagnosis (₹2200)
            </Link>
          </div>
          <p className="mt-5 text-xs text-zinc-400">
            — Shriyansh Chandrakar, Founder
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-[72px] border-t border-zinc-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">
            Contact
          </h2>
          <p className="mt-4 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            Share your business context, bottlenecks, and the outcome you need in the next 90 days. We reply
            with a practical path forward.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {socialRows.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs font-semibold text-zinc-600 transition hover:border-zinc-400 hover:text-[var(--sx-navy)]"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
              >
                {label.slice(0, 2)}
              </a>
            ))}
            <a
              href={`mailto:${CONTACT.email}?subject=Consultation%20Request%20%E2%80%94%20Stratxcel`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs font-semibold text-zinc-600 transition hover:border-zinc-400 hover:text-[var(--sx-navy)]"
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
