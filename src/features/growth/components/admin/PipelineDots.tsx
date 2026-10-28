import { pipelineIndex } from "@/features/growth/helpers/leadPipeline";
import { PIPELINE_STEPS } from "@/features/growth/constants/leadPipeline";

import type { PipelineStageProps } from "@/features/growth/interfaces/pipeline";

/** ●●●●○○: how far along the six steps a prospect is, for rows and board cards. */
export function PipelineDots({ stage }: PipelineStageProps) {
  const index = pipelineIndex(stage);
  if (index < 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Paso ${index + 1} de ${PIPELINE_STEPS.length}: ${PIPELINE_STEPS[index].label}`}>
      {PIPELINE_STEPS.map((step, position) => (
        <span key={step.key} className={`h-1.5 w-1.5 rounded-full ${position <= index ? "bg-accent" : "bg-border"}`} aria-hidden />
      ))}
    </span>
  );
}
