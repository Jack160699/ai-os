import { SectionReveal } from "./SectionReveal";

const STEPS = [
  {
    n: "01",
    title: "Understand Your Business",
    body: "We learn what’s slowing your growth.",
  },
  {
    n: "02",
    title: "Build The Right System",
    body: "We create solutions based on your needs.",
  },
  {
    n: "03",
    title: "Scale Smoothly",
    body: "Better operations, better conversions, better growth.",
  },
];

export function HowWeWorkSection() {
  return (
    <section id="how-we-work" className="sx-section-space">
      <SectionReveal>
        <div className="sx-container">
          <header className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-[1.35rem] font-semibold leading-snug tracking-[-0.03em] text-stone-900 sm:text-[1.5rem] lg:text-[1.55rem]">
              How We Work
            </h2>
            <p className="mx-auto mt-4 max-w-[42ch] text-[14px] leading-relaxed text-stone-600 sm:text-[15px]">
              Three calm steps — clear, honest, and easy to follow.
            </p>
          </header>

          <ol className="mx-auto mt-10 grid max-w-5xl list-none grid-cols-1 gap-4 pl-0 sm:mt-12 sm:grid-cols-3 sm:gap-5 lg:mt-14">
            {STEPS.map((step) => (
              <li key={step.n}>
                <article className="group flex h-full flex-col rounded-2xl border border-stone-200/90 bg-white/95 p-6 text-center shadow-sm transition-[border-color,box-shadow,transform] duration-300 ease-out sm:p-7 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md sm:text-left">
                  <span className="mx-auto mb-5 inline-flex h-10 min-w-[2.75rem] items-center justify-center rounded-full border border-stone-200/90 bg-stone-50 px-3 text-[11px] font-semibold tracking-[0.16em] text-stone-600 transition-colors duration-300 group-hover:border-stone-300 group-hover:bg-white sm:mx-0">
                    {step.n}
                  </span>
                  <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.02em] text-stone-900 sm:text-[16px]">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-stone-600">{step.body}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </SectionReveal>
    </section>
  );
}
