import { PageLayout } from "@/app/components/PageLayout";

export const metadata = {
  title: "About — Stratxcel",
};

export default function AboutPage() {
  return (
    <PageLayout title="About Stratxcel" eyebrow="Firm">
      <p>
        Stratxcel works with leadership teams that need operating leverage: revenue architecture, automation,
        and governed AI — delivered with the discipline of a serious implementation partner.
      </p>
      <p className="mt-5">
        We are selective about fit. If the engagement is not set up to win, we say so early.
      </p>
    </PageLayout>
  );
}
