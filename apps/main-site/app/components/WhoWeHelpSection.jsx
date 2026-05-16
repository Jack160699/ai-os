import { SectionReveal } from "./SectionReveal";

const AUDIENCES = [
  "Startups",
  "Local Businesses",
  "Gyms",
  "Clinics",
  "Coaches",
  "D2C Brands",
  "Creators",
  "Real Estate",
];

export function WhoWeHelpSection() {
  return (
    <section id="who-we-help" className="sx-section-space">
      <SectionReveal>
        <div className="sx-container">
          <header className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Who We Help</p>
            <h2 className="sx-heading-space mt-3 text-balance">If this sounds like you, you&apos;re in the right place.</h2>
            <p className="sx-prose-space sx-prose-space--wide mt-4 text-stone-600">
              Find your fit — we shape websites, ads, and follow-ups around how your business actually runs.
            </p>
          </header>

          <ul className="mt-10 grid list-none grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:mt-14 lg:grid-cols-4 lg:gap-5">
            {AUDIENCES.map((label) => (
              <li key={label}>
                <article
                  className="group flex h-full min-h-[5.5rem] flex-col justify-center rounded-2xl border border-stone-200/90 bg-white/95 px-4 py-5 shadow-sm transition-[border-color,box-shadow,transform,background-color] duration-300 ease-out sm:min-h-[6rem] sm:px-5 sm:py-6 lg:px-6 lg:py-7 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white hover:shadow-md"
                >
                  <span
                    className="mb-2 block h-px w-6 rounded-full bg-gradient-to-r from-stone-400/60 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                  />
                  <h3 className="text-[14px] font-semibold leading-snug tracking-[-0.02em] text-stone-900 sm:text-[15px] lg:text-[15px]">
                    {label}
                  </h3>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </SectionReveal>
    </section>
  );
}
