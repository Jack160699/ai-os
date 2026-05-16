import dynamic from "next/dynamic";
import Link from "next/link";
import { CONTACT, SOCIAL } from "@stratxcel/config";
import { HeroCinematic } from "./HeroCinematic";
import { SectionReveal } from "./SectionReveal";
import { SectionSystemGraphic } from "./SectionSystemGraphic";

const TrustCredibilitySection = dynamic(() =>
  import("./TrustCredibilitySection").then((m) => ({ default: m.TrustCredibilitySection }))
);
const ServicesSection = dynamic(() => import("./ServicesSection").then((m) => ({ default: m.ServicesSection })));
const WhoWeHelpSection = dynamic(() => import("./WhoWeHelpSection").then((m) => ({ default: m.WhoWeHelpSection })));
const HowWeWorkSection = dynamic(() => import("./HowWeWorkSection").then((m) => ({ default: m.HowWeWorkSection })));
const FinalConversionCta = dynamic(() => import("./FinalConversionCta").then((m) => ({ default: m.FinalConversionCta })));
const PricingGate = dynamic(() => import("./PricingGate").then((m) => ({ default: m.PricingGate })), {
  loading: () => <div className="min-h-[220px] rounded-2xl border border-white/[0.06] bg-[#0B0F19]/15" aria-hidden />,
});

const ctaPrimaryClass =
  "sx-cta-primary inline-flex h-[52px] min-h-[50px] items-center justify-center rounded-full border border-sky-500/28 bg-[#0B0F19]/95 px-8 text-[14px] font-semibold tracking-[-0.015em] text-[#E5E7EB] active:translate-y-0";

export function HomePageContent() {
  const socialRows = [
    ["LinkedIn", SOCIAL.linkedin],
    ["Instagram", SOCIAL.instagram],
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
  return (
    <>
      <HeroCinematic />

      <div className="sx-page-below-hero">
      <TrustCredibilitySection />

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

      <ServicesSection />

      <WhoWeHelpSection />

      <HowWeWorkSection />

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
                  className="rounded-2xl border border-white/[0.08] bg-[#0B0F19]/45 p-6 backdrop-blur-md shadow-[0_0_0_1px_rgba(0,0,0,0.45)_inset] transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-sky-500/18 hover:shadow-[0_0_40px_-22px_rgba(59,130,246,0.16)] sm:p-7"
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
                  className="flex flex-col rounded-xl border border-white/[0.08] bg-[#0B0F19]/40 p-5 backdrop-blur-md transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-sky-500/18 hover:shadow-[0_0_44px_-20px_rgba(59,130,246,0.14)]"
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
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Next step</p>
            <h2 className="sx-heading-space mt-3">Ready for a focused diagnosis?</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              When you want depth beyond a quick chat, we start with one structured session to map priorities and fit.
            </p>
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
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Business Diagnosis Access</p>
            <h2 className="sx-heading-space mt-3">Clarity is cheaper than confusion.</h2>
            <p className="sx-prose-space sx-prose-space--wide">
              One focused session can reveal what months of guessing cannot.
            </p>
            <PricingGate />
          </div>
        </SectionReveal>
      </section>

      <FinalConversionCta />

      <section id="contact" className="sx-section-space">
        <SectionReveal>
          <div className="sx-container sx-container--narrow text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Contact</p>
            <h2 className="sx-heading-space mt-3">Start the right conversation.</h2>
            <p className="mx-auto mt-4 max-w-[58ch] text-[15px] leading-relaxed text-zinc-400">
              If growth feels harder than it should, there may be a systems reason.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/#pricing" className={ctaPrimaryClass}>
                Request Diagnosis
              </Link>
              <a
                href={`https://wa.me/${String(CONTACT.whatsapp || "").replace(/[^\d]/g, "")}`}
                className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.04] px-8 text-[14px] font-semibold tracking-[-0.015em] text-[#E5E7EB] backdrop-blur-md transition-[border-color,background-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.08] active:translate-y-0"
                target="_blank"
                rel="noopener noreferrer"
              >
                Message on WhatsApp
              </a>
            </div>
            <p className="mt-5 text-[12px] tracking-[0.02em] text-zinc-400">Quiet execution. Visible outcomes.</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {socialRows.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="sx-social-space"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                >
                  {label.slice(0, 1)}
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
    </div>
    </>
  );
}
