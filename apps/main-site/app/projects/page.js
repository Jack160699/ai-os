import Link from "next/link";
import { URLS } from "@stratxcel/config";

export const metadata = {
  title: "Projects — Stratxcel",
};

const cards = [
  { title: "Demo portfolio", href: URLS.demo, body: "Live showcases: hospitality, asset management, consulting." },
  { title: "AI OS", href: URLS.aiOs, body: "Internal operating dashboard for pipelines, billing, and ops." },
];

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Projects</h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        Selected work and product surfaces. NDA engagements are summarized at pattern level.
      </p>
      <ul className="mt-12 grid gap-6 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.title}>
            <Link
              href={c.href}
              className="block h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-slate-900">{c.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{c.body}</p>
              <span className="mt-4 inline-flex text-sm font-medium text-blue-700">Open →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
