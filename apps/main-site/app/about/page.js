import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "About — Stratxcel",
};

export default function AboutPage() {
  return (
    <PageLayout title="About Stratxcel OPC Private Limited" eyebrow="Company">
      <p>
        Stratxcel is a founder-led business systems company focused on disciplined execution, modern operations,
        automation, and long-term business value for serious Indian companies.
      </p>
      <p className="mt-5">
        We work selectively and commit deeply. If an engagement is not designed to produce durable outcomes,
        we call it out early and clearly.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          "Stratxcel OPC Private Limited",
          "MSME Registered",
          "GST Registered",
          "Startup India Recognized",
          "DPIIT Recognized",
        ].map((item) => (
          <li key={item} className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-3 text-sm text-zinc-700">
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-[14px] leading-relaxed text-zinc-600">
        Most businesses do not need more noise. They need stronger systems, cleaner execution, and people who
        care about outcomes.
      </p>
    </PageLayout>
  );
}
