"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Sparkles } from "lucide-react";

import { useAskTlaco } from "@/features/growth/hooks/useAskTlaco";
import { adminActionButtonAi } from "@/components/admin/actionButtonClasses";
import { FormInput } from "@/components/ui/FormInput";
import { TlacoAiAnswer } from "@/features/growth/components/admin/TlacoAiAnswer";

import { ACTIVATION_STAGES } from "@/features/growth/constants/activation";
import { FREQUENT_QUESTIONS, QUESTION_MAX } from "@/features/growth/constants/tlacoAi";
import { askQuestionSchema } from "@/features/growth/validations/tlacoAiSchemas";

import type { AskTlacoFormValues } from "@/features/growth/validations/tlacoAiSchemas";

/** Questions about Tlaco to activate a business: one answer per question, no chat. */
export function TlacoAiAskTab() {
  const { answer, asking, error, ask } = useAskTlaco();
  const { register, handleSubmit, formState: { errors } } = useForm<AskTlacoFormValues>({ resolver: yupResolver(askQuestionSchema), defaultValues: { question: "" } });
  const current = asking ?? answer?.question ?? null;

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Pregúntale lo que necesites saber de Tlaco para activar a un negocio. No es un chat: cada pregunta trae una respuesta.</p>
      <form onSubmit={handleSubmit((values) => ask({ question: values.question }))} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <FormInput label="Tu duda sobre Tlaco" placeholder="Ej. ¿le cobran comisión?" maxLength={QUESTION_MAX} autoComplete="off" error={errors.question?.message} {...register("question")} />
        <button type="submit" disabled={Boolean(asking)} className={`${adminActionButtonAi} ${asking ? "ai-busy" : ""}`}>
          <Sparkles className="h-4 w-4" aria-hidden />Preguntar
        </button>
      </form>

      <section className="grid gap-2" aria-label="Lo que más preguntan">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Lo que más preguntan</h3>
        <div className="flex flex-wrap gap-1.5">
          {FREQUENT_QUESTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={Boolean(asking)}
              aria-pressed={current === item.question}
              onClick={() => ask({ question: item.question, id: item.id })}
              className={`min-h-9 cursor-pointer rounded-full border px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed ${
                current === item.question ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-foreground hover:bg-border-soft/60"
              }`}
            >
              {item.question}
            </button>
          ))}
        </div>
      </section>

      <TlacoAiAnswer answer={answer} asking={asking} error={error} />

      <section className="grid gap-2" aria-label="Pasos para activar">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pasos para activar</h3>
        <ol className="divide-y divide-border-soft overflow-hidden rounded-2xl border border-border bg-surface">
          {ACTIVATION_STAGES.map((stage, index) => (
            <li key={stage.stage} className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-3 px-3 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-border-soft text-xs font-bold text-muted-foreground">{index + 1}</span>
              <span className="grid min-w-0">
                <span className="text-sm font-bold text-foreground">{stage.label}</span>
                <span className="text-xs text-muted-foreground">{stage.hint}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
