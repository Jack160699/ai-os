import { DeliveryBoard } from "@/components/os/delivery-board";
import { coreGet } from "@/lib/revenue-core";

type DeliveryResponse = {
  ok: boolean;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    phone?: string | null;
    updated_at?: string;
  }>;
};

export default async function DeliveryPage() {
  const data = await coreGet<DeliveryResponse>("/api/delivery/board", { ok: false, tasks: [] });
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pt-4">
        <h1 className="text-lg font-semibold text-foreground">Delivery board</h1>
        <p className="text-sm text-slate-500">Operator task board from Revenue Core delivery APIs.</p>
      </div>
      <DeliveryBoard tasks={data.tasks || []} />
    </div>
  );
}
