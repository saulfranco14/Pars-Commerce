import { ChevronRight, Clock } from "lucide-react";

import type { TlacoAiTodayTabProps } from "@/features/growth/interfaces/tlacoAi";

const LINE_WIDTHS = ["w-full", "w-11/12", "w-4/5", "w-2/3"];

/** The whole plan: Tlaco IA's text and every step, the ones for now open their list. */
export function TlacoAiTodayTab({ plan, text, writing, onStep }: TlacoAiTodayTabProps) {
  return (
    <div className="grid gap-4">
      {writing || !text ? (
        <div className="grid gap-2.5" aria-label="Tlaco IA está pensando">
          {LINE_WIDTHS.map((width) => <span key={width} className={`ai-line h-3 rounded-md ${width}`} />)}
        </div>
      ) : (
        <p className="text-[15px] leading-relaxed text-foreground">{text.text}</p>
      )}

      {plan?.steps.length ? (
        <section className="grid gap-2" aria-label="Paso a paso">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Paso a paso</h3>
          <ol className="divide-y divide-border-soft overflow-hidden rounded-2xl border border-border bg-surface">
            {plan.steps.map((step, index) => {
              const now = step.when === null;
              const body = (
                <>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${now ? "bg-accent/10 text-accent" : "bg-border-soft text-muted-foreground"}`}>{index + 1}</span>
                  <span className="grid min-w-0">
                    <span className={`text-sm font-bold ${now ? "text-foreground" : "text-muted-foreground"}`}>{step.title}</span>
                    <span className="text-xs text-muted-foreground">{now ? step.detail : <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />Mejor {step.when}</span>}</span>
                  </span>
                  {now ? <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden /> : <span />}
                </>
              );
              return (
                <li key={step.action}>
                  {now ? (
                    <button type="button" onClick={() => onStep(step.action)} className="grid min-h-14 w-full cursor-pointer grid-cols-[1.75rem_minmax(0,1fr)_1rem] items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
                      {body}
                    </button>
                  ) : (
                    <div className="grid min-h-14 grid-cols-[1.75rem_minmax(0,1fr)_1rem] items-center gap-3 px-3 py-2.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
