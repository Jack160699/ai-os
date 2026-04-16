import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
        Stratxcel
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        Systems that turn strategy into revenue.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
        We design operating models, ship integrations, and deploy AI where it compounds — not where it
        decorates slides.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
        >
          View pricing
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-800"
        >
          Talk to us
        </Link>
      </div>
    </div>
  );
}
