"use client";

import { Clock, Plus, X } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import {
  SUGGESTED_BUSINESS_HOURS,
  WEEKDAY_DISPLAY_ORDER,
  WEEKDAY_LABELS,
  type DayHours,
} from "@/features/configuracion/interfaces/businessHours";
import { emptyRange } from "@/features/configuracion/helpers/businessHours";

import type { ConfigHorariosSectionProps } from "@/features/configuracion/interfaces/sections";

// Several ranges per day: split hours (open, close for lunch, reopen) are the
// norm here.
export function ConfigHorariosSection({
  hours,
  onChange,
}: ConfigHorariosSectionProps) {
  const configured = hours !== null;
  const mode = hours?.mode ?? "weekly";
  const days = hours?.days ?? SUGGESTED_BUSINESS_HOURS.days;

  function updateDay(index: number, next: DayHours) {
    onChange({
      mode: "weekly",
      days: days.map((d, i) => (i === index ? next : d)),
    });
  }

  return (
    <div className="space-y-6">
      {!configured && (
        <Notification
          tone="warning"
          title="Todavía no das de alta tus horarios"
          message="Sin horarios, tus clientes pueden agendar su recolección a cualquier hora — incluso de madrugada. Elige 24/7 o marca tus días y horas."
        />
      )}

      <p className="text-sm text-muted-foreground">
        Cuándo puede pasar un cliente por su pedido. Se usa para calcular las
        horas que le ofrecemos al agendar y para no dejarlo elegir una hora en
        la que estás cerrado.
      </p>

      <div className="flex gap-3">
        <ModeButton
          label="Abierto 24/7"
          description="Sin restricción de horario"
          active={configured && mode === "always"}
          onClick={() => onChange({ mode: "always", days })}
        />
        <ModeButton
          label="Horario por día"
          description="Defines días y franjas"
          active={configured && mode === "weekly"}
          onClick={() => onChange({ mode: "weekly", days })}
        />
      </div>

      {configured && mode === "weekly" && (
        <div className="space-y-2">
          {WEEKDAY_DISPLAY_ORDER.map((weekday) => (
            <DayRow
              key={weekday}
              label={WEEKDAY_LABELS[weekday]}
              day={days[weekday]}
              onChange={(next) => updateDay(weekday, next)}
            />
          ))}
          {/* Copiar el lunes al resto ahorra seis ediciones idénticas, que es
              el caso normal. */}
          <button
            type="button"
            onClick={() =>
              onChange({
                mode: "weekly",
                days: days.map((d, i) => (i === 0 ? d : { ...days[1] })),
              })
            }
            className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-border-soft/60"
          >
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            Copiar el lunes a los demás días (menos domingo)
          </button>
        </div>
      )}
    </div>
  );
}

function ModeButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 cursor-pointer flex-col items-start gap-0.5 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
        active
          ? "border-accent bg-accent/5"
          : "border-border hover:border-muted"
      }`}
    >
      <span
        className={`text-sm font-semibold ${active ? "text-accent" : "text-foreground"}`}
      >
        {label}
      </span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

function DayRow({
  label,
  day,
  onChange,
}: {
  label: string;
  day: DayHours;
  onChange: (next: DayHours) => void;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={!day.closed}
            onChange={(e) =>
              onChange({
                closed: !e.target.checked,
                ranges:
                  e.target.checked && day.ranges.length === 0
                    ? [emptyRange()]
                    : day.ranges,
              })
            }
            className="h-4 w-4 cursor-pointer rounded border-border text-accent focus:ring-accent/30"
          />
          {day.closed ? "Cerrado" : "Abierto"}
        </label>
      </div>

      {!day.closed && (
        <div className="mt-2 space-y-2">
          {day.ranges.map((range, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="time"
                value={range.open}
                onChange={(e) =>
                  onChange({
                    ...day,
                    ranges: day.ranges.map((r, j) =>
                      j === i ? { ...r, open: e.target.value } : r,
                    ),
                  })
                }
                className="input-form min-h-11 rounded-lg border border-border px-2 text-sm text-foreground focus:border-accent focus:outline-none"
                aria-label={`${label}: hora de apertura`}
              />
              <span className="text-xs text-muted-foreground">a</span>
              <input
                type="time"
                value={range.close}
                onChange={(e) =>
                  onChange({
                    ...day,
                    ranges: day.ranges.map((r, j) =>
                      j === i ? { ...r, close: e.target.value } : r,
                    ),
                  })
                }
                className="input-form min-h-11 rounded-lg border border-border px-2 text-sm text-foreground focus:border-accent focus:outline-none"
                aria-label={`${label}: hora de cierre`}
              />
              {day.ranges.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...day,
                      ranges: day.ranges.filter((_, j) => j !== i),
                    })
                  }
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border-soft hover:text-foreground"
                  aria-label={`Quitar franja de ${label}`}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          ))}
          {day.ranges.length < 3 && (
            <button
              type="button"
              onClick={() =>
                onChange({ ...day, ranges: [...day.ranges, emptyRange()] })
              }
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-xs font-medium text-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Agregar otra franja
            </button>
          )}
          {/* Una franja que cierra antes de abrir cruza la medianoche. Es
              válido y muy común, pero hay que decirlo o parece un error. */}
          {day.ranges.some((r) => r.close <= r.open) && (
            <p className="text-xs text-muted-foreground">
              Cierras después de medianoche — el horario se extiende al día
              siguiente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
