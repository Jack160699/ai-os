import { getResetBatchId } from "@/lib/batch";
import { getLeadsForBatch, getPaymentLinksForBatch } from "@/lib/queries";
import { PaymentsConsole } from "@/components/os/payments-console";

export default async function PaymentsPage() {
  const batchId = await getResetBatchId();
  const [links, leads] = await Promise.all([getPaymentLinksForBatch(batchId), getLeadsForBatch(batchId)]);

  return (
    <PaymentsConsole
      links={links}
      leads={leads.map((l) => ({ id: l.id, full_name: l.full_name }))}
    />
  );
}
