import { PageHeader } from "@/components/v2/page-header";
import { InboxWorkspace } from "@/components/v2/inbox-workspace";

export default function InboxPage() {
  return (
    <section>
      <PageHeader title="Inbox" subtitle="Premium split-workspace for search, conversations, and assignment flow." />
      <InboxWorkspace />
    </section>
  );
}
