import { getResetBatchId } from "@/lib/batch";
import { getLeadsForBatch } from "@/lib/queries";
import { LeadsBoard } from "@/components/os/leads-board";

export default async function LeadsPage() {
  const batchId = await getResetBatchId();
  const leads = await getLeadsForBatch(batchId);
  return <LeadsBoard leads={leads} />;
}
