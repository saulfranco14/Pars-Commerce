"use client";

import { useMemo } from "react";

import { AcceptingOrdersToggle } from "@/features/orders/components/agenda/AcceptingOrdersToggle";
import {
  buildPickupPresets,
  formatPickupTime,
} from "@/features/checkout/helpers/pickupSchedule";
import { checkboxItemClass } from "@/features/configuracion/constants/formClasses";

import type { ConfigAgendaSectionProps } from "@/features/configuracion/interfaces/sections";

const LEAD_OPTIONS = [
  { value: "0", label: "Sin espera" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hora" },
  { value: "120", label: "2 horas" },
  { value: "240", label: "4 horas" },
];

const DAYS_OPTIONS = [
  { value: "0", label: "Solo hoy" },
  { value: "1", label: "Hasta mañana" },
  { value: "3", label: "3 días" },
  { value: "7", label: "1 semana" },
  { value: "30", label: "1 mes" },
];

/**
 * Ventana de recolección: si el cliente puede elegir hora, con cuánta
 * anticipación y hasta qué tan lejos.
 *
 * Muestra en vivo los chips que verá el cliente con la configuración actual.
 * Sin esa vista previa, "30 minutos de anticipación" es un número abstracto:
 * el dueño no tiene forma de saber que acaba de borrar la opción "en 15
 * minutos" de su propio sitio.
 */
export function ConfigAgendaSection({
  enabled,
  onEnabledChange,
  minLeadMinutes,
  onMinLeadMinutesChange,
  maxDaysAhead,
  onMaxDaysAheadChange,
  acceptingOrders,
  onAcceptingOrdersChange,
  canConfigureReception,
  tenantId,
}: ConfigAgendaSectionProps) {
  const preview = useMemo(() => {
    const now = new Date();
    return buildPickupPresets(
      {
        enabled: true,
        minLeadMinutes: Number(minLeadMinutes) || 0,
        maxDaysAhead: Number(maxDaysAhead) || 0,
      },
      now,
    );
  }, [minLeadMinutes, maxDaysAhead]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Tus clientes piden desde el sitio y pasan por su pedido. Aquí decides si
        pueden elegir la hora y con cuánta anticipación.{" "}
        <strong className="font-medium text-foreground">
          No es entrega a domicilio
        </strong>
        : el cliente viene por él.
      </p>

      <label className={checkboxItemClass}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-border text-accent focus:ring-accent/30"
        />
        <div>
          <span className="text-sm font-medium text-foreground">
            Dejar que el cliente elija hora
          </span>
          <p className="text-xs text-muted-foreground">
            Si lo apagas, el cliente pide y pasa cuando esté listo.
          </p>
        </div>
      </label>

      {enabled && (
        <>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Anticipación mínima
            </h3>
            <p className="text-xs text-muted-foreground">
              Cuánto tiempo necesitas para tenerlo listo. El cliente no podrá
              elegir una hora más cercana que esta.
            </p>
            <div className="flex flex-wrap gap-2">
              {LEAD_OPTIONS.map((opt) => (
                <ChoiceButton
                  key={opt.value}
                  label={opt.label}
                  active={minLeadMinutes === opt.value}
                  onClick={() => onMinLeadMinutesChange(opt.value)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Hasta cuándo se puede agendar
            </h3>
            <div className="flex flex-wrap gap-2">
              {DAYS_OPTIONS.map((opt) => (
                <ChoiceButton
                  key={opt.value}
                  label={opt.label}
                  active={maxDaysAhead === opt.value}
                  onClick={() => onMaxDaysAheadChange(opt.value)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-border-soft/30 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Lo que verá tu cliente
            </h3>
            {preview.length === 0 ? (
              <p className="mt-2 text-xs text-amber-700">
                Con esta combinación no le queda ninguna opción rápida. Podrá
                elegir la hora a mano, pero considera bajar la anticipación o
                ampliar los días.
              </p>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground">
                    Cuando esté listo
                  </span>
                  {preview.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground"
                      title={formatPickupTime(p.value)}
                    >
                      {p.label}
                    </span>
                  ))}
                  <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground">
                    Otra hora
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  La más próxima sería el {formatPickupTime(preview[0].value)}.
                </p>
              </>
            )}
          </div>
        </>
      )}

      {canConfigureReception && (
        <div className="space-y-2 border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-foreground">
            Recepción de pedidos
          </h3>
          <p className="text-xs text-muted-foreground">
            {acceptingOrders
              ? "Tu sitio está aceptando pedidos."
              : "Tu sitio muestra el catálogo pero no acepta pedidos nuevos."}
          </p>
          {/* Se guarda al instante, no con el botón del formulario: cerrar la
              recepción es una urgencia ("ya no me da tiempo hoy") y esperar a
              guardar toda la configuración sería la respuesta equivocada. */}
          <div className="flex justify-start">
            <AcceptingOrdersToggle
              tenantId={tenantId}
              accepting={acceptingOrders}
              onChanged={onAcceptingOrdersChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ChoiceButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 cursor-pointer rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent/5 text-accent"
          : "border-border text-muted-foreground hover:border-muted"
      }`}
    >
      {label}
    </button>
  );
}
