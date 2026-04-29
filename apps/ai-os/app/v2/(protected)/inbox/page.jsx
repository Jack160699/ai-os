import { PageHeader } from "@/components/v2/page-header";
import { InboxWorkspace } from "@/components/v2/inbox-workspace";

export default function InboxPage() {
  return (
    <section>
      <PageHeader page="inbox" />
      <InboxWorkspace />
    </section>
  );
}
