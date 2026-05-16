import Link from "next/link";
import { PageLayout } from "@/app/components/PageLayout";
import { CASE_STUDIES } from "@/app/data/caseStudies";

export const metadata = {
  title: "Work — Stratxcel",
  description: "Sites, automation, apps, and WhatsApp systems — snapshots of what we’ve tightened for real businesses.",
};

const SERVICES = [
  { href: "/websites", hi: "Websites", en: "Websites" },
  { href: "/ads", hi: "Ads", en: "Ads" },
  { href: "/automation", hi: "Automation · WhatsApp · CRM", en: "Automation · WhatsApp · CRM" },
  { href: "/mobile-apps", hi: "Mobile apps", en: "Mobile apps" },
  { href: "/ai-systems", hi: "AI systems", en: "AI systems" },
  { href: "/branding", hi: "Branding", en: "Branding" },
];

export default function WorkPage() {
  return (
    <PageLayout title="Work" eyebrow="Systems" wideForm>
      <p className="max-w-2xl">
        Case studies are short: what was messy, what we fixed, what changed. Service pages go deeper on how we build —
        websites, ads, automation, apps, AI, branding.
      </p>

      <div className="mt-10">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone-500">Services</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="inline-flex rounded-full border border-stone-200/90 bg-white/90 px-3.5 py-1.5 text-[13px] font-medium text-stone-800 transition-colors hover:border-stone-300 hover:bg-white"
              >
                {s.en}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-stone-500">Case studies</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {CASE_STUDIES.map((cs) => (
            <li key={cs.id}>
              <Link
                href={`/case-studies#${cs.id}`}
                className="block rounded-xl border border-stone-200/75 bg-white/90 p-4 text-left shadow-[var(--sx-shadow-sm)] transition-[border-color,box-shadow] hover:border-stone-300/80 hover:shadow-[var(--sx-shadow-md)] sm:p-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{cs.industry}</p>
                <p className="mt-2 text-[15px] font-semibold leading-snug text-[var(--sx-ink)]">{cs.problem}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--sx-ink-secondary)]">{cs.outcome}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-12 max-w-xl">
        <Link href="/case-studies" className="font-semibold underline decoration-stone-300/80 underline-offset-[5px]">
          Full case studies page
        </Link>{" "}
        — same stories, more room to read.
      </p>
    </PageLayout>
  );
}
