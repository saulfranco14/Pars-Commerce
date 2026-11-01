import { StatusBadge } from "@/components/admin/StatusBadge";

import { pipelineIndex } from "@/features/growth/helpers/leadPipeline";
import { LEAD_STAGE_META } from "@/features/growth/constants/leadStages";
import { PIPELINE_STEPS } from "@/features/growth/constants/leadPipeline";

import type { PipelineStageProps } from "@/features/growth/interfaces/pipeline";

/** The prospect's stage, a six-segment bar of how far it got and «3 de 6», in one line. */
export function PipelineStepper({ stage }: PipelineStageProps) {
  const index = pipelineIndex(stage);
  if (index < 0) return <StatusBadge tone={LEAD_STAGE_META[stage].tone} label={LEAD_STAGE_META[stage].label} />;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />{PIPELINE_STEPS[index].label}
      </span>
      <span className="flex min-w-20 max-w-48 flex-1 gap-1" role="img" aria-label={`Paso ${index + 1} de ${PIPELINE_STEPS.length}`}>
        {PIPELINE_STEPS.map((step, position) => (
          <span key={step.key} className={`h-1.5 flex-1 rounded-full ${position < index ? "bg-accent/40" : position === index ? "bg-accent" : "bg-border"}`} aria-hidden />
        ))}
      </span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{index + 1} de {PIPELINE_STEPS.length}</span>
    </div>
  );
}
