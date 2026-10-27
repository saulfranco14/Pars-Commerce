"use client";

import { useEffect } from "react";
import { CheckCircle2, ChevronDown, Clock3, MapPin, Search } from "lucide-react";

import { usePlaceSearch } from "@/hooks/usePlaceSearch";
import { SettingField as Field } from "@/features/configuracion/components/cobros/SettingField";

import {
  describeDay,
  describeWeek,
  emptyRange,
} from "@/features/configuracion/helpers/businessHours";
import {
  SUGGESTED_BUSINESS_HOURS,
  WEEKDAY_DISPLAY_ORDER,
  WEEKDAY_LABELS,
  type BusinessHours,
} from "@/features/configuracion/interfaces/businessHours";

import type { PlaceOption } from "@/types/places";
import type {
  PickupAddressSearchProps,
  PickupDayEditorProps,
  PickupHoursEditorProps,
  PickupPointDraft,
  PickupPointFormProps,
  PickupTabButtonProps,
  TimeFieldProps,
} from "@/features/configuracion/interfaces/paymentsAndDelivery";

export function PickupPointForm({
  value,
  globalHours,
  tab,
  onTabChange,
  onChange,
}: PickupPointFormProps) {
  const set = <Key extends keyof PickupPointDraft>(key: Key, next: PickupPointDraft[Key]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-xl bg-muted p-1" role="tablist">
        <TabButton active={tab === "location"} onClick={() => onTabChange("location")}>
          <MapPin className="h-4 w-4" /> Ubicación
        </TabButton>
        <TabButton active={tab === "hours"} onClick={() => onTabChange("hours")}>
          <Clock3 className="h-4 w-4" /> Horarios
        </TabButton>
      </div>

      {tab === "location" ? (
        <div className="space-y-4">
          <Field
            label="Nombre del punto"
            value={value.name ?? ""}
            placeholder="Sucursal Centro"
            onChange={(next) => set("name", next)}
          />
          <PickupAddressSearch value={value} onChange={onChange} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Referencia"
              value={value.reference ?? ""}
              placeholder="Junto al Oxxo, portón azul"
              onChange={(next) => set("reference", next)}
            />
            <Field
              label="Instrucciones (opcional)"
              value={value.instructions ?? ""}
              placeholder="Muestra tu folio al llegar"
              onChange={(next) => set("instructions", next)}
            />
          </div>
          <button
            type="button"
            onClick={() => onTabChange("hours")}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-bold text-foreground"
          >
            Siguiente: definir horario <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        </div>
      ) : (
        <PickupHoursEditor
          value={value.business_hours ?? null}
          globalHours={globalHours}
          onChange={(next) => set("business_hours", next)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: PickupTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition ${
        active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function PickupAddressSearch({
  value,
  onChange,
}: PickupAddressSearchProps) {
  const { query, setQuery, places, searching, unavailable, pick } = usePlaceSearch(value.address_text ?? "");
  // Editing another point swaps the draft under the same form.
  useEffect(() => setQuery(value.address_text ?? ""), [value.address_text, setQuery]);

  const selectPlace = async (picked: PlaceOption) => {
    const place = await pick(picked);
    onChange({
      ...value,
      address_text: picked.label,
      mapbox_feature_id: place.id,
      latitude: place.latitude,
      longitude: place.longitude,
    });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">
        Dirección del punto
        <span className="relative mt-1.5 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              onChange({
                ...value,
                address_text: next,
                mapbox_feature_id: null,
                latitude: null,
                longitude: null,
              });
            }}
            placeholder="Busca calle, número, colonia o municipio"
            className="min-h-11 w-full rounded-xl border border-border bg-background py-0 pl-9 pr-3 text-sm font-normal outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
        </span>
      </label>
      {searching ? <p className="text-xs text-muted-foreground">Buscando direcciones…</p> : null}
      {places.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          {places.map((place) => (
            <button
              key={place.id}
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                void selectPlace(place);
              }}
              onClick={(event) => {
                if (event.detail === 0) void selectPlace(place);
              }}
              className="flex min-h-11 w-full items-start gap-2 border-b border-border-soft px-3 py-2.5 text-left text-sm last:border-0 hover:bg-muted"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {place.label}
            </button>
          ))}
        </div>
      ) : null}
      {value.mapbox_feature_id ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Ubicación confirmada en el mapa
        </p>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          Elige una sugerencia para guardar la ubicación exacta. También puedes continuar con una dirección manual.
        </p>
      )}
      {unavailable ? (
        <p className="text-xs text-amber-700">La búsqueda de direcciones no respondió; conserva la dirección manual y podrás editarla después.</p>
      ) : null}
    </div>
  );
}

