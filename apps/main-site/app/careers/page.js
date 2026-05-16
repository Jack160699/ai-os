import Link from "next/link";
import { CONTACT_EMAIL } from "@stratxcel/config";
import { PageLayout } from "@/app/components/PageLayout";
import { CAREERS_ROLES } from "@/app/data/careersRoles";

export const metadata = {
  title: "Careers — Stratxcel",
  description: "Operator-first roles — ads, web, WhatsApp, client comms. Small team, clear standards.",
};

export default function CareersPage() {
  return (
    <PageLayout title="Careers" eyebrow="Work with us">
      <p>
        Open roles for people who like shipping real work for real businesses — not slide decks. Send your CV +
        role title; we reply when we can.
      </p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {CAREERS_ROLES.map((r) => (
          <Link
            key={r.slug}
            href={`/careers/${r.slug}`}
            className="sx-card-space sx-card--interactive sx-card--lift block overflow-hidden rounded-[1.05rem] border border-stone-200/75 bg-[color-mix(in_srgb,white_93%,var(--sx-surface-warm))] px-4 py-4 shadow-[var(--sx-shadow-sm)] transition-[border-color,box-shadow] duration-300 hover:border-stone-300/85 sm:px-4 sm:py-4"
          >
            <h2 className="sx-type-title">{r.title}</h2>
            <p className="mt-2 text-[0.9375rem] leading-snug text-[color:var(--sx-ink-secondary)]">{r.teaser}</p>
            <p className="sx-type-caption mt-3">{r.workType}</p>
          </Link>
        ))}
      </div>
      <div className="mt-10">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Application%20%E2%80%94%20Stratxcel`}
          className="sx-cta-primary inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-stone-800/25 px-7 text-[15px] font-semibold tracking-[-0.02em] text-stone-50 transition-[filter,transform] duration-200 motion-safe:active:scale-[0.99]"
        >
          Email your application
        </a>
        <p className="sx-type-caption mt-4 max-w-md">
          Questions about a role? Use the same email — put the role name in the subject.
        </p>
      </div>
    </PageLayout>
  );
}
