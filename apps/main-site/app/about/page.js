export const metadata = {
  title: "About — Stratxcel",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">About Stratxcel</h1>
      <p className="mt-6 text-slate-600 leading-relaxed">
        Stratxcel is the parent company behind our consulting practice, AI operating systems, and public
        product marketing. We build for operators who care about throughput, auditability, and margin — not
        slide decks.
      </p>
    </div>
  );
}
