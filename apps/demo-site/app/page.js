import Link from "next/link";

const demos = [
  {
    slug: "/hotel-website",
    title: "Hotel website",
    blurb: "Premium hospitality landing — motion, gallery, and booking CTAs.",
  },
  {
    slug: "/honest-asset-management",
    title: "Honest asset management",
    blurb: "Trust-first wealth narrative with compliance-aware tone.",
  },
  {
    slug: "/premium-consulting",
    title: "Premium consulting",
    blurb: "Partner-grade consulting brand with case-led storytelling.",
  },
  {
    slug: "/future-projects",
    title: "Future projects",
    blurb: "Pipeline of experiments and R&D surfaces.",
  },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Portfolio</h1>
      <p className="mt-4 max-w-2xl text-slate-300">
        Professional showcase cards for Stratxcel build quality. Each tile links to a dedicated case
        surface.
      </p>
      <ul className="mt-12 grid gap-6 sm:grid-cols-2">
        {demos.map((d) => (
          <li key={d.slug}>
            <Link
              href={d.slug}
              className="block rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-blue-400/50 hover:bg-white/10"
            >
              <h2 className="text-lg font-semibold text-white">{d.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{d.blurb}</p>
              <span className="mt-4 inline-block text-sm font-medium text-blue-300">View →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
