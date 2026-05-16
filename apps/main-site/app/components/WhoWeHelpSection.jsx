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
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Who We Help</p>
            <h2 className="sx-heading-space mt-3 text-balance">If this sounds like you, you&apos;re in the right place.</h2>
            <p className="sx-prose-space sx-prose-space--wide mt-4 text-zinc-500">
              Find your fit — we shape websites, ads, and follow-ups around how your business actually runs.
            </p>
          </header>

          <ul className="mt-10 grid list-none grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:mt-14 lg:grid-cols-4 lg:gap-5">
            {AUDIENCES.map((label) => (
              <li key={label}>
                <article
                  className="group flex h-full min-h-[5.5rem] flex-col justify-center rounded-2xl border border-white/[0.08] bg-[#0B0F19]/40 px-4 py-5 backdrop-blur-md shadow-[0_0_0_1px_rgba(0,0,0,0.42)_inset] transition-[border-color,box-shadow,transform,background-color] duration-300 ease-out sm:min-h-[6rem] sm:px-5 sm:py-6 lg:px-6 lg:py-7 hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-[#0B0F19]/55 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.12)_inset,0_20px_48px_-28px_rgba(0,0,0,0.65)]"
                >
                  <span
                    className="mb-2 block h-px w-6 rounded-full bg-gradient-to-r from-sky-400/50 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                  />
                  <h3 className="text-[14px] font-semibold leading-snug tracking-[-0.02em] text-zinc-100 sm:text-[15px] lg:text-[15px]">
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
