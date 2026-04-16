import Link from "next/link";

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Stratxcel AI</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        The AI operating system your GTM team can actually run.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-600">
        One surface for pipelines, agents, billing, and ops — built for production, not pilots.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/book-demo"
          className="rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-800"
        >
          Book a demo
        </Link>
        <Link href="/waitlist" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold">
          Join waitlist
        </Link>
      </div>
    </div>
  );
}
