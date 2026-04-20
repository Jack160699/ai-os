import { getResetBatchId } from "@/lib/batch";
import { getLeadsForBatch, getPipelineStages } from "@/lib/queries";
import { PipelineBoard } from "@/components/os/pipeline-board";

export default async function PipelinePage() {
  const batchId = await getResetBatchId();
  const [stages, leads] = await Promise.all([getPipelineStages(batchId), getLeadsForBatch(batchId)]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 md:p-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Pipeline</h1>
        <p className="text-sm text-slate-500">Drag cards between stages. Updates sync to Supabase.</p>
      </div>
      <div className="min-h-0 flex-1">
        <PipelineBoard stages={stages} leads={leads} />
      </div>
    </div>
  );
}
