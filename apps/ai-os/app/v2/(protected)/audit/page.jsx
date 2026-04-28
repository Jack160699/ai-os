import { PageHeader } from "@/components/v2/page-header";
import { AuditViewer } from "@/components/v2/audit-viewer";

export default function AuditPage() {
  return (
    <section>
      <PageHeader title="Audit Logs" subtitle="Track who did what and when across team, inbox, and payments." />
      <AuditViewer />
    </section>
  );
}
