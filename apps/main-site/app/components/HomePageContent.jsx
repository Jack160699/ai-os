"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookDiagnosisCheckoutButton } from "@stratxcel/ui";
import { DashboardMockup } from "@/app/components/DashboardMockup";

const sectionEase = [0.22, 1, 0.36, 1];

const fadeUp = (reduce, delay = 0) => ({
  initial: reduce ? false : { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: reduce ? { duration: 0 } : { duration: 0.45, delay, ease: sectionEase },
});

export function HomePageContent() {
  const reduce = useReducedMotion();
  const trustBadges = [
    "Stratxcel OPC Private Limited",
    "MSME Registered",
    "Startup India Recognized",
    "Built for Growth-Focused Businesses",
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-14 sm:gap-16 sm:px-6 sm:pb-28 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center lg:gap-20">
          <div>
            <motion.p
              className="text-[13px] font-semibold uppercase tracking-[0.14em] text-zinc-500"
              {...fadeUp(reduce, 0)}
            >
              Stratxcel OPC Private Limited
            </motion.p>
            <motion.h1
              className="mt-4 max-w-xl text-[2.125rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--sx-navy)] sm:text-5xl sm:leading-[1.08]"
              {...fadeUp(reduce, 0.04)}
            >
              We build systems serious businesses can grow on.
            </motion.h1>
            <motion.p
              className="mt-5 max-w-lg text-[17px] leading-relaxed text-zinc-600 sm:text-lg"
              {...fadeUp(reduce, 0.08)}
            >
              Operations, automation, talent, and execution frameworks built for ambitious Indian businesses.
            </motion.p>
            <motion.div
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 0.14, ease: sectionEase }}
            >
              <Link
                href="/contact"
                className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-7 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[var(--sx-navy-soft)] active:scale-[0.99]"
              >
                Book Consultation
              </Link>
              <Link
                href="/how-we-work"
                className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-zinc-300 bg-white px-7 text-[15px] font-semibold text-[var(--sx-navy)] transition hover:border-zinc-400 hover:bg-zinc-50"
              >
                See How We Work
              </Link>
            </motion.div>
          </div>
          <motion.div
            className="relative flex justify-center lg:justify-end"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.55, delay: 0.12, ease: sectionEase }}
          >
            <motion.div
              animate={reduce ? { y: 0 } : { y: [0, -6, 0] }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      duration: 7,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
            >
              <DashboardMockup />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-zinc-100 bg-zinc-50/60 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustBadges.map((badge) => (
              <motion.div
                key={badge}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-center sm:text-left"
                {...fadeUp(reduce, 0)}
              >
                <p className="text-[13px] font-semibold tracking-tight text-[var(--sx-navy)]">{badge}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What we solve */}
      <section id="solve" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp(reduce, 0)}>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-3xl">
              What We Solve
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600">
              We remove core execution bottlenecks that slow growth and dilute leadership focus.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Operational chaos",
                body: "Undefined workflows and unclear accountability.",
              },
              {
                title: "Slow follow-up",
                body: "Delayed responses and inconsistent lead handling.",
              },
              {
                title: "Weak execution",
                body: "Plans without operating rhythm or scorecards.",
              },
              {
                title: "Manual processes",
                body: "Teams losing hours in repeatable tasks.",
              },
              {
                title: "Growth bottlenecks",
                body: "Revenue blocked by fragmented systems.",
              },
              {
                title: "Owner dependency",
                body: "Businesses that cannot scale without constant founder intervention.",
              },
            ].map((card, i) => (
              <motion.article
                key={card.title}
                className="group rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm ring-1 ring-zinc-100 transition-shadow hover:shadow-md"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={reduce ? { duration: 0 } : { duration: 0.4, delay: i * 0.06, ease: sectionEase }}
                whileHover={reduce ? {} : { y: -3, transition: { duration: 0.22, ease: sectionEase } }}
              >
                <h3 className="text-lg font-semibold tracking-tight text-[var(--sx-navy)]">{card.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-zinc-600">{card.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* What we build */}
      <section id="build" className="scroll-mt-[72px] border-b border-zinc-100 bg-zinc-50/40 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp(reduce, 0)}>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-3xl">
              What We Build
            </h2>
            <p className="mt-3 max-w-xl text-[15px] text-zinc-600">
              Structured systems for consistent growth, cleaner operations, and better team execution.
            </p>
          </motion.div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Business Systems",
              "Automation Workflows",
              "Operational Frameworks",
              "Revenue Infrastructure",
              "Talent Readiness Programs",
              "Growth Execution Models",
            ].map((item, i) => (
              <motion.li
                key={item}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-[14px] font-medium text-[var(--sx-navy)]"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={reduce ? { duration: 0 } : { duration: 0.35, delay: i * 0.04, ease: sectionEase }}
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Results */}
      <section id="results" className="scroll-mt-[72px] border-b border-zinc-100 bg-zinc-50/40 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp(reduce, 0)}>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-3xl">Results</h2>
            <p className="mt-3 max-w-xl text-[15px] text-zinc-600">Real business outcomes from execution-driven systems.</p>
          </motion.div>
          <ul className="mt-12 space-y-6">
            {[
              "+32% faster lead response",
              "3x follow-up consistency",
              "18 hrs/week saved",
            ].map((line, i) => (
              <motion.li
                key={line}
                className="flex items-start gap-4 rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 shadow-sm sm:px-6 sm:py-5"
                initial={reduce ? false : { opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={reduce ? { duration: 0 } : { duration: 0.4, delay: i * 0.07, ease: sectionEase }}
              >
                <span
                  className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--sx-accent)]"
                  aria-hidden
                />
                <span className="text-[16px] font-medium leading-snug text-[var(--sx-navy)]">{line}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why Stratxcel */}
      <section id="why" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div className="max-w-2xl" {...fadeUp(reduce, 0)}>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-3xl">
              Why Stratxcel
            </h2>
            <p className="mt-6 text-xl font-medium leading-snug tracking-tight text-[var(--sx-navy)] sm:text-2xl">
              We work selectively.
              <br />
              <span className="text-zinc-600">We commit fully. We value outcomes over noise.</span>
            </p>
          </motion.div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              "Deep Commitment — we stay close to the system until it works in real operating conditions.",
              "Systems Thinking — every workflow is designed for compounding reliability, not short-term hacks.",
              "Long-Term Value — implementation quality that supports future scale, hiring, and governance.",
            ].map((text, i) => (
              <motion.li
                key={i}
                className="rounded-2xl border border-zinc-200/90 bg-zinc-50/50 px-5 py-5 text-[14px] leading-relaxed text-zinc-700 ring-1 ring-zinc-100"
                {...fadeUp(reduce, 0.05 * i)}
              >
                {text}
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Founder note */}
      <section id="founder-note" className="scroll-mt-[72px] border-b border-zinc-100 bg-zinc-50/40 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.article
            className="rounded-2xl border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-10"
            {...fadeUp(reduce, 0)}
          >
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
          </motion.article>
        </div>
      </section>

      {/* Careers */}
      <section id="careers" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp(reduce, 0)}>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-3xl">
              Build real-world skills, not just certificates.
            </h2>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-zinc-600">
              At Stratxcel, students and freshers gain practical business experience, real project exposure,
              mentorship, field learning, and industry discipline.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Business Development Intern", "Learn sales, communication, lead generation, and growth systems."],
              ["Marketing Intern", "Work on brand campaigns, content systems, and performance basics."],
              ["Operations Intern", "Build workflow discipline, execution quality, and coordination habits."],
              ["IT / Tech Intern", "Contribute to web systems, dashboards, automation tools, and AI workflows."],
              ["Finance Intern", "Understand GST basics, invoicing, reporting, and business finance operations."],
              ["HR / Talent Intern", "Learn hiring fundamentals, people systems, and team coordination."],
            ].map(([title, body], i) => (
              <motion.article
                key={title}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={reduce ? { duration: 0 } : { duration: 0.35, delay: i * 0.05, ease: sectionEase }}
                whileHover={reduce ? {} : { y: -2, transition: { duration: 0.2 } }}
              >
                <h3 className="text-[16px] font-semibold text-[var(--sx-navy)]">{title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{body}</p>
              </motion.article>
            ))}
          </div>
          <motion.div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6" {...fadeUp(reduce, 0.1)}>
            <p className="text-sm font-medium text-zinc-700">
              Eligible: BBA, MBA, BCA, MCA, B.Com, M.Com, CS, IT, Sales, Commerce — serious learners only.
            </p>
            <p className="mt-3 text-sm text-zinc-600">
              Benefits: Real work, mentorship, live projects, certificates, professional growth, and industry readiness.
            </p>
            <Link
              href="/careers"
              className="mt-6 inline-flex h-11 min-h-[44px] items-center justify-center rounded-full bg-[var(--sx-navy)] px-6 text-[14px] font-semibold text-white transition hover:bg-[var(--sx-navy-soft)]"
            >
              Apply for Internship
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Future vision */}
      <section id="vision" className="scroll-mt-[72px] border-b border-zinc-100 bg-zinc-50/40 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.h2 className="text-2xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-3xl" {...fadeUp(reduce, 0)}>
            The future belongs to businesses that operate like software.
          </motion.h2>
          <motion.p className="mt-5 text-[16px] leading-relaxed text-zinc-600" {...fadeUp(reduce, 0.05)}>
            Stratxcel is building the systems layer for modern Indian companies — where growth is clearer,
            teams move faster, and execution becomes dependable.
          </motion.p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp(reduce, 0)}>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-3xl">Pricing</h2>
            <p className="mt-3 max-w-xl text-[15px] text-zinc-600">
              Start with a diagnosis session. Clear scope, clear next steps.
            </p>
          </motion.div>
          <motion.div
            className="mt-12 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.12)] ring-1 ring-zinc-100"
            {...fadeUp(reduce, 0.06)}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Diagnosis</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--sx-navy)]">
              ₹499
              <span className="ml-2 text-base font-medium text-zinc-500">per session</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Secure checkout. Calendar coordination after payment.
            </p>
            <div className="mt-8">
              <BookDiagnosisCheckoutButton />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="final-cta" className="scroll-mt-[72px] bg-[var(--sx-navy)] py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.h2
            className="text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl"
            {...fadeUp(reduce, 0)}
          >
            If growth feels harder than it should, your systems need attention.
          </motion.h2>
          <motion.p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-300" {...fadeUp(reduce, 0.04)}>
            Founder-led, implementation-first, and committed to outcomes that hold under real business pressure.
          </motion.p>
          <motion.div className="mt-10" {...fadeUp(reduce, 0.08)}>
            <Link
              href="/contact"
              className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-white px-8 text-[15px] font-semibold text-[var(--sx-navy)] shadow-sm transition hover:bg-zinc-100"
            >
              Book a Consultation
            </Link>
          </motion.div>
          <p className="mt-5 text-xs text-zinc-400">
            — Shriyansh Chandrakar, Founder
          </p>
        </div>
      </section>
    </>
  );
}
