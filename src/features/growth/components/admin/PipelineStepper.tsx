import { Check } from "lucide-react";

import { PipelineDots } from "@/features/growth/components/admin/PipelineDots";

import { pipelineIndex } from "@/features/growth/helpers/leadPipeline";
import { LEAD_STAGE_META } from "@/features/growth/constants/leadStages";
import { PIPELINE_STEPS } from "@/features/growth/constants/leadPipeline";

import type { PipelineStageProps } from "@/features/growth/interfaces/pipeline";

/** The prospect's road to a store: done steps checked and the current one highlighted; phones get one line. */
export function PipelineStepper({ stage }: PipelineStageProps) {
  const index = pipelineIndex(stage);
  if (index < 0) {
    return <p className="text-sm font-semibold text-muted-foreground">Fuera del recorrido: {LEAD_STAGE_META[stage].label}</p>;
  }
  return (
    <>
      <p className="flex items-center gap-2 text-sm text-muted-foreground sm:hidden">
        <PipelineDots stage={stage} />
        Paso {index + 1} de {PIPELINE_STEPS.length} · <b className="text-foreground">{PIPELINE_STEPS[index].label}</b>
      </p>
      <ol className="hidden flex-wrap items-center gap-x-1.5 gap-y-2 sm:flex" aria-label="Recorrido del prospecto">
        {PIPELINE_STEPS.map((step, position) => {
          const done = position < index;
          const current = position === index;
          return (
            <li key={step.key} className="inline-flex items-center gap-1.5">
              {position > 0 ? <span className={`h-px w-5 ${done || current ? "bg-accent" : "bg-border"}`} aria-hidden /> : null}
              <span
                aria-current={current ? "step" : undefined}
                className={`inline-flex min-h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ${
                  current ? "bg-accent text-accent-foreground" : done ? "bg-accent/10 text-accent" : "bg-border-soft/60 text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
