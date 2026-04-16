import Link from "next/link";
import { BookDiagnosisCheckoutButton } from "@stratxcel/ui";
import { CONTACT } from "@stratxcel/config";

export function HomePageContent() {
  const trust = [
    "Stratxcel OPC Private Limited",
    "MSME Registered",
    "GST Registered",
    "Startup India Recognized",
    "DPIIT Recognized",
  ];
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

  return (
    <>
      {/* Hero */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Stratxcel OPC Private Limited
          </p>
          <h1 className="mt-3 max-w-[26ch] text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--sx-navy)] sm:text-5xl">
            We build systems serious businesses can grow on.
          </h1>
          <p className="mt-4 max-w-[62ch] text-[16px] leading-[1.65] text-zinc-600 sm:text-[17px]">
            Operations, automation, talent, and execution frameworks built for ambitious Indian businesses.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/#contact"
              className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-7 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[var(--sx-navy-soft)] active:scale-[0.99]"
            >
              Book Consultation
            </Link>
            <Link
              href="/#how-we-work"
              className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-zinc-300 bg-white px-7 text-[15px] font-semibold text-[var(--sx-navy)] transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              See How We Work
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-zinc-100 bg-zinc-50/60 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-medium text-zinc-600">
            {trust.map((t) => (
              <span key={t} className="whitespace-nowrap">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* What we solve */}
      <section id="about" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">
            A founder-led systems company for serious Indian businesses.
          </h2>
          <p className="mt-4 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            Stratxcel helps businesses grow through better systems, sharper execution, modern operations,
            automation, and disciplined business thinking. We work selectively and commit fully.
          </p>
        </div>
      </section>

      {/* How we work */}
      <section id="how-we-work" className="scroll-mt-[72px] border-b border-zinc-100 bg-zinc-50/40 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">How We Work</h2>
          <p className="mt-4 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            We do not sell tools first. We earn trust through clarity, execution, and systems that hold under
            real operating pressure.
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

      {/* What we solve / build */}
      <section id="work" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">What We Solve</h2>
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
          <h3 className="mt-10 text-lg font-semibold tracking-tight text-[var(--sx-navy)]">What We Build</h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Business Systems",
              "Automation Workflows",
              "Operational Frameworks",
              "Revenue Infrastructure",
              "Talent Readiness Programs",
              "Growth Execution Models",
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
            Examples of operational outcomes that matter to leadership teams.
          </p>
          <ul className="mt-6 space-y-3">
            {["+32% faster lead response", "3x follow-up consistency", "18 hrs/week saved"].map((line) => (
              <li key={line} className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-700">
                <span className="font-semibold text-[var(--sx-navy)]">{line}</span>
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
            We work selectively. We commit fully. We value outcomes over noise.
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
              Built with ownership, not outsourcing.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-zinc-700">
              Most businesses do not need more tools.
              <br />
              They need better systems and stronger execution.
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
          <h2 className="text-xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-2xl">Careers</h2>
          <p className="mt-4 max-w-[72ch] text-[15px] leading-[1.7] text-zinc-600">
            Build real-world skills, not just certificates. We hire serious learners and operators.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => (
              <Link
                key={r.slug}
                href={`/careers/${r.slug}`}
                className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-4 text-[14px] font-semibold text-[var(--sx-navy)] transition hover:bg-zinc-50"
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
            Start with a diagnosis session. Clear scope, clear next steps.
          </p>
          <div className="mt-8 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.12)] ring-1 ring-zinc-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Diagnosis</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--sx-navy)]">
              ₹499
              <span className="ml-2 text-base font-medium text-zinc-500">per session</span>
            </p>
            <p className="mt-3 text-sm leading-[1.7] text-zinc-600">
              Secure checkout. Calendar coordination after payment.
            </p>
            <div className="mt-8">
              <BookDiagnosisCheckoutButton />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="final-cta" className="scroll-mt-[72px] bg-[var(--sx-navy)] py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
            If growth feels harder than it should, your systems need attention.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-[1.7] text-zinc-300">
            Founder-led, implementation-first, and committed to outcomes that hold under real business pressure.
          </p>
          <div className="mt-10">
            <Link
              href="/#contact"
              className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-white px-8 text-[15px] font-semibold text-[var(--sx-navy)] shadow-sm transition hover:bg-zinc-100"
            >
              Book a Consultation
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
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={`mailto:${CONTACT.email}?subject=Consultation%20Request%20%E2%80%94%20Stratxcel`}
              className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-7 text-[15px] font-semibold text-white transition hover:bg-[var(--sx-navy-soft)]"
            >
              Email — {CONTACT.email}
            </Link>
            <span className="text-sm text-zinc-600 sm:ml-2">
              Phone/WhatsApp: {CONTACT.phone}
            </span>
            <Link
              href="/#pricing"
              className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-zinc-300 bg-white px-7 text-[15px] font-semibold text-[var(--sx-navy)] transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Diagnosis session — ₹499
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
