"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { BellRing, CalendarClock, NotebookPen, PauseCircle } from "lucide-react";

import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

import { daysFromToday, mexicoInputToIso, todayInputValue } from "@/features/growth/helpers/leadPipeline";
import { PAUSE_PRESETS, REMIND_PRESETS } from "@/features/growth/constants/leadPipeline";
import { followUpFormSchema } from "@/features/growth/validations/followUpSchemas";

import type { FollowUpAction } from "@/features/growth/interfaces/lead";
import type { FollowUpSheetProps } from "@/features/growth/interfaces/pipeline";
import type { FollowUpFormValues } from "@/features/growth/validations/followUpSchemas";

const SHEET_COPY: Partial<Record<FollowUpAction, { title: string; description: string; submit: string; icon: typeof CalendarClock }>> = {
  schedule_visit: { title: "Agendar cita", description: "Pasa a «Cita agendada» y la visita queda como su próximo paso.", submit: "Agendar", icon: CalendarClock },
  reschedule_visit: { title: "Cambiar la cita", description: "La visita se mueve a la nueva fecha.", submit: "Guardar fecha", icon: CalendarClock },
  remind: { title: "Recordarme", description: "Cambia la fecha de su próximo paso. Aparece en «Para hoy» ese día.", submit: "Guardar", icon: BellRing },
  pause: { title: "Pausar hasta…", description: "No aparece en «Para hoy» hasta esa fecha; ahí vuelve como «Retomar».", submit: "Pausar", icon: PauseCircle },
  note: { title: "Nota", description: "Queda en la línea de tiempo.", submit: "Guardar nota", icon: NotebookPen },
};

const NOTE_PLACEHOLDER: Partial<Record<FollowUpAction, string>> = {
  schedule_visit: "Ej. Llevar la tablet, preguntar por el encargado",
  pause: "Ej. Días fuertes, él dice cuándo",
  remind: "Ej. Quedó en confirmar el horario",
  note: "Ej. Preguntó por qué es gratis",
};

export function FollowUpSheet({ action, businessName, busy, onClose, onSubmit }: FollowUpSheetProps) {
  const current = action ?? "note";
  const copy = SHEET_COPY[current] ?? SHEET_COPY.note!;
  const presets = current === "remind" ? REMIND_PRESETS : current === "pause" ? PAUSE_PRESETS : [];
  const withTime = current === "schedule_visit" || current === "reschedule_visit";
  const withDate = current !== "note";

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FollowUpFormValues>({
    resolver: yupResolver(followUpFormSchema(current)),
    values: { date: "", time: withTime ? "11:00" : "", note: "" },
  });
  const pickedDate = watch("date");

  const submit = handleSubmit(async ({ date, time, note }) => {
    const saved = await onSubmit({ action: current, at: withDate ? mexicoInputToIso(date, time) : null, note: note || null });
    if (saved) {
      reset();
      onClose();
    }
  });

  return (
    <FormSheet
      isOpen={action !== null}
      onClose={onClose}
      title={copy.title}
      description={`${businessName}. ${copy.description}`}
      icon={copy.icon}
      footer={<button type="submit" form="follow-up-form" disabled={busy} className={`${adminActionButtonPrimary} w-full`}>{busy ? "Guardando…" : copy.submit}</button>}
    >
      <form id="follow-up-form" onSubmit={submit} className="grid gap-4" noValidate>
        {presets.length ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Fechas rápidas">
            {presets.map((preset) => {
              const value = daysFromToday(preset.days).slice(0, 10);
              return (
                <button
                  key={preset.days}
                  type="button"
                  aria-pressed={pickedDate === value}
                  onClick={() => setValue("date", value, { shouldValidate: true })}
                  className={`${adminActionButtonSecondary} ${pickedDate === value ? "border-accent text-accent" : ""}`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        ) : null}
        {withDate ? (
          <div className={withTime ? "grid grid-cols-2 gap-3" : "grid"}>
            <FormInput label="Fecha" type="date" min={todayInputValue()} error={errors.date?.message} {...register("date")} />
            {withTime ? <FormInput label="Hora" type="time" error={errors.time?.message} {...register("time")} /> : null}
          </div>
        ) : null}
        <FormInput label="Nota" optional={current !== "note"} maxLength={280} placeholder={NOTE_PLACEHOLDER[current]} error={errors.note?.message} {...register("note")} />
      </form>
    </FormSheet>
  );
}
