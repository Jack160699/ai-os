"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookDiagnosisCheckoutButton } from "@stratxcel/ui";
import { CountUpNumber } from "@/app/components/CountUpNumber";
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
              Revenue systems
            </motion.p>
            <motion.h1
              className="mt-4 max-w-xl text-[2.125rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--sx-navy)] sm:text-5xl sm:leading-[1.08]"
              {...fadeUp(reduce, 0.04)}
            >
              We build systems that grow revenue.
            </motion.h1>
            <motion.p
              className="mt-5 max-w-lg text-[17px] leading-relaxed text-zinc-600 sm:text-lg"
              {...fadeUp(reduce, 0.08)}
            >
              AI, automation, and operating systems for serious businesses.
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
                Book Strategy Call
              </Link>
              <Link
                href="/#results"
                className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-zinc-300 bg-white px-7 text-[15px] font-semibold text-[var(--sx-navy)] transition hover:border-zinc-400 hover:bg-zinc-50"
              >
                See Results
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

      {/* Trust */}
      <section className="border-b border-zinc-100 bg-zinc-50/60 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {[
              {
                label: "Revenue influenced",
                node: (
                  <>
                    <CountUpNumber end={85} formatter={(n) => `₹${n}+`} />
                    <span className="text-zinc-600"> Lakhs</span>
                  </>
                ),
              },
              {
                label: "Systems built",
                node: (
                  <>
                    <CountUpNumber end={50} formatter={(n) => `${n}+`} />
                  </>
                ),
              },
              {
                label: "Hours saved",
                node: (
                  <>
                    <CountUpNumber end={1000} formatter={(n) => `${n.toLocaleString("en-IN")}+`} />
                  </>
                ),
              },
            ].map((m) => (
              <motion.div
                key={m.label}
                className="text-center sm:text-left"
                {...fadeUp(reduce, 0)}
              >
                <p className="text-3xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-4xl">
                  {m.node}
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-500">{m.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp(reduce, 0)}>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-3xl">
              Services
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600">
              Three ways we engage. Each engagement is scoped, measurable, and built for operators.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Revenue Systems",
                body: "Pipeline design, CRM discipline, and instrumentation so leadership sees signal — not noise.",
              },
              {
                title: "Operations Automation",
                body: "Workflows that remove manual handoffs without sacrificing control, auditability, or quality.",
              },
              {
                title: "AI Enablement",
                body: "Governed AI where it compounds: intake, routing, follow-ups, and reporting — not slide decks.",
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

      {/* Results */}
      <section id="results" className="scroll-mt-[72px] border-b border-zinc-100 bg-zinc-50/40 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp(reduce, 0)}>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-3xl">Results</h2>
            <p className="mt-3 max-w-xl text-[15px] text-zinc-600">Outcomes from live systems — not experiments.</p>
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

      {/* Why */}
      <section id="why" className="scroll-mt-[72px] border-b border-zinc-100 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div className="max-w-2xl" {...fadeUp(reduce, 0)}>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--sx-navy)] sm:text-3xl">
              Why Stratxcel
            </h2>
            <p className="mt-6 text-xl font-medium leading-snug tracking-tight text-[var(--sx-navy)] sm:text-2xl">
              {"We don't sell tools."}
              <br />
              <span className="text-zinc-600">We build systems that compound.</span>
            </p>
          </motion.div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              "Fast execution — senior-led delivery with weekly operating clarity.",
              "Business-first thinking — scope tied to revenue and risk, not vanity features.",
              "Clean implementation — documented, testable, handoff-ready systems.",
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
            If growth feels messy, systems are the bottleneck.
          </motion.h2>
          <motion.div className="mt-10" {...fadeUp(reduce, 0.08)}>
            <Link
              href="/contact"
              className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-white px-8 text-[15px] font-semibold text-[var(--sx-navy)] shadow-sm transition hover:bg-zinc-100"
            >
              Book a Call
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
