export const metadata = {
  title: "Services — Stratxcel",
};

export default function ServicesPage() {
  const items = [
    {
      title: "Revenue architecture",
      body: "Pipeline design, CRM discipline, and instrumentation so leadership sees signal — not noise.",
    },
    {
      title: "AI operating systems",
      body: "Agents, workflows, and governance that sit on your real data — shipped with acceptance tests.",
    },
    {
      title: "Delivery pods",
      body: "Senior-led squads for web, integrations, and lifecycle automation with weekly operating reviews.",
    },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Services</h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        Engagements are scoped as systems — bounded workflows, clear owners, measurable outcomes.
      </p>
      <ul className="mt-12 grid gap-8 sm:grid-cols-3">
        {items.map((s) => (
          <li
            key={s.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{s.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
