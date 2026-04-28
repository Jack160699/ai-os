import { PageHeader } from "@/components/v2/page-header";
import { InboxWorkspace } from "@/components/v2/inbox-workspace";

export default function InboxPage() {
  return (
    <section>
      <PageHeader title="Inbox" subtitle="Live WhatsApp threads with assignment, tags, notes, and quick reply." />
      <InboxWorkspace />
    </section>
  );
}
