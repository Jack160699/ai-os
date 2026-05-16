import Link from "next/link";
import { SOCIAL } from "@stratxcel/config";
import { SectionReveal } from "./SectionReveal";

const INDUSTRY_MARKS = [
  { mark: "Hc", name: "Healthcare" },
  { mark: "Rt", name: "Retail" },
  { mark: "Sv", name: "Services" },
  { mark: "Sa", name: "SaaS" },
  { mark: "Re", name: "Real estate" },
];

const TESTIMONIAL_PRIMARY = {
  quote:
    "They turned our scattered follow-ups into a simple rhythm. We finally know who owns what, and leads don’t go cold by accident.",
  role: "Founder",
  context: "Services company · India",
};

const TESTIMONIAL_SECONDARY = {
  quote: "Clear, calm, and practical — no jargon, just systems that fit how we work.",
  role: "Operations lead",
  context: "D2C brand",
};

const WA_THREAD = [
  { from: "them", text: "Hi — we’re losing leads after the first reply. Can you help?" },
  { from: "us", text: "Yes. We’ll map your follow-up flow and suggest a simple sequence your team can run daily." },
  { from: "them", text: "Sounds good. When can we start?" },
];

const RESULT_PILLARS = [
  { label: "Faster follow-ups", hint: "Less delay, more consistency" },
  { label: "Clearer ownership", hint: "Who does what, by when" },
  { label: "Simpler growth", hint: "Website, ads, automation aligned" },
];

function IndustryMarkStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-8 sm:gap-x-12 lg:gap-x-14">
      {INDUSTRY_MARKS.map((item) => (
        <div
          key={item.name}
          className="flex flex-col items-center gap-2.5 transition-opacity duration-300 hover:opacity-90"
        >
          <span
            className="flex h-10 min-w-[2.5rem] items-center justify-center rounded-2xl border border-stone-200/90 bg-white px-1.5 text-[11px] font-semibold tracking-tight text-stone-700 shadow-sm"
            aria-hidden
          >
            {item.mark}
          </span>
          <span className="select-none text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-500">
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProductPreviewMock() {
  return (
    <figure
      className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_0_rgb(255_255_255_0.95)_inset,0_24px_56px_-36px_rgb(28_25_23_/_0.08)]"
      aria-label="Stylized preview of a simple workflow dashboard (illustrative)"
    >
      <figcaption className="sr-only">Illustrative dashboard preview — not client-specific data.</figcaption>
      <div className="flex items-center gap-2 border-b border-stone-200/80 bg-stone-50/80 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-stone-300/90" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-stone-300/70" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-stone-300/50" aria-hidden />
        <span className="ml-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">Preview</span>
      </div>
      <div className="space-y-3 p-5 sm:p-6">
        <div className="flex gap-3">
          <div className="h-16 flex-1 rounded-xl bg-stone-100 ring-1 ring-stone-200/80" />
          <div className="hidden h-16 w-24 rounded-xl bg-stone-200/60 ring-1 ring-stone-200/90 sm:block" />
        </div>
        <div className="h-2 w-[42%] rounded-full bg-stone-200" />
        <div className="h-2 w-[68%] rounded-full bg-stone-200/80" />
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[72, 88, 64].map((w, i) => (
            <div
              key={i}
              className="h-20 rounded-lg bg-gradient-to-b from-stone-100 to-stone-50/30 ring-1 ring-stone-200/70"
              style={{ opacity: w / 100 }}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </figure>
  );
}

function WhatsAppMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-stone-200/80 bg-stone-50/80 px-4 py-3.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200/80"
          aria-hidden
        >
          <span className="text-[11px] font-bold text-emerald-800">SX</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold tracking-[-0.02em] text-stone-900">StratXcel</p>
          <p className="text-[11px] text-emerald-800/90">Typically replies same day</p>
        </div>
      </div>
      <div className="space-y-2.5 px-3 py-4 sm:px-4">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-500">Illustrative chat</p>
        {WA_THREAD.map((m, i) =>
          m.from === "them" ? (
            <div key={i} className="flex justify-start">
              <p className="max-w-[92%] rounded-2xl rounded-tl-md border border-stone-200/90 bg-stone-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-stone-700">
                {m.text}
              </p>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <p className="max-w-[92%] rounded-2xl rounded-tr-md border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-2.5 text-[13px] leading-relaxed text-emerald-950">
                {m.text}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function TestimonialCard({ quote, role, context, className = "" }) {
  return (
    <blockquote
      className={[
        "relative rounded-2xl border border-stone-200/90 bg-white/95 p-6 shadow-sm sm:p-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="mb-4 block font-serif text-4xl leading-none text-stone-300" aria-hidden>
        &ldquo;
      </span>
      <p className="text-[15px] font-medium leading-relaxed tracking-[-0.015em] text-stone-800 sm:text-[16px]">
        {quote}
      </p>
      <footer className="mt-6 border-t border-stone-200/80 pt-5">
        <p className="text-[12px] font-semibold text-stone-800">{role}</p>
        <p className="mt-0.5 text-[11px] tracking-[0.04em] text-stone-500">{context}</p>
      </footer>
    </blockquote>
  );
}

export function TrustCredibilitySection() {
  const linkedIn = SOCIAL.linkedin;

  return (
    <section id="trust-credibility" className="sx-section-space pt-12 pb-14 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
      <SectionReveal>
        <div className="sx-container">
          <header className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-[1.35rem] font-semibold leading-snug tracking-[-0.03em] text-stone-900 sm:text-[1.55rem] lg:text-[1.65rem]">
              Businesses trust StratXcel to simplify growth.
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[14px] leading-relaxed text-stone-600 sm:text-[15px]">
              Real teams, anonymized where needed. A calm snapshot of how we show up in work — not hype.
            </p>
          </header>

          <div className="mx-auto mt-14 max-w-3xl sm:mt-16 lg:mt-20">
            <IndustryMarkStrip />
          </div>

          <div className="mx-auto mt-14 max-w-lg sm:mt-16 lg:mt-20">
            <ProductPreviewMock />
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-10 sm:mt-16 sm:gap-12 lg:mt-20 lg:grid-cols-2 lg:items-start lg:gap-16">
            <TestimonialCard
              quote={TESTIMONIAL_PRIMARY.quote}
              role={TESTIMONIAL_PRIMARY.role}
              context={TESTIMONIAL_PRIMARY.context}
              className="transition-[border-color,box-shadow] duration-500 ease-out hover:border-stone-300 hover:shadow-md"
            />
            <div className="flex flex-col gap-8 lg:gap-10">
              <WhatsAppMock />
              <TestimonialCard
                quote={TESTIMONIAL_SECONDARY.quote}
                role={TESTIMONIAL_SECONDARY.role}
                context={TESTIMONIAL_SECONDARY.context}
                className="p-5 sm:p-6"
              />
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-4xl sm:mt-16 lg:mt-20">
            <ul className="grid gap-4 sm:grid-cols-3 sm:gap-5">
              {RESULT_PILLARS.map((item) => (
                <li
                  key={item.label}
                  className="rounded-2xl border border-stone-200/90 bg-white/90 px-5 py-5 text-center shadow-sm transition-[border-color,background-color] duration-300 ease-out hover:border-stone-300 hover:bg-white sm:py-6"
                >
                  <p className="text-[13px] font-semibold tracking-[-0.015em] text-stone-900">{item.label}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-stone-600">{item.hint}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center justify-center gap-4 border-t border-stone-200/80 pt-10 text-center sm:mt-14 sm:flex-row sm:flex-wrap sm:gap-6 sm:pt-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">Social proof</p>
            {linkedIn ? (
              <Link
                href={linkedIn}
                className="text-[13px] font-medium text-stone-600 underline-offset-4 transition-colors hover:text-stone-900"
                rel="noopener noreferrer"
                target="_blank"
              >
                Connect on LinkedIn
              </Link>
            ) : (
              <span className="text-[13px] text-stone-500">Follow us for updates</span>
            )}
            <span className="hidden h-4 w-px bg-stone-200 sm:block" aria-hidden />
            <ul className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-600">
              {["Registered Indian company", "Founder-led", "Selective engagements"].map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-stone-200/90 bg-stone-50 px-3 py-1.5 text-stone-600"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-[11px] leading-relaxed text-stone-500">
            Client names and screenshots are anonymized or illustrative to respect confidentiality. Outcomes vary by
            team, industry, and execution.
          </p>
        </div>
      </SectionReveal>
    </section>
  );
}
