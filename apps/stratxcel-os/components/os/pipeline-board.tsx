"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import type { Lead, PipelineStage } from "@/lib/models";
import { moveLeadToStage } from "@/app/(os)/actions";
import { cn } from "@/lib/utils";

function StageColumn({
  stage,
  children,
}: {
  stage: PipelineStage;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div className="flex min-h-0 w-[min(100%,280px)] shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{stage.label}</p>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 transition-colors",
          isOver && "border-sky-500/35 bg-sky-500/5",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function LeadCard({ lead, stageKey }: { lead: Lead; stageKey: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.55 : 1,
  };
  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab touch-manipulation rounded-lg border-white/[0.08] p-3 active:cursor-grabbing"
    >
      <p className="text-sm font-medium text-foreground">{lead.full_name}</p>
      <p className="mt-1 text-xs text-slate-500">{lead.phone ?? "—"}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>AI {lead.ai_score}</span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">{stageKey}</span>
      </div>
    </Card>
  );
}

export function PipelineBoard({ stages, leads: initialLeads }: { stages: PipelineStage[]; leads: Lead[] }) {
  const [leads, setLeads] = React.useState(initialLeads);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const leadId = String(active.id);
    const stageId = String(over.id);
    const targetStage = stages.find((s) => s.id === stageId);
    if (!targetStage) return;

    const snapshot = leads;
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, pipeline_stage_id: stageId } : l)));
    try {
      await moveLeadToStage(leadId, stageId);
    } catch {
      setLeads(snapshot);
    }
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex min-h-0 gap-3 overflow-x-auto pb-2">
        {stages.map((stage) => (
          <StageColumn key={stage.id} stage={stage}>
            {leads
              .filter((l) => l.pipeline_stage_id === stage.id)
              .map((lead) => (
                <LeadCard key={lead.id} lead={lead} stageKey={stage.stage_key} />
              ))}
          </StageColumn>
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 160, easing: "ease" }}>
        {activeLead ? (
          <Card className="w-[240px] rounded-lg border-sky-500/40 p-3 shadow-lg">
            <p className="text-sm font-medium text-foreground">{activeLead.full_name}</p>
            <p className="mt-1 text-xs text-slate-500">{activeLead.phone ?? "—"}</p>
            <p className="mt-2 text-[11px] text-slate-500">AI {activeLead.ai_score}</p>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
