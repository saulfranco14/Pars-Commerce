"use client";

import { MapPin } from "lucide-react";

import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";

import type { ZonePickerProps } from "@/features/growth/interfaces/member";

const chipBase = "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function parseColonias(text: string): string[] {
  return [...new Set(text.split(",").map((item) => item.trim()).filter(Boolean))];
}

/** A municipio chip turns the whole municipio on; listing colonias narrows it to those. */
export function ZonePicker({ value, municipios, onChange }: ZonePickerProps) {
  const selected = new Map(value.map((zone) => [zone.municipio, zone]));

  function toggle(municipio: string) {
    onChange(selected.has(municipio) ? value.filter((zone) => zone.municipio !== municipio) : [...value, { municipio }]);
  }

  function setColonias(municipio: string, text: string) {
    const colonias = parseColonias(text);
    onChange(value.map((zone) => (zone.municipio === municipio ? (colonias.length ? { municipio, colonias } : { municipio }) : zone)));
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Municipios">
        {municipios.map((municipio) => {
          const on = selected.has(municipio);
          return (
            <button
              key={municipio}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(municipio)}
              className={`${chipBase} ${on ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-foreground hover:border-accent/50"}`}
            >
              <MapPin className="h-4 w-4" aria-hidden />
              {zoneByMunicipio(municipio)?.label ?? municipio}
            </button>
          );
        })}
      </div>
      {value.map((zone) => (
        <label key={zone.municipio} className="grid gap-1 text-sm">
          <span className="font-semibold text-foreground">
            {zoneByMunicipio(zone.municipio)?.label ?? zone.municipio}: ¿solo algunas colonias?
          </span>
          <input
            defaultValue={zone.colonias?.join(", ") ?? ""}
            onBlur={(event) => setColonias(zone.municipio, event.target.value)}
            placeholder="Vacío = todo el municipio. Ejemplo: Ciudad Azteca, Jardines de Morelos"
            className="input-form min-h-11 w-full rounded-xl border border-border bg-surface-raised px-3 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
      ))}
      {!value.length ? <p className="text-xs text-muted-foreground">Sin zonas solo verá los prospectos que le asignes o que él mismo dé de alta.</p> : null}
    </div>
  );
}
