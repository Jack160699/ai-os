import Link from "next/link";
import { PageLayout } from "@/app/components/PageLayout";
import { CASE_STUDIES } from "@/app/data/caseStudies";

export const metadata = {
  title: "Case studies — MISNETEXT",
  description:
    "Real situations we have helped with — clearer sites, calmer WhatsApp, sharper ads. Practical outcomes, human language.",
};

export default function CaseStudiesPage() {
  return (
    <PageLayout title="Case studies" eyebrow="Outcomes" wideForm>
      <p className="max-w-2xl">
        Short snapshots — what was messy, what we tightened, what changed. No corporate theatre; just problems you
        have probably seen before.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {CASE_STUDIES.map((cs, i) => (
          <article
            key={cs.id}
            id={cs.id}
            className={[
              "group relative flex flex-col overflow-hidden rounded-[1.08rem] border border-stone-200/72 bg-gradient-to-br from-white/92 to-[color-mix(in_srgb,var(--sx-surface-warm)_65%,white)] p-5 shadow-[var(--sx-shadow-sm)] transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-stone-300/78 motion-safe:hover:shadow-[var(--sx-shadow-md)] sm:p-6",
              i % 2 === 1 ? "sm:mt-1" : "",
            ].join(" ")}
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[color-mix(in_srgb,var(--sx-glow-amber)_22%,transparent)] blur-2xl transition-opacity duration-300 group-hover:opacity-90"
              aria-hidden
            />
            <p className="relative text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-stone-500">
              {cs.industry}
            </p>
            <h2 className="relative sx-type-title mt-3">{cs.problem}</h2>
            <div className="relative mt-4 space-y-3 text-[0.9375rem] leading-snug text-[color:var(--sx-ink-secondary)]">
              <p>
                <span className="font-semibold text-[var(--sx-ink)]">What shifted · </span>
                {cs.improved}
              </p>
              <p>
                <span className="font-semibold text-[var(--sx-ink)]">Outcome · </span>
                {cs.outcome}
              </p>
            </div>
            {cs.tags?.length ? (
              <ul className="relative mt-5 flex flex-wrap gap-2">
                {cs.tags.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-stone-200/85 bg-white/75 px-2.5 py-1 text-[11px] font-medium tracking-[-0.01em] text-stone-600"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>

      <p className="mt-12 max-w-xl">
        Like this tone of work?{" "}
        <Link href="/contact" className="font-semibold underline decoration-stone-300/80 underline-offset-[5px]">
          Say hello
        </Link>{" "}
        or{" "}
        <Link href="/#lead" className="font-semibold underline decoration-stone-300/80 underline-offset-[5px]">
          leave your details
        </Link>
        — we’ll reply like humans.
      </p>
    </PageLayout>
  );
}
