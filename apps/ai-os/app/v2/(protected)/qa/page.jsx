import { PageHeader } from "@/components/v2/page-header";
import { QaHealthCheck } from "@/components/v2/qa-health-check";

export default function QaPage() {
  return (
    <section>
      <PageHeader title="QA Test Mode" subtitle="Run launch readiness checks in one click." />
      <QaHealthCheck />
    </section>
  );
}
