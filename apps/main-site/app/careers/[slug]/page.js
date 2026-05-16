import Link from "next/link";
import { CONTACT_EMAIL } from "@stratxcel/config";
import { PageLayout } from "@/app/components/PageLayout";
import { CAREERS_BY_SLUG, CAREERS_ROLES } from "@/app/data/careersRoles";

export async function generateStaticParams() {
  return CAREERS_ROLES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const role = CAREERS_BY_SLUG[slug];
  return {
    title: role ? `${role.title} — Careers · Stratxcel` : "Careers — Stratxcel",
    description: role?.teaser ?? "Stratxcel careers",
  };
}

export default async function RolePage({ params }) {
  const { slug } = await params;
  const role = CAREERS_BY_SLUG[slug];

  if (!role) {
    return (
      <PageLayout title="Role not found" eyebrow="Careers">
        <p>This opening isn’t listed anymore. Head back to careers for current roles.</p>
        <p className="mt-8">
          <Link
            href="/careers"
            className="font-medium text-[var(--sx-ink)] underline decoration-stone-300/80 underline-offset-[5px] transition-colors hover:decoration-stone-400"
          >
            Back to Careers
          </Link>
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={role.title} eyebrow="Careers">
      <p className="text-[1.0625rem] font-medium leading-snug text-[var(--sx-ink)]">{role.intro}</p>
      <p className="mt-4 inline-flex rounded-full border border-stone-200/90 bg-white/70 px-3 py-1.5 text-[13px] font-medium tracking-[-0.01em] text-[var(--sx-ink-secondary)] shadow-[0_1px_0_rgb(255_255_255/0.9)_inset]">
        {role.workType}
      </p>

      <Section title="What we expect" items={role.expect} />
      <Section title="How we work" items={role.howWeWork} />

      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Application%20%E2%80%94%20${encodeURIComponent(role.title)}`}
          className="sx-cta-primary inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-stone-800/25 px-7 text-[15px] font-semibold tracking-[-0.02em] text-stone-50 transition-[filter,transform] duration-200 motion-safe:active:scale-[0.99]"
        >
          Apply for this role
        </a>
        <Link
          href="/careers"
          className="sx-btn-secondary-elegant inline-flex h-12 min-h-[48px] items-center justify-center rounded-full px-7 text-[15px] font-semibold tracking-[-0.02em]"
        >
          All openings
        </Link>
      </div>
    </PageLayout>
  );
}

/** @param {{ title: string; items: string[] }} props */
function Section({ title, items }) {
  return (
    <div className="mt-10">
      <h2 className="sx-type-title">{title}</h2>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li
            key={it}
            className="sx-card-space rounded-[0.85rem] border border-stone-200/60 bg-[color-mix(in_srgb,white_88%,transparent)] px-3.5 py-3 text-[0.9375rem] leading-snug text-[color:var(--sx-ink-secondary)]"
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