function PickupHoursEditor({
  value,
  globalHours,
  onChange,
}: PickupHoursEditorProps) {
  const custom = value !== null;
  const cloneSuggested = () =>
    JSON.parse(JSON.stringify(SUGGESTED_BUSINESS_HOURS)) as BusinessHours;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-bold text-foreground">¿Cuándo puede recoger el cliente aquí?</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Estos horarios se mostrarán antes de elegir el punto y se usarán para validar la hora de recolección.
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`w-full rounded-xl border p-3 text-left ${!custom ? "border-accent bg-accent/[0.04] ring-1 ring-accent" : "border-border bg-surface"}`}
      >
        <span className="block text-sm font-bold text-foreground">Usar el horario general</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {globalHours ? describeWeek(globalHours).slice(0, 2).join(" · ") : "Aún no hay un horario general; el punto se mostrará como horario por confirmar."}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange(value ?? cloneSuggested())}
        className={`w-full rounded-xl border p-3 text-left ${custom ? "border-accent bg-accent/[0.04] ring-1 ring-accent" : "border-border bg-surface"}`}
      >
        <span className="block text-sm font-bold text-foreground">Definir un horario para este punto</span>
        <span className="mt-1 block text-xs text-muted-foreground">Úsalo cuando esta sucursal abre en horas distintas.</span>
      </button>

      {value ? (
        <div className="space-y-2 rounded-xl border border-border bg-background p-3">
          <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
            {(["weekly", "always"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChange(mode === "always" ? { mode, days: [] } : cloneSuggested())}
                className={`min-h-10 rounded-md px-2 text-xs font-bold ${value.mode === mode ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {mode === "weekly" ? "Por día" : "Siempre abierto"}
              </button>
            ))}
          </div>
          {value.mode === "weekly" ? WEEKDAY_DISPLAY_ORDER.map((weekday) => (
            <DayEditor key={weekday} weekday={weekday} hours={value} onChange={onChange} />
          )) : <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Este punto acepta recolecciones todos los días, a cualquier hora.</p>}
        </div>
      ) : null}
    </div>
  );
}

function DayEditor({
  weekday,
  hours,
  onChange,
}: PickupDayEditorProps) {
  const day = hours.days[weekday];
  const updateDay = (next: typeof day) => {
    const days = [...hours.days];
    days[weekday] = next;
    onChange({ ...hours, days });
  };
  const range = day.ranges[0] ?? emptyRange();

  return (
    <details className="group overflow-hidden rounded-lg border border-border bg-surface">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm">
        <span className="font-semibold text-foreground">{WEEKDAY_LABELS[weekday]}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {describeDay(day)} <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </span>
      </summary>
      <div className="space-y-3 border-t border-border-soft p-3">
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold text-foreground">
          Atiende este día
          <input
            type="checkbox"
            checked={!day.closed}
            onChange={(event) => updateDay(event.target.checked ? { closed: false, ranges: [range] } : { closed: true, ranges: [] })}
            className="h-5 w-5 accent-accent"
          />
        </label>
        {!day.closed ? (
          <div className="grid grid-cols-2 gap-3">
            <TimeField label="Abre" value={range.open} onChange={(open) => updateDay({ closed: false, ranges: [{ ...range, open }] })} />
            <TimeField label="Cierra" value={range.close} onChange={(close) => updateDay({ closed: false, ranges: [{ ...range, close }] })} />
          </div>
        ) : null}
      </div>
    </details>
  );
}

function TimeField({ label, value, onChange }: TimeFieldProps) {
  return <label className="text-xs font-semibold text-muted-foreground">{label}<input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground" /></label>;
}
