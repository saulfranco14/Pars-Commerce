"use client";

import { CalendarCheck, CalendarClock } from "lucide-react";

import { useParaVisit } from "@/features/growth/hooks/useParaVisit";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";

import { PARA_VISIT_SLOT_CHIP, PARA_VISIT_SLOT_LABEL } from "@/features/growth/constants/para";
import { visitDayLong } from "@/features/growth/helpers/paraVisit";

import type { ParaVisitButtonProps, ParaVisitSlot } from "@/features/growth/interfaces/para";

const CHIP = "min-h-11 rounded-full border px-4 text-sm font-semibold transition";
const CHIP_ON = "border-accent bg-accent text-accent-foreground";
const CHIP_OFF = "border-border bg-surface text-foreground hover:bg-border-soft/50";

export function ParaVisitButton({ token, offer, placement }: ParaVisitButtonProps) {
  const visit = useParaVisit({ token });

  return (
    <>
      <button
        type="button"
        onClick={visit.open}
        data-para-action={`visit:${placement}`}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-accent bg-surface px-5 text-sm font-bold text-accent transition hover:bg-accent/5"
      >
        {visit.booked ? <CalendarCheck className="h-4 w-4" aria-hidden /> : <CalendarClock className="h-4 w-4" aria-hidden />}
        {visit.booked ? `Visita pedida · ${visitDayLong(visit.booked.day)}` : offer.label}
      </button>

      <FormSheet
        isOpen={visit.isOpen}
        onClose={visit.close}
        title={offer.label}
        description="Elija el día y la hora que le acomoden. Le escribimos por WhatsApp para confirmar."
        icon={CalendarClock}
        maxWidth="max-w-md"
        dismissible={!visit.sending}
        footer={
          visit.booked ? (
            <button type="button" onClick={visit.close} className="min-h-12 w-full rounded-2xl bg-foreground px-5 text-sm font-bold text-background">
              Listo
            </button>
          ) : (
            <button
              type="button"
              onClick={visit.submit}
              disabled={!visit.canSubmit}
              className="min-h-12 w-full rounded-2xl bg-accent px-5 text-sm font-bold text-accent-foreground disabled:opacity-50"
            >
              {visit.sending ? "Enviando…" : "Pedir visita"}
            </button>
          )
        }
      >
        {visit.booked ? (
          <Notification
            tone="success"
            title="Visita pedida"
            message={`Pasamos el ${visitDayLong(visit.booked.day)} ${PARA_VISIT_SLOT_LABEL[visit.booked.slot]}. Antes le escribimos por WhatsApp para confirmar.`}
          />
        ) : (
          <div className="grid gap-5">
            {visit.error ? <Notification tone="error" message={visit.error} /> : null}
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-semibold text-foreground">Día</legend>
              <div className="flex flex-wrap gap-2">
                {offer.days.map((day) => (
                  <button key={day.value} type="button" aria-pressed={visit.day === day.value} onClick={() => visit.setDay(day.value)} className={`${CHIP} ${visit.day === day.value ? CHIP_ON : CHIP_OFF}`}>
                    {day.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-semibold text-foreground">Hora</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PARA_VISIT_SLOT_CHIP) as ParaVisitSlot[]).map((slot) => (
                  <button key={slot} type="button" aria-pressed={visit.slot === slot} onClick={() => visit.setSlot(slot)} className={`${CHIP} ${visit.slot === slot ? CHIP_ON : CHIP_OFF}`}>
                    {PARA_VISIT_SLOT_CHIP[slot]}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </FormSheet>
    </>
  );
}
