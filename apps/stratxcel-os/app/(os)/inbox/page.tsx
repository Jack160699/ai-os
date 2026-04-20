import { getResetBatchId } from "@/lib/batch";
import { getConversationsForInbox, getProposalTemplates } from "@/lib/queries";
import { InboxView } from "@/components/os/inbox-view";

export default async function InboxPage() {
  const batchId = await getResetBatchId();
  const [conversations, templates] = await Promise.all([getConversationsForInbox(batchId), getProposalTemplates(batchId)]);
  return <InboxView resetBatchId={batchId} conversations={conversations} templates={templates} />;
}
