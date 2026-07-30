"use client";

import { useMemo, useState } from "react";

import {
  buildPickupPresets,
  formatPickupTime,
  scheduleBounds,
  toDatetimeLocalValue,
} from "@/features/checkout/helpers/pickupSchedule";
import {
  isOpenAt,
  nextOpening,
} from "@/features/configuracion/helpers/businessHours";

import type { PickupTimePickerProps } from "@/features/checkout/interfaces/pickupTimePicker";

// Presets first, exact picker only on demand — same pattern as tips. Presets
// outside the business window are dropped instead of rejected on submit.
export function PickupTimePicker({
  config,
  businessHours,
  value,
  onChange,
  accentColor,
  disabled = false,
  error,
}: PickupTimePickerProps) {
  const [showExact, setShowExact] = useState(false);

  // Se congela el "ahora" al montar: recalcularlo en cada render movería los
  // presets bajo el dedo del cliente mientras escribe su correo.
  const now = useMemo(() => new Date(), []);
  const presets = useMemo(
    () => buildPickupPresets(config, now, businessHours),
    [config, now, businessHours],
  );
  const bounds = useMemo(() => scheduleBounds(config, now), [config, now]);

  const closedWarning = useMemo(() => {
    if (!value || !businessHours) return null;
    const when = new Date(value);
    if (Number.isNaN(when.getTime()) || isOpenAt(businessHours, when)) return null;
    const reopens = nextOpening(businessHours, when);
    return reopens
      ? `El negocio está cerrado a esa hora. Abre el ${formatPickupTime(reopens)}.`
      : "El negocio está cerrado a esa hora.";
  }, [value, businessHours]);

  if (!config.enabled) return null;

  const selectedPreset = presets.find((p) => p.value.toISOString() === value);
  // Los chips son un grupo excluyente. Entrar a "Otra hora" suelta el preset
  // aunque la hora siga coincidiendo con él, o se verían dos activos a la vez.
  const customActive = showExact || (!!value && !selectedPreset);

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700">
        ¿Cuándo pasas por tu pedido?
      </span>

      <div className="mt-2 flex flex-wrap gap-2">
        <Chip
          label="Cuando esté listo"
          active={!value && !showExact}
          accentColor={accentColor}
          disabled={disabled}
          onClick={() => {
            onChange("");
            setShowExact(false);
          }}
        />
        {presets.map((preset) => (
          <Chip
            key={preset.id}
            label={preset.label}
            active={!customActive && selectedPreset?.id === preset.id}
            accentColor={accentColor}
            disabled={disabled}
            onClick={() => {
              onChange(preset.value.toISOString());
              setShowExact(false);
            }}
          />
        ))}
        <Chip
          label="Otra hora"
          active={customActive}
          accentColor={accentColor}
          disabled={disabled}
          onClick={() => setShowExact(true)}
        />
      </div>

      {customActive && (
        <input
          type="datetime-local"
          // `min`/`max` en hora local, que es lo que el input entiende: con un
          // ISO en UTC el navegador acotaría a horas corridas.
          min={toDatetimeLocalValue(bounds.earliest)}
          max={toDatetimeLocalValue(bounds.latest)}
          value={value ? toDatetimeLocalValue(new Date(value)) : ""}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw ? new Date(raw).toISOString() : "");
          }}
          className={`mt-2 w-full min-h-11 rounded-xl border bg-white px-3 py-2.5 text-base text-gray-900 transition-colors focus:outline-none focus:ring-2 ${
            error
              ? "border-red-500 focus:ring-red-500/20"
              : "border-gray-300 focus:border-gray-400 focus:ring-gray-400/20"
          }`}
          aria-label="Hora exacta de recolección"
        />
      )}

      {/* Se avisa aquí y no al enviar: descubrir que el negocio está cerrado
          después de llenar el formulario obliga a rehacerlo todo. */}
      {closedWarning ? (
        <p className="mt-2 text-sm text-amber-700">{closedWarning}</p>
      ) : (
        value && (
          <p className="mt-2 text-sm text-gray-600">
            Pasas por él el {formatPickupTime(new Date(value))}.
          </p>
        )
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Chip({
  label,
  active,
  accentColor,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  accentColor: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`min-h-11 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-transparent text-white"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
      style={active ? { backgroundColor: accentColor } : undefined}
    >
      {label}
    </button>
  );
}
