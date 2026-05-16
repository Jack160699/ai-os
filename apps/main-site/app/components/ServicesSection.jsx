import Link from "next/link";
import { SectionReveal } from "./SectionReveal";

const SERVICES = [
  {
    title: "More Customers",
    description: "Help more people discover your business online.",
    Icon: IconCustomers,
  },
  {
    title: "Better Online Presence",
    description: "Modern websites and stronger branding.",
    Icon: IconPresence,
  },
  {
    title: "Faster Replies",
    description: "Respond to customers quickly and automatically.",
    Icon: IconReplies,
  },
  {
    title: "Save Time",
    description: "Reduce repetitive manual work.",
    Icon: IconTime,
  },
  {
    title: "Better Marketing",
    description: "Ads and content designed to convert.",
    Icon: IconMarketing,
  },
  {
    title: "Business Growth",
    description: "Systems built to help your business scale.",
    Icon: IconGrowth,
  },
];

function IconCustomers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M16 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0ZM8 10a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0ZM19 18v-.5a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4v.5M3 18v-.5a3 3 0 0 1 3-3h1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPresence() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconReplies() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M8 10h.01M12 10h.01M16 10h.01M5 18l1.5-3H18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTime() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v4l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMarketing() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M6 10v4M10 8v8M14 6v12M18 9v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconGrowth() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 16l5-5 4 4 6-6M14 9h5v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ServicesSection() {
  return (
    <section id="services" className="sx-section-space">
      <SectionReveal>
        <div className="sx-container">
          <header className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Services</p>
            <h2 className="sx-heading-space mt-3 text-balance">Clear help for everyday business goals.</h2>
            <p className="sx-prose-space sx-prose-space--wide mt-4 text-stone-600">
              No buzzwords — just work that helps you sell more, look sharper, and move faster.
            </p>
          </header>

          <ul className="mt-12 grid list-none gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:mt-16 lg:grid-cols-3 lg:gap-6">
            {SERVICES.map(({ title, description, Icon }) => (
              <li key={title}>
                <article className="group h-full rounded-2xl border border-stone-200/90 bg-white/95 p-6 shadow-sm transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md sm:p-7">
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200/90 bg-stone-50 text-stone-700 transition-colors duration-300 group-hover:border-stone-300 group-hover:bg-white"
                    aria-hidden
                  >
                    <Icon />
                  </div>
                  <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-stone-900">{title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-stone-600">{description}</p>
                </article>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-center text-[13px] text-stone-600 sm:mt-14">
            Not sure what you need first?{" "}
            <Link href="/#contact" className="font-medium text-stone-900 underline-offset-4 transition-colors hover:text-stone-950">
              Talk to us
            </Link>{" "}
            — we&apos;ll point you in the right direction.
          </p>
        </div>
      </SectionReveal>
    </section>
  );
}
